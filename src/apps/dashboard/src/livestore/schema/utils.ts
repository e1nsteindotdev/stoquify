export function uniqueBy<T, K>(
  array: ReadonlyArray<T>,
  keyFn: (item: T) => K,
): T[] {
  const seen = new Set<K>();
  const result: T[] = [];
  for (const item of array) {
    const key = keyFn(item);
    if (!seen.has(key)) {
      seen.add(key);
      result.push(item);
    }
  }
  return result;
}

export function groupRows<R, G>(
  rows: ReadonlyArray<R>,
  groupKeyFn: (row: R) => string,
  groupMapper: (groupRows: R[]) => G,
): G[] {
  const groups = new Map<string, R[]>();

  for (const row of rows) {
    const key = groupKeyFn(row);
    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key)!.push(row);
  }

  return Array.from(groups.values()).map(groupMapper);
}
