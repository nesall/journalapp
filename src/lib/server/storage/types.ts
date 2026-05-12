export interface StorageProvider {
    upload(file: Buffer, filename: string, mimeType: string): Promise<string>;
    uploadWithThumbnail(file: Buffer, filename: string, mimeType: string): Promise<{ key: string; thumbnailKey: string }>;
    getUrl(key: string): string;
    delete(key: string): Promise<void>;
}