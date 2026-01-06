import { FileStorage, StoredFile } from "./mod";

const DB_NAME = "stoquify-image-uploads";
const STORE_NAME = "files";
const DB_VERSION = 1;

export class IndexedDBStorage implements FileStorage {
  private dbPromise: Promise<IDBDatabase> | null = null;

  private ensureDB(): Promise<IDBDatabase> {
    if (this.dbPromise) {
      return this.dbPromise;
    }

    this.dbPromise = new Promise((resolve, reject) => {
      if (typeof indexedDB === "undefined") {
        reject(new Error("IndexedDB is not available"));
        return;
      }

      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        this.dbPromise = null;
        reject(request.error ?? new Error("Failed to open IndexedDB"));
      };

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: "uuid" });
        }
      };
    });

    return this.dbPromise;
  }

  async save(file: StoredFile): Promise<void> {
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, "readwrite");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.put(file);

      request.onsuccess = () => resolve();
      request.onerror = () =>
        reject(request.error ?? new Error("Failed to save file"));
    });
  }

  async get(uuid: string): Promise<StoredFile | null> {
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, "readonly");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(uuid);

      request.onsuccess = () => {
        resolve(request.result ?? null);
      };
      request.onerror = () =>
        reject(request.error ?? new Error("Failed to get file"));
    });
  }

  async getAll(): Promise<StoredFile[]> {
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, "readonly");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();

      request.onsuccess = () => {
        resolve(request.result ?? []);
      };
      request.onerror = () =>
        reject(request.error ?? new Error("Failed to get all files"));
    });
  }

  async update(uuid: string, updates: Partial<StoredFile>): Promise<void> {
    const existing = await this.get(uuid);
    if (!existing) {
      throw new Error(`File with uuid ${uuid} not found`);
    }

    const updated: StoredFile = { ...existing, ...updates };
    await this.save(updated);
  }

  async delete(uuid: string): Promise<void> {
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, "readwrite");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(uuid);

      request.onsuccess = () => resolve();
      request.onerror = () =>
        reject(request.error ?? new Error("Failed to delete file"));
    });
  }

  async clear(): Promise<void> {
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, "readwrite");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.clear();

      request.onsuccess = () => resolve();
      request.onerror = () =>
        reject(request.error ?? new Error("Failed to clear files"));
    });
  }
}

export const fileStorage = new IndexedDBStorage();
