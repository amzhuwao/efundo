import {
  BadRequestException,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  GoogleGenerativeAI,
  type Content,
  type Part,
} from '@google/generative-ai';

export interface ChatTurn {
  role: 'user' | 'assistant';
  content: string;
}

@Injectable()
export class GeminiService {
  private client: GoogleGenerativeAI | null = null;
  private readonly modelName: string;

  constructor(private readonly config: ConfigService) {
    const apiKey =
      this.config.get<string>('GEMINI_API_KEY') ??
      this.config.get<string>('GOOGLE_API_KEY');
    if (apiKey) {
      this.client = new GoogleGenerativeAI(apiKey);
    }
    this.modelName =
      this.config.get<string>('GEMINI_MODEL') ?? 'gemini-2.5-flash';
  }

  isConfigured() {
    return !!this.client;
  }

  ensureConfigured() {
    if (!this.isConfigured()) {
      throw new BadRequestException(
        'GEMINI_API_KEY is not configured. Get a free key at aistudio.google.com/app/apikey and add it to apps/api/.env',
      );
    }
  }

  async chat(systemPrompt: string, turns: ChatTurn[]): Promise<string> {
    this.ensureConfigured();
    if (turns.length === 0) {
      throw new BadRequestException('No messages to send');
    }

    const model = this.client!.getGenerativeModel({
      model: this.modelName,
      systemInstruction: systemPrompt,
      generationConfig: {
        temperature: 0.6,
        maxOutputTokens: 2000,
      },
    });

    const history: Content[] = turns.slice(0, -1).map((turn) => ({
      role: turn.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: turn.content }],
    }));

    const last = turns[turns.length - 1];
    try {
      const chat = model.startChat({ history });
      const result = await chat.sendMessage(last.content);
      const text = result.response.text()?.trim();
      if (!text) {
        throw new Error('Gemini returned an empty response');
      }
      return text;
    } catch (err) {
      mapGeminiError(err);
    }
  }

  async generateJson(systemPrompt: string, userPrompt: string): Promise<string> {
    this.ensureConfigured();

    const model = this.client!.getGenerativeModel({
      model: this.modelName,
      systemInstruction: systemPrompt,
      generationConfig: {
        temperature: 0.4,
        responseMimeType: 'application/json',
      },
    });

    try {
      const result = await model.generateContent(userPrompt);
      const text = result.response.text()?.trim();
      if (!text) {
        throw new Error('Gemini returned an empty response');
      }
      return text;
    } catch (err) {
      mapGeminiError(err);
    }
  }

  async describeMultimodal(
    parts: Part[],
    options?: { maxOutputTokens?: number },
  ): Promise<string> {
    this.ensureConfigured();

    const model = this.client!.getGenerativeModel({
      model: this.modelName,
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: options?.maxOutputTokens ?? 2000,
      },
    });

    try {
      const result = await model.generateContent(parts);
      const text = result.response.text()?.trim();
      if (!text) {
        throw new Error('Gemini could not read this file');
      }
      return text;
    } catch (err) {
      mapGeminiError(err);
    }
  }

  async describeImage(buffer: Buffer, mimeType: string, prompt: string) {
    return this.describeMultimodal([
      { inlineData: { mimeType, data: buffer.toString('base64') } },
      { text: prompt },
    ]);
  }

  async transcribeVideo(buffer: Buffer, mimeType: string) {
    const maxInlineMb = Number(
      this.config.get<string>('GEMINI_MAX_INLINE_MB') ?? 20,
    );
    if (buffer.length > maxInlineMb * 1024 * 1024) {
      throw new Error(
        `Video is too large for Gemini inline processing (max ~${maxInlineMb}MB on free tier). Upload a shorter clip or a PDF transcript instead.`,
      );
    }

    return this.describeMultimodal(
      [
        { inlineData: { mimeType, data: buffer.toString('base64') } },
        {
          text: 'Transcribe all spoken words in this video. Output plain text only.',
        },
      ],
      { maxOutputTokens: 8000 },
    );
  }
}

export function mapGeminiError(err: unknown): never {
  const message = err instanceof Error ? err.message : String(err);
  const lower = message.toLowerCase();

  if (
    lower.includes('429') ||
    lower.includes('quota') ||
    lower.includes('resource_exhausted')
  ) {
    throw new ServiceUnavailableException(
      'Gemini rate limit reached. Wait a minute and try again, or set GEMINI_MODEL=gemini-2.5-flash in apps/api/.env',
    );
  }
  if (
    lower.includes('api_key_invalid') ||
    lower.includes('invalid api key') ||
    lower.includes('401')
  ) {
    throw new BadRequestException(
      'Invalid GEMINI_API_KEY. Get a key at aistudio.google.com/app/apikey',
    );
  }
  if (lower.includes('403') || lower.includes('permission')) {
    throw new BadRequestException(
      'Gemini access denied. Verify your API key and Google AI Studio access.',
    );
  }
  throw new BadRequestException(`AI service error: ${message}`);
}
