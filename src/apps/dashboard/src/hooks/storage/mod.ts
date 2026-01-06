export interface StoredFile {
  uuid: string;
  name: string;
  type: string;
  size: number;
  blob: Blob;
  productId: string | null;
  order: number;
  status: "pending" | "uploading" | "uploaded" | "failed";
  retryCount: number;
  error?: string;
  createdAt: number;
}

export interface FileStorage {
  save(file: StoredFile): Promise<void>;
  get(uuid: string): Promise<StoredFile | null>;
  getAll(): Promise<StoredFile[]>;
  update(uuid: string, updates: Partial<StoredFile>): Promise<void>;
  delete(uuid: string): Promise<void>;
  clear(): Promise<void>;
}

export { IndexedDBStorage } from "./indexeddb";
