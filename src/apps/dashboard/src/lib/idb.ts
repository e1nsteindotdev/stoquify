import { openDB, IDBPDatabase } from "idb";

let dbPromise: Promise<IDBPDatabase> | null = null;

const DATA_STORES = [
  "products",
  "user",
  "users",
  "sales",
  "categories",
  "faqs",
  "collections",
  "settings",
  "analytics",
  "customers",
  "expenses",
  "expenseCategories",
  "todos",
  "stores",
  "saleItems",
  "wilayat",
];

const STORES = [...DATA_STORES, "metadata"];

const DB_NAME = "app-db";
const DB_VERSION = 6;

export const idbPromise = (): Promise<IDBPDatabase> => {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db, oldVersion) {
        if (oldVersion < 6) {
          for (const store of STORES) {
            if (!db.objectStoreNames.contains(store)) {
              db.createObjectStore(store);
            }
          }
        }
      },
    });
  }
  return dbPromise;
};

function buildKey(key: string, scope?: string): string {
  return scope ? `${scope}:${key}` : key;
}

export async function idbGet<T = any>(
  store: string,
  scope?: string,
): Promise<T | null> {
  try {
    const db = await idbPromise();
    const key = buildKey("all", scope);
    const data = await db.get(store, key);
    return data ?? [];
  } catch (e) {
    console.warn(`[idb] Failed to get from ${store}:`, String(e));
    return null;
  }
}

export async function idbGetAllScopes<T = any>(
  store: string,
): Promise<Array<{ scope: string; data: T }>> {
  try {
    const db = await idbPromise();
    const allKeys = await db.getAllKeys(store);
    const results: Array<{ scope: string; data: T }> = [];

    for (const key of allKeys) {
      const keyStr = String(key);
      if (keyStr === "all") continue;

      const scopeMatch = keyStr.match(/^(.+):all$/);
      if (scopeMatch) {
        const data = await db.get(store, key);
        if (data !== undefined) {
          results.push({ scope: scopeMatch[1], data });
        }
      }
    }

    return results;
  } catch (e) {
    console.warn(`[idb] Failed to get all scopes from ${store}:`, String(e));
    return [];
  }
}

export async function idbPut(
  store: string,
  data: any,
  scope?: string,
): Promise<void> {
  try {
    const db = await idbPromise();
    const key = buildKey("all", scope);
    await db.put(store, data, key);
  } catch (e) {
    console.warn(`[idb] Failed to put to ${store}:`, String(e));
  }
}

export async function idbClear(store: string, scope?: string): Promise<void> {
  try {
    const db = await idbPromise();
    if (scope) {
      const key = buildKey("all", scope);
      await db.delete(store, key);
    } else {
      await db.clear(store);
    }
  } catch (e) {
    console.warn(`[idb] Failed to clear ${store}:`, String(e));
  }
}

export async function idbRefresh(
  store: string,
  data: any,
  scope?: string,
): Promise<void> {
  const db = await idbPromise();
  const key = buildKey("all", scope);

  try {
    await db.delete(store, key);
  } catch (e) {
    // Ignore delete errors
  }

  try {
    await db.put(store, data, key);
  } catch (e) {
    console.warn(`[idb] Failed to refresh ${store}:`, String(e));
  }
}

export async function clearIDB(): Promise<void> {
  await Promise.all(
    STORES.map(async (store) => {
      try {
        await idbClear(store);
      } catch (e) {
        // Ignore
      }
    }),
  );
}

export async function clearStoreScope(
  store: string,
  scope: string,
): Promise<void> {
  await idbClear(store, scope);
}

export async function idbGetCursor(
  collectionName: string,
  scope?: string,
): Promise<number | null> {
  try {
    const db = await idbPromise();
    const key = buildKey(`cursor:${collectionName}`, scope);
    const cursor = await db.get("metadata", key);
    return typeof cursor === "number" ? cursor : null;
  } catch (e) {
    console.warn(
      `[idb] Failed to get cursor for ${collectionName}:`,
      String(e),
    );
    return null;
  }
}

export async function idbSetCursor(
  collectionName: string,
  cursor: number,
  scope?: string,
): Promise<void> {
  try {
    const db = await idbPromise();
    const key = buildKey(`cursor:${collectionName}`, scope);
    await db.put("metadata", cursor, key);
  } catch (e) {
    console.warn(
      `[idb] Failed to set cursor for ${collectionName}:`,
      String(e),
    );
  }
}

export async function idbClearCursor(
  collectionName: string,
  scope?: string,
): Promise<void> {
  try {
    const db = await idbPromise();
    const key = buildKey(`cursor:${collectionName}`, scope);
    await db.delete("metadata", key);
  } catch (e) {
    console.warn(
      `[idb] Failed to clear cursor for ${collectionName}:`,
      String(e),
    );
  }
}

export async function idbClearAllCursors(scope?: string): Promise<void> {
  try {
    const db = await idbPromise();
    const allKeys = await db.getAllKeys("metadata");

    for (const key of allKeys) {
      const keyStr = String(key);
      if (!keyStr.startsWith("cursor:")) continue;

      if (scope) {
        if (keyStr.includes(`:${scope}:`) || keyStr.endsWith(`:${scope}`)) {
          await db.delete("metadata", key);
        }
      } else {
        await db.delete("metadata", key);
      }
    }
  } catch (e) {
    console.warn(`[idb] Failed to clear all cursors:`, String(e));
  }
}

export async function idbValidateSync(
  collectionName: string,
  scope: string,
  serverCount: number,
): Promise<{ isValid: boolean; localCount: number }> {
  try {
    const cachedData = await idbGet<any[]>(collectionName, scope);
    const localCount = Array.isArray(cachedData) ? cachedData.length : 0;

    const tolerance = Math.max(5, Math.floor(serverCount * 0.1));
    const isValid = Math.abs(localCount - serverCount) <= tolerance;

    if (!isValid) {
      console.warn(
        `[idb] Sync validation failed for ${collectionName}: local=${localCount}, server=${serverCount}`,
      );
    }

    return { isValid, localCount };
  } catch (e) {
    console.warn(`[idb] Failed to validate sync:`, String(e));
    return { isValid: false, localCount: 0 };
  }
}
