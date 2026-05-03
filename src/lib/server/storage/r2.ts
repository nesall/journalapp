import type { StorageProvider } from './types';

export class R2StorageProvider implements StorageProvider {
  async upload(file: Buffer, filename: string, mimeType: string): Promise<string> {
    throw new Error('R2 not configured');
  }

  getUrl(key: string): string {
    throw new Error('R2 not configured');
  }

  async delete(key: string): Promise<void> {
    throw new Error('R2 not configured');
  }
}