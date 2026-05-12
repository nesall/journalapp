import { writeFile, unlink, mkdir, rmdir } from 'fs/promises';
import { existsSync } from 'fs';
import { join, extname, dirname } from 'path';
import { randomBytes } from 'crypto';
import type { StorageProvider } from './types';
import sharp from 'sharp';

const UPLOAD_DIR = process.env.UPLOAD_DIR ?? 'static/uploads';
const BASE_URL = process.env.BASE_URL ?? '';

export class LocalStorageProvider implements StorageProvider {
  async uploadWithThumbnail(
    file: Buffer,
    filename: string,
    mimeType: string
  ): Promise<{ key: string; thumbnailKey: string }> {
    const key = await this.upload(file, filename, mimeType);

    // generate thumbnail
    const thumbnail = await sharp(file)
      .resize(300, 300, { fit: 'cover', position: 'centre' })
      .jpeg({ quality: 80 })
      .toBuffer();

    const thumbnailKey = await this.upload(thumbnail, `thumb_${filename}`, 'image/jpeg');
    return { key, thumbnailKey };
  }

  async upload(file: Buffer, filename: string, mimeType: string): Promise<string> {
    const ext = extname(filename) || this.extFromMime(mimeType);
    const key = `${randomBytes(16).toString('hex')}${ext}`;
    const dir = join(UPLOAD_DIR, key.substring(0, 2)); // shard by first 2 chars

    if (!existsSync(dir)) await mkdir(dir, { recursive: true });

    await writeFile(join(dir, key.substring(2)), file);
    return `${key.substring(0, 2)}/${key.substring(2)}`;
  }

  getUrl(key: string): string {
    return `${BASE_URL}/uploads/${key}`;
  }

  async delete(key: string): Promise<void> {
    const filepath = join(UPLOAD_DIR, key);
    await unlink(filepath).catch(() => { }); // ignore if already gone

    // remove parent dir if empty
    const dir = dirname(filepath);
    await rmdir(dir).catch(() => { }); // silently ignores if not empty
  }

  private extFromMime(mime: string): string {
    const map: Record<string, string> = {
      'image/jpeg': '.jpg',
      'image/png': '.png',
      'image/gif': '.gif',
      'image/webp': '.webp',
    };
    return map[mime] ?? '';
  }
}



/*
Since files land in static/uploads, SvelteKit serves them in dev.
In production with adapter-node, we'll want Nginx to serve /uploads/ directly from disk — bypasses Node entirely, much faster:
location /uploads/ {
    alias /var/www/journalapp/static/uploads/;
    expires 30d;
    add_header Cache-Control "public, immutable";
}
*/