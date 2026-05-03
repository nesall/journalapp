export interface StorageProvider {
    upload(file: Buffer, filename: string, mimeType: string): Promise<string>;
    getUrl(key: string): string;
    delete(key: string): Promise<void>;
}