import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';

export interface GeneratedLessonBlock {
  type: 'heading' | 'paragraph' | 'list' | 'code';
  text?: string;
  items?: string[];
  language?: string;
}

export interface GeneratedLesson {
  title: string;
  slug: string;
  summary: string;
  durationMinutes: number;
  difficulty: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  objectives: string[];
  prerequisites: string[];
  content: GeneratedLessonBlock[];
  sourceTitles?: string[];
}

export interface GeneratedTopic {
  title: string;
  slug: string;
  description?: string;
  lessons: GeneratedLesson[];
}

export interface GeneratedModule {
  title: string;
  slug: string;
  description?: string;
  topics: GeneratedTopic[];
}

export interface GeneratedCourseOutline {
  modules: GeneratedModule[];
  overview?: string;
}

interface SourceChunk {
  title: string;
  type: string;
  text: string;
}

@Injectable()
export class GenerationService {
  private openai: OpenAI | null = null;
  private readonly model: string;

  constructor(private readonly config: ConfigService) {
    const apiKey = this.config.get<string>('OPENAI_API_KEY');
    if (apiKey) {
      this.openai = new OpenAI({ apiKey });
    }
    this.model = this.config.get<string>('OPENAI_MODEL') ?? 'gpt-4o-mini';
  }

  ensureConfigured() {
    if (!this.openai) {
      throw new Error(
        'OPENAI_API_KEY is not configured. Add it to apps/api/.env to use AI lesson generation.',
      );
    }
  }

  async generateOutline(
    projectTitle: string,
    instructions: string | null,
    sources: SourceChunk[],
  ): Promise<GeneratedCourseOutline> {
    this.ensureConfigured();

    const maxChars = Number(this.config.get<string>('AI_MAX_SOURCE_CHARS') ?? 120_000);
    const combined = this.buildSourceCorpus(sources, maxChars);

    const systemPrompt = `You are an expert instructional designer helping educators build structured online courses.
You receive source material (PDF text and/or video transcripts) and produce a course outline as JSON.

Rules:
- Ground content in the provided sources; do not invent facts not supported by the material.
- Write original explanatory prose (do not copy long passages verbatim from sources).
- Use clear headings, short paragraphs, and bullet lists suitable for a learning platform.
- Slugs must be lowercase kebab-case, unique within their parent scope.
- Create 2-4 modules, each with 1-3 topics, each topic with 1-3 lessons unless the source material is very short.
- Each lesson needs at least 3 content blocks mixing headings, paragraphs, and lists.
- Include sourceTitles on lessons listing which source documents informed that lesson.

Return ONLY valid JSON matching this schema:
{
  "overview": "string",
  "modules": [{
    "title": "string",
    "slug": "string",
    "description": "string",
    "topics": [{
      "title": "string",
      "slug": "string",
      "description": "string",
      "lessons": [{
        "title": "string",
        "slug": "string",
        "summary": "string",
        "durationMinutes": number,
        "difficulty": "BEGINNER" | "INTERMEDIATE" | "ADVANCED",
        "objectives": ["string"],
        "prerequisites": ["string"],
        "sourceTitles": ["string"],
        "content": [
          { "type": "heading", "text": "string" },
          { "type": "paragraph", "text": "string" },
          { "type": "list", "items": ["string"] }
        ]
      }]
    }]
  }]
}`;

    const userPrompt = `Project title: ${projectTitle}
${instructions ? `Educator instructions: ${instructions}\n` : ''}
Source material:
${combined}`;

    const response = await this.openai!.chat.completions.create({
      model: this.model,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.4,
    });

    const raw = response.choices[0]?.message?.content;
    if (!raw) {
      throw new Error('AI returned an empty response');
    }

    let parsed: GeneratedCourseOutline;
    try {
      parsed = JSON.parse(raw) as GeneratedCourseOutline;
    } catch {
      throw new Error('AI returned invalid JSON');
    }

    if (!parsed.modules?.length) {
      throw new Error('AI did not generate any modules');
    }

    return parsed;
  }

  private buildSourceCorpus(sources: SourceChunk[], maxChars: number) {
    const parts: string[] = [];
    let used = 0;

    for (const source of sources) {
      const header = `\n--- SOURCE: ${source.title} (${source.type}) ---\n`;
      const budget = maxChars - used - header.length;
      if (budget <= 500) break;

      const slice = source.text.slice(0, budget);
      parts.push(header + slice);
      used += header.length + slice.length;
    }

    return parts.join('\n');
  }
}
