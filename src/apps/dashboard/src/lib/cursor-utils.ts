export function computeNewCursor<T extends { lastUpdate?: number }>(
  items: T[],
): number {
  if (items.length === 0) return 0;
  return Math.max(...items.map((item) => item.lastUpdate || 0));
}

type MergeableItem = {
  _id: string;
  deleted?: boolean;
  lastUpdate?: number;
  storeId?: string;
};

export function mergeRows<T extends MergeableItem>(
  newRows: T[],
  cachedRows: T[],
): T[] {
  const cacheMap = new Map<string, T>();

  for (const row of cachedRows) {
    if (!row.deleted) {
      cacheMap.set(row._id, row);
    }
  }

  for (const row of newRows) {
    const id = row._id;
    if (row.deleted) {
      cacheMap.delete(id);
    } else {
      const existing = cacheMap.get(id);
      if (!existing || (row.lastUpdate || 0) >= (existing.lastUpdate || 0)) {
        cacheMap.set(id, row);
      }
    }
  }

  return Array.from(cacheMap.values());
}

export function filterByStoreId<T extends { storeId?: string }>(
  items: T[],
  storeId: string | undefined,
): T[] {
  if (!storeId) return items;
  return items.filter((item) => item.storeId === storeId);
}

export function mergeRowsWithStoreScope<T extends MergeableItem>(
  newRows: T[],
  cachedRows: T[],
  storeId: string,
): T[] {
  const cacheMap = new Map<string, T>();

  for (const row of cachedRows) {
    if (!row.deleted && row.storeId === storeId) {
      cacheMap.set(row._id, row);
    }
  }

  for (const row of newRows) {
    const id = row._id;
    if (row.deleted) {
      cacheMap.delete(id);
    } else {
      const existing = cacheMap.get(id);
      if (!existing || (row.lastUpdate || 0) >= (existing.lastUpdate || 0)) {
        cacheMap.set(id, { ...row, storeId: row.storeId || storeId });
      }
    }
  }

  return Array.from(cacheMap.values());
}

export function mergeWithCache<T extends MergeableItem>(
  newItems: T[],
  cachedItems: T[],
  idKey: keyof T = "_id" as keyof T,
): T[] {
  const cacheMap = new Map<string, T>();

  for (const item of cachedItems) {
    if (!item.deleted) {
      cacheMap.set(String(item[idKey]), item);
    }
  }

  for (const item of newItems) {
    const id = String(item[idKey]);
    if (item.deleted) {
      cacheMap.delete(id);
    } else {
      const existing = cacheMap.get(id);
      if (!existing || (item.lastUpdate || 0) >= (existing.lastUpdate || 0)) {
        cacheMap.set(id, item);
      }
    }
  }

  return Array.from(cacheMap.values());
}
