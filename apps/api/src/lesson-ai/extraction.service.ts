import { Injectable } from '@nestjs/common';
import { AiSourceType } from '@prisma/client';
import { GeminiService } from '../ai/gemini.service';
import { StorageService } from '../storage/storage.service';

@Injectable()
export class ExtractionService {
  constructor(
    private readonly storage: StorageService,
    private readonly gemini: GeminiService,
  ) {}

  hasAi() {
    return this.gemini.isConfigured();
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
      return this.gemini.transcribeVideo(
        buffer,
        mimeType ?? 'video/mp4',
      );
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
      return this.gemini.describeImage(
        buffer,
        mimeType,
        'This is a student assignment image. Extract all visible text (including handwriting if legible) and describe diagrams, equations, or questions. Output plain text only.',
      );
    }

    throw new Error(
      'Unsupported file type. Upload a PDF, text file, or image (PNG, JPG, WebP).',
    );
  }
}
