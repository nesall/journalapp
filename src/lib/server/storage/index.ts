import { LocalStorageProvider } from './local';
import { R2StorageProvider } from './r2';
import type { StorageProvider } from './types';

const provider: StorageProvider =
  process.env.STORAGE_PROVIDER === 'r2'
    ? new R2StorageProvider()
    : new LocalStorageProvider();

export default provider;