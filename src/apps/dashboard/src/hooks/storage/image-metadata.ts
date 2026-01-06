export interface ImageMetadata {
  id: string;
  url?: string;
  status: "pending" | "uploading" | "uploaded" | "failed";
  retryCount: number;
  error?: string;
}

export interface ImageMetadataStorage {
  get(id: string): Promise<ImageMetadata | null>;
  getAll(): Promise<ImageMetadata[]>;
  save(metadata: ImageMetadata): Promise<void>;
  update(id: string, updates: Partial<ImageMetadata>): Promise<void>;
  delete(id: string): Promise<void>;
  clear(): Promise<void>;
}

const DB_NAME = "stoquify-image-metadata";
const STORE_NAME = "metadata";
const DB_VERSION = 1;

export class IndexedDBImageMetadata implements ImageMetadataStorage {
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
          db.createObjectStore(STORE_NAME, { keyPath: "id" });
        }
      };
    });

    return this.dbPromise;
  }

  async get(id: string): Promise<ImageMetadata | null> {
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, "readonly");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(id);

      request.onsuccess = () => {
        resolve(request.result ?? null);
      };
      request.onerror = () =>
        reject(request.error ?? new Error("Failed to get metadata"));
    });
  }

  async getAll(): Promise<ImageMetadata[]> {
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, "readonly");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();

      request.onsuccess = () => {
        resolve(request.result ?? []);
      };
      request.onerror = () =>
        reject(request.error ?? new Error("Failed to get all metadata"));
    });
  }

  async save(metadata: ImageMetadata): Promise<void> {
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, "readwrite");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.put(metadata);

      request.onsuccess = () => resolve();
      request.onerror = () =>
        reject(request.error ?? new Error("Failed to save metadata"));
    });
  }

  async update(id: string, updates: Partial<ImageMetadata>): Promise<void> {
    const existing = await this.get(id);
    if (!existing) {
      throw new Error(`Metadata with id ${id} not found`);
    }

    const updated: ImageMetadata = { ...existing, ...updates };
    await this.save(updated);
  }

  async delete(id: string): Promise<void> {
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, "readwrite");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () =>
        reject(request.error ?? new Error("Failed to delete metadata"));
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
        reject(request.error ?? new Error("Failed to clear metadata"));
    });
  }
}

export const imageMetadataStorage = new IndexedDBImageMetadata();
