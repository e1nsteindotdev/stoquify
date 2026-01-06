export interface StorageSummary {
  opfs: {
    size: number;
    fileCount: number;
    supported: boolean;
  };
  indexedDB: {
    databaseCount: number;
    supported: boolean;
  };
  localStorage: {
    size: number;
    keyCount: number;
    supported: boolean;
  };
  cacheAPI: {
    cacheCount: number;
    supported: boolean;
  };
  total: {
    usage: number;
    quota: number;
  };
  lastCleared: Date | null;
}

export interface ClearStorageResult {
  success: boolean;
  opfs: boolean;
  indexedDB: boolean;
  localStorage: boolean;
  cacheAPI: boolean;
  errors: string[];
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

async function calculateOPFSSize(
  handle: FileSystemDirectoryHandle,
): Promise<{ size: number; fileCount: number }> {
  let totalSize = 0;
  let fileCount = 0;

  try {
    for await (const [name, entry] of handle as unknown as AsyncIterable<any>) {
      if (entry.kind === "file") {
        const file = await entry.getFile();
        totalSize += file.size;
        fileCount++;
      } else if (entry.kind === "directory") {
        const result = await calculateOPFSSize(
          entry as FileSystemDirectoryHandle,
        );
        totalSize += result.size;
        fileCount += result.fileCount;
      }
    }
  } catch {
    return { size: 0, fileCount: 0 };
  }

  return { size: totalSize, fileCount };
}

export async function getOPFSSize(): Promise<{
  size: number;
  fileCount: number;
  supported: boolean;
}> {
  if (!navigator.storage?.getDirectory) {
    return { size: 0, fileCount: 0, supported: false };
  }

  try {
    const opfsRoot = await navigator.storage.getDirectory();
    const result = await calculateOPFSSize(opfsRoot);
    return { ...result, supported: true };
  } catch {
    return { size: 0, fileCount: 0, supported: true };
  }
}

export async function getIndexedDBInfo(): Promise<{
  databaseCount: number;
  supported: boolean;
}> {
  if (!indexedDB?.databases) {
    return { databaseCount: 0, supported: false };
  }

  try {
    const databases = await indexedDB.databases();
    return { databaseCount: databases.length, supported: true };
  } catch {
    return { databaseCount: 0, supported: true };
  }
}

export async function getLocalStorageInfo(): Promise<{
  size: number;
  keyCount: number;
  supported: boolean;
}> {
  try {
    let size = 0;
    const keys = Object.keys(localStorage);

    for (const key of keys) {
      const value = localStorage.getItem(key);
      size += key.length + (value?.length || 0);
    }

    return { size, keyCount: keys.length, supported: true };
  } catch {
    return { size: 0, keyCount: 0, supported: false };
  }
}

export async function getCacheAPIInfo(): Promise<{
  cacheCount: number;
  supported: boolean;
}> {
  if (!caches?.keys) {
    return { cacheCount: 0, supported: false };
  }

  try {
    const cacheNames = await caches.keys();
    return { cacheCount: cacheNames.length, supported: true };
  } catch {
    return { cacheCount: 0, supported: true };
  }
}

export async function getTotalStorageEstimate(): Promise<{
  usage: number;
  quota: number;
}> {
  try {
    const estimate = await navigator.storage?.estimate();
    return {
      usage: estimate?.usage || 0,
      quota: estimate?.quota || 0,
    };
  } catch {
    return { usage: 0, quota: 0 };
  }
}

export async function getStorageSummary(): Promise<StorageSummary> {
  const [opfs, indexedDB, localStorage, cacheAPI, total] = await Promise.all([
    getOPFSSize(),
    getIndexedDBInfo(),
    getLocalStorageInfo(),
    getCacheAPIInfo(),
    getTotalStorageEstimate(),
  ]);

  return {
    opfs,
    indexedDB,
    localStorage,
    cacheAPI,
    total,
    lastCleared: null,
  };
}

export async function clearOPFS(): Promise<boolean> {
  if (!navigator.storage?.getDirectory) {
    return false;
  }

  try {
    const opfsRoot = await navigator.storage.getDirectory();

    if ("remove" in opfsRoot) {
      await (opfsRoot as any).remove({ recursive: true });
      return true;
    }

    async function clearDirectory(handle: FileSystemDirectoryHandle) {
      try {
        for await (const [
          name,
          entry,
        ] of handle as unknown as AsyncIterable<any>) {
          if (entry.kind === "file") {
            await entry.remove();
          } else if (entry.kind === "directory") {
            await clearDirectory(entry as FileSystemDirectoryHandle);
          }
        }
      } catch {
        return;
      }
    }

    await clearDirectory(opfsRoot);
    return true;
  } catch {
    return false;
  }
}

export async function clearIndexedDB(): Promise<boolean> {
  if (!indexedDB?.databases) {
    return false;
  }

  try {
    const databases = await indexedDB.databases();
    databases.forEach((db) => {
      if (db.name) {
        indexedDB.deleteDatabase(db.name);
      }
    });
    return true;
  } catch {
    return false;
  }
}

export async function clearLocalStorage(): Promise<boolean> {
  try {
    localStorage.clear();
    return true;
  } catch {
    return false;
  }
}

export async function clearCacheAPI(): Promise<boolean> {
  if (!caches?.keys) {
    return false;
  }

  try {
    const cacheNames = await caches.keys();
    await Promise.all(cacheNames.map((name) => caches.delete(name)));
    return true;
  } catch {
    return false;
  }
}

export async function clearAllStorage(): Promise<ClearStorageResult> {
  const result: ClearStorageResult = {
    success: false,
    opfs: false,
    indexedDB: false,
    localStorage: false,
    cacheAPI: false,
    errors: [],
  };

  result.opfs = await clearOPFS();
  if (!result.opfs) result.errors.push("Failed to clear OPFS");

  result.indexedDB = await clearIndexedDB();
  if (!result.indexedDB) result.errors.push("Failed to clear IndexedDB");

  result.localStorage = await clearLocalStorage();
  if (!result.localStorage) result.errors.push("Failed to clear localStorage");

  result.cacheAPI = await clearCacheAPI();
  if (!result.cacheAPI) result.errors.push("Failed to clear Cache API");

  result.success =
    result.opfs && result.indexedDB && result.localStorage && result.cacheAPI;

  return result;
}
