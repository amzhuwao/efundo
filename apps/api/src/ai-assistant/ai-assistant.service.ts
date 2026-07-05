import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  AiChatRole,
  AiSourceStatus,
  LessonStatus,
  Prisma,
} from '@prisma/client';
import OpenAI from 'openai';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import { ExtractionService } from '../lesson-ai/extraction.service';
import {
  CreateAssistantSessionDto,
  SendAssistantMessageDto,
} from './dto/ai-assistant.dto';

const MAX_HISTORY = 24;
const MAX_CONTEXT_CHARS = 60_000;

@Injectable()
export class AiAssistantService {
  private openai: OpenAI | null = null;
  private readonly model: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
    private readonly extraction: ExtractionService,
    private readonly config: ConfigService,
  ) {
    const apiKey = this.config.get<string>('OPENAI_API_KEY');
    if (apiKey) this.openai = new OpenAI({ apiKey });
    this.model = this.config.get<string>('OPENAI_MODEL') ?? 'gpt-4o-mini';
  }

  private sessionInclude = {
    subject: { select: { id: true, name: true, code: true } },
    lesson: {
      select: {
        id: true,
        title: true,
        summary: true,
        objectives: true,
        content: true,
        topic: {
          select: {
            title: true,
            module: { select: { title: true, subjectId: true } },
          },
        },
      },
    },
    files: { orderBy: { createdAt: 'asc' as const } },
    messages: { orderBy: { createdAt: 'asc' as const } },
  };

  private async getOwnedSession(sessionId: string, userId: string) {
    const session = await this.prisma.aiAssistantSession.findUnique({
      where: { id: sessionId },
      include: this.sessionInclude,
    });
    if (!session) throw new NotFoundException('Conversation not found');
    if (session.userId !== userId) throw new ForbiddenException();
    return session;
  }

  async createSession(userId: string, dto: CreateAssistantSessionDto) {
    let subjectId = dto.subjectId;
    let title = dto.title?.trim() || 'New conversation';
    let lessonId = dto.lessonId;

    if (lessonId) {
      const lesson = await this.prisma.lesson.findUnique({
        where: { id: lessonId },
        include: {
          topic: { include: { module: { include: { subject: true } } } },
        },
      });
      if (!lesson || lesson.status !== LessonStatus.PUBLISHED) {
        throw new NotFoundException('Lesson not found');
      }
      subjectId = lesson.topic.module.subjectId;
      if (!dto.title) {
        title = `Help with: ${lesson.title}`;
      }
    }

    if (subjectId) {
      const subject = await this.prisma.subject.findUnique({
        where: { id: subjectId },
      });
      if (!subject) throw new NotFoundException('Subject not found');
    }

    return this.prisma.aiAssistantSession.create({
      data: {
        userId,
        subjectId,
        lessonId,
        title,
      },
      include: this.sessionInclude,
    });
  }

  listSessions(userId: string) {
    return this.prisma.aiAssistantSession.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
      include: {
        subject: { select: { id: true, name: true, code: true } },
        lesson: { select: { id: true, title: true } },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: { content: true, role: true, createdAt: true },
        },
        _count: { select: { messages: true, files: true } },
      },
    });
  }

  getSession(sessionId: string, userId: string) {
    return this.getOwnedSession(sessionId, userId);
  }

  async deleteSession(sessionId: string, userId: string) {
    const session = await this.getOwnedSession(sessionId, userId);
    for (const file of session.files) {
      await this.storage.deleteLocal(file.fileKey);
    }
    await this.prisma.aiAssistantSession.delete({ where: { id: sessionId } });
    return { ok: true };
  }

  async uploadFile(
    sessionId: string,
    userId: string,
    file: Express.Multer.File,
  ) {
    await this.getOwnedSession(sessionId, userId);

    const fileKey = this.storage.generateFileKey(
      'ai-assistant',
      sessionId,
      file.originalname,
    );
    await this.storage.saveLocal(fileKey, file.buffer);

    const record = await this.prisma.aiAssistantFile.create({
      data: {
        sessionId,
        fileName: file.originalname,
        fileKey,
        mimeType: file.mimetype,
        fileSize: file.size,
        status: AiSourceStatus.EXTRACTING,
      },
    });

    void this.extractFile(record.id, file.buffer, file.mimetype, file.originalname);

    await this.prisma.aiAssistantSession.update({
      where: { id: sessionId },
      data: { updatedAt: new Date() },
    });

    return record;
  }

  private async extractFile(
    fileId: string,
    buffer: Buffer,
    mimeType: string,
    fileName: string,
  ) {
    try {
      const text = await this.extraction.extractAssignment(
        buffer,
        mimeType,
        fileName,
      );
      await this.prisma.aiAssistantFile.update({
        where: { id: fileId },
        data: { extractedText: text, status: AiSourceStatus.READY },
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Extraction failed';
      await this.prisma.aiAssistantFile.update({
        where: { id: fileId },
        data: { status: AiSourceStatus.FAILED, errorMessage: message },
      });
    }
  }

  async removeFile(sessionId: string, fileId: string, userId: string) {
    await this.getOwnedSession(sessionId, userId);
    const file = await this.prisma.aiAssistantFile.findFirst({
      where: { id: fileId, sessionId },
    });
    if (!file) throw new NotFoundException('File not found');
    await this.storage.deleteLocal(file.fileKey);
    await this.prisma.aiAssistantFile.delete({ where: { id: fileId } });
    return { ok: true };
  }

  async sendMessage(
    sessionId: string,
    userId: string,
    dto: SendAssistantMessageDto,
  ) {
    if (!this.openai) {
      throw new BadRequestException(
        'AI assistant is not configured. Ask your administrator to set OPENAI_API_KEY.',
      );
    }

    const session = await this.getOwnedSession(sessionId, userId);

    const pending = session.files.some(
      (f) => f.status === AiSourceStatus.PENDING || f.status === AiSourceStatus.EXTRACTING,
    );
    if (pending) {
      throw new BadRequestException(
        'Please wait for uploaded files to finish processing before sending a message.',
      );
    }

    const userMessage = await this.prisma.aiAssistantMessage.create({
      data: {
        sessionId,
        role: AiChatRole.USER,
        content: dto.content.trim(),
      },
    });

    const isFirstUserMessage =
      session.messages.filter((m) => m.role === AiChatRole.USER).length === 0;
    if (isFirstUserMessage && session.title === 'New conversation') {
      const autoTitle = dto.content.trim().slice(0, 60);
      await this.prisma.aiAssistantSession.update({
        where: { id: sessionId },
        data: { title: autoTitle.length < dto.content.length ? `${autoTitle}…` : autoTitle },
      });
    }

    const history = await this.prisma.aiAssistantMessage.findMany({
      where: { sessionId },
      orderBy: { createdAt: 'desc' },
      take: MAX_HISTORY,
    });

    const contextBlock = this.buildContext(session);
    const systemPrompt = `You are eFundo AI, a friendly and patient learning assistant for students in Zimbabwe and beyond.

Your role:
- Help students understand lessons, concepts, and their own uploaded assignments.
- Guide them step-by-step without simply giving away full answers on graded work — teach the reasoning.
- When assignment files are provided, reference them specifically and ask clarifying questions.
- Use clear, encouraging language appropriate for secondary school and university learners.
- If you lack information, say so honestly rather than guessing.

${contextBlock}`;

    const chatMessages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      { role: 'system', content: systemPrompt },
      ...history
        .reverse()
        .filter((m) => m.role !== AiChatRole.SYSTEM)
        .map((m) => ({
          role: m.role === AiChatRole.USER ? ('user' as const) : ('assistant' as const),
          content: m.content,
        })),
    ];

    const completion = await this.openai.chat.completions.create({
      model: this.model,
      messages: chatMessages,
      temperature: 0.6,
      max_tokens: 2000,
    });

    const reply =
      completion.choices[0]?.message?.content?.trim() ||
      'I could not generate a response. Please try rephrasing your question.';

    const assistantMessage = await this.prisma.aiAssistantMessage.create({
      data: {
        sessionId,
        role: AiChatRole.ASSISTANT,
        content: reply,
      },
    });

    await this.prisma.aiAssistantSession.update({
      where: { id: sessionId },
      data: { updatedAt: new Date() },
    });

    return { userMessage, assistantMessage };
  }

  private buildContext(session: {
    subject: { name: string; code: string } | null;
    lesson: {
      title: string;
      summary: string | null;
      objectives: string[];
      content: Prisma.JsonValue;
      topic: { title: string; module: { title: string } };
    } | null;
    files: { fileName: string; extractedText: string | null; status: AiSourceStatus }[];
  }) {
    const parts: string[] = [];

    if (session.subject) {
      parts.push(`Course context: ${session.subject.name} (${session.subject.code})`);
    }

    if (session.lesson) {
      const l = session.lesson;
      parts.push(
        `Current lesson: "${l.title}" in ${l.topic.module.title} → ${l.topic.title}`,
      );
      if (l.summary) parts.push(`Lesson summary: ${l.summary}`);
      if (l.objectives.length) {
        parts.push(`Learning objectives: ${l.objectives.join('; ')}`);
      }
      const lessonText = this.lessonContentToText(l.content);
      if (lessonText) {
        parts.push(`Lesson content excerpt:\n${lessonText.slice(0, 12_000)}`);
      }
    }

    const readyFiles = session.files.filter(
      (f) => f.status === AiSourceStatus.READY && f.extractedText,
    );
    if (readyFiles.length) {
      let used = parts.join('\n').length;
      for (const file of readyFiles) {
        const header = `\n--- Uploaded assignment: ${file.fileName} ---\n`;
        const budget = MAX_CONTEXT_CHARS - used - header.length;
        if (budget <= 200) break;
        const slice = file.extractedText!.slice(0, budget);
        parts.push(header + slice);
        used += header.length + slice.length;
      }
    }

    return parts.length ? parts.join('\n') : 'No specific course or file context yet.';
  }

  private lessonContentToText(content: Prisma.JsonValue): string {
    if (!Array.isArray(content)) return '';
    return content
      .map((block) => {
        if (!block || typeof block !== 'object') return '';
        const b = block as Record<string, unknown>;
        const type = b.type;
        if (type === 'heading' || type === 'paragraph') return String(b.text ?? '');
        if (type === 'list' && Array.isArray(b.items)) {
          return (b.items as string[]).map((i) => `• ${i}`).join('\n');
        }
        if (type === 'code') return String(b.text ?? '');
        return '';
      })
      .filter(Boolean)
      .join('\n\n');
  }
}
