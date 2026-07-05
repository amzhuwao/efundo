import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';
import { randomUUID } from 'crypto';

@Injectable()
export class StorageService {
  private readonly driver: 'local' | 's3';
  private readonly uploadDir: string;

  constructor(private readonly config: ConfigService) {
    this.driver =
      (config.get<string>('STORAGE_DRIVER') as 'local' | 's3') ?? 'local';
    this.uploadDir =
      config.get<string>('UPLOAD_DIR') ??
      path.join(process.cwd(), 'uploads');
    if (this.driver === 'local' && !fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  generateFileKey(institutionSlug: string, resourceId: string, fileName: string) {
    const safe = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
    return `${institutionSlug}/${resourceId}/${randomUUID()}-${safe}`;
  }

  getLocalPath(fileKey: string) {
    return path.join(this.uploadDir, fileKey);
  }

  async saveLocal(fileKey: string, buffer: Buffer) {
    const fullPath = this.getLocalPath(fileKey);
    fs.mkdirSync(path.dirname(fullPath), { recursive: true });
    await fs.promises.writeFile(fullPath, buffer);
  }

  async readLocal(fileKey: string): Promise<Buffer> {
    return fs.promises.readFile(this.getLocalPath(fileKey));
  }

  async deleteLocal(fileKey: string) {
    const fullPath = this.getLocalPath(fileKey);
    if (fs.existsSync(fullPath)) {
      await fs.promises.unlink(fullPath);
    }
  }

  fileExists(fileKey: string): boolean {
    return fs.existsSync(this.getLocalPath(fileKey));
  }

  getDownloadUrl(fileKey: string, apiBase: string) {
    return `${apiBase}/api/v1/library/files/${encodeURIComponent(fileKey)}`;
  }
}
