import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AiSourceType } from '@prisma/client';
import OpenAI, { toFile } from 'openai';
import { StorageService } from '../storage/storage.service';

@Injectable()
export class ExtractionService {
  private openai: OpenAI | null = null;

  constructor(
    private readonly storage: StorageService,
    private readonly config: ConfigService,
  ) {
    const apiKey = this.config.get<string>('OPENAI_API_KEY');
    if (apiKey) {
      this.openai = new OpenAI({ apiKey });
    }
  }

  hasOpenAi() {
    return !!this.openai;
  }

  async extractFromSource(
    type: AiSourceType,
    fileKey: string | null,
    fileName: string | null,
    mimeType: string | null,
  ): Promise<string> {
    if (!fileKey) {
      throw new Error('Source file is missing');
    }

    const buffer = await this.storage.readLocal(fileKey);

    if (type === AiSourceType.PDF) {
      return this.extractPdf(buffer);
    }

    if (type === AiSourceType.VIDEO) {
      return this.transcribeVideo(buffer, fileName ?? 'video.mp4', mimeType);
    }

    throw new Error(`Unsupported source type: ${type}`);
  }

  private async extractPdf(buffer: Buffer): Promise<string> {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const pdfParse = require('pdf-parse') as (data: Buffer) => Promise<{ text: string }>;
    const result = await pdfParse(buffer);
    const text = result.text?.trim();
    if (!text) {
      throw new Error('No text could be extracted from this PDF');
    }
    return text;
  }

  private async transcribeVideo(
    buffer: Buffer,
    fileName: string,
    mimeType: string | null,
  ): Promise<string> {
    if (!this.openai) {
      throw new Error(
        'OPENAI_API_KEY is required to transcribe video sources. Add it to apps/api/.env',
      );
    }

    const file = await toFile(buffer, fileName, {
      type: mimeType ?? 'video/mp4',
    });

    const transcription = await this.openai.audio.transcriptions.create({
      file,
      model: 'whisper-1',
      response_format: 'text',
    });

    const text = transcription.trim();
    if (!text) {
      throw new Error('No speech could be transcribed from this video');
    }
    return text;
  }

  async extractAssignment(
    buffer: Buffer,
    mimeType: string,
    fileName: string,
  ): Promise<string> {
    if (mimeType === 'application/pdf') {
      return this.extractPdf(buffer);
    }

    if (mimeType.startsWith('text/')) {
      const text = buffer.toString('utf-8').trim();
      if (!text) throw new Error('File appears to be empty');
      return text.slice(0, 80_000);
    }

    if (mimeType.startsWith('image/')) {
      return this.describeImage(buffer, mimeType);
    }

    throw new Error(
      'Unsupported file type. Upload a PDF, text file, or image (PNG, JPG, WebP).',
    );
  }

  private async describeImage(buffer: Buffer, mimeType: string): Promise<string> {
    if (!this.openai) {
      throw new Error('OPENAI_API_KEY is required to read image assignments.');
    }

    const base64 = buffer.toString('base64');
    const response = await this.openai.chat.completions.create({
      model: this.config.get<string>('OPENAI_MODEL') ?? 'gpt-4o-mini',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'This is a student assignment image. Extract all visible text (including handwriting if legible) and describe diagrams, equations, or questions. Output plain text only.',
            },
            {
              type: 'image_url',
              image_url: { url: `data:${mimeType};base64,${base64}` },
            },
          ],
        },
      ],
      max_tokens: 2000,
    });

    const text = response.choices[0]?.message?.content?.trim();
    if (!text) throw new Error('Could not read content from this image');
    return text;
  }
}
