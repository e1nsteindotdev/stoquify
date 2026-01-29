export interface StoredFile {
  indexedDBId: number;
  blob: Blob;
}

export interface FileStorage {
  save(file: StoredFile): Promise<void>;
  get(indexedDBId: number): Promise<StoredFile | null>;
  getAll(): Promise<StoredFile[]>;
  update(indexedDBId: number, updates: Partial<StoredFile>): Promise<void>;
  delete(indexedDBId: number): Promise<void>;
  clear(): Promise<void>;
}

export { IndexedDBStorage } from "./indexeddb";
