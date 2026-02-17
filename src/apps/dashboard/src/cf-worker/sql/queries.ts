import type { D1Database } from "@cloudflare/workers-types";

export const CHECKPOINT_TABLE = "catalog_checkpoint";

export const SCHEMA_STATEMENTS = [
  `CREATE TABLE IF NOT EXISTS products (
    id TEXT PRIMARY KEY,
    shop_id TEXT NOT NULL,
    title TEXT NOT NULL,
    desc TEXT,
    category_id TEXT NOT NULL,
    price REAL NOT NULL DEFAULT 0,
    cost REAL,
    status TEXT NOT NULL DEFAULT 'incomplete',
    discount REAL,
    oldPrice REAL,
    stockingStrategy TEXT NOT NULL DEFAULT 'by_variants',
    quantity INTEGER,
    createdAt INTEGER NOT NULL,
    deletedAt INTEGER
  )`,
  `CREATE TABLE IF NOT EXISTS categories (
    id TEXT PRIMARY KEY,
    shop_id TEXT NOT NULL,
    name TEXT NOT NULL,
    createdAt INTEGER NOT NULL,
    deletedAt INTEGER
  )`,
  `CREATE TABLE IF NOT EXISTS product_images (
    id TEXT PRIMARY KEY,
    shop_id TEXT NOT NULL,
    product_id TEXT NOT NULL,
    url TEXT NOT NULL,
    indexedDBId INTEGER,
    displayOrder INTEGER NOT NULL,
    hidden INTEGER NOT NULL DEFAULT 0,
    createdAt INTEGER NOT NULL,
    deletedAt INTEGER
  )`,
  `CREATE TABLE IF NOT EXISTS variants (
    id TEXT PRIMARY KEY,
    shop_id TEXT NOT NULL,
    product_id TEXT NOT NULL,
    name TEXT NOT NULL,
    displayOrder INTEGER NOT NULL DEFAULT 0,
    createdAt INTEGER NOT NULL,
    deletedAt INTEGER
  )`,
  `CREATE TABLE IF NOT EXISTS variant_options (
    id TEXT PRIMARY KEY,
    shop_id TEXT NOT NULL,
    variant_id TEXT NOT NULL,
    value TEXT NOT NULL,
    createdAt INTEGER NOT NULL,
    deletedAt INTEGER
  )`,
  `CREATE TABLE IF NOT EXISTS product_skus (
    id TEXT PRIMARY KEY,
    shop_id TEXT NOT NULL,
    product_id TEXT NOT NULL,
    quantity INTEGER NOT NULL,
    options TEXT NOT NULL,
    createdAt INTEGER NOT NULL,
    deletedAt INTEGER
  )`,
  `CREATE TABLE IF NOT EXISTS collections (
    id TEXT PRIMARY KEY,
    shop_id TEXT NOT NULL,
    name TEXT NOT NULL,
    createdAt INTEGER NOT NULL,
    deletedAt INTEGER
  )`,
  `CREATE TABLE IF NOT EXISTS collection_products (
    id TEXT PRIMARY KEY,
    shop_id TEXT NOT NULL,
    collection_id TEXT NOT NULL,
    product_id TEXT NOT NULL,
    createdAt INTEGER NOT NULL,
    deletedAt INTEGER
  )`,
  `CREATE TABLE IF NOT EXISTS ${CHECKPOINT_TABLE} (
    storeId TEXT PRIMARY KEY,
    lastSeqNum INTEGER NOT NULL DEFAULT 0
  )`,
  `CREATE TABLE IF NOT EXISTS eventlog (
    storeId TEXT NOT NULL,
    seqNum INTEGER NOT NULL,
    eventName TEXT NOT NULL,
    eventArgs TEXT,
    clientId TEXT NOT NULL,
    sessionId TEXT NOT NULL,
    parentSeqNum INTEGER NOT NULL DEFAULT 0,
    timestamp INTEGER NOT NULL
  )`,
  `CREATE INDEX IF NOT EXISTS idx_eventlog_store_seq ON eventlog (storeId, seqNum)`,
  `CREATE INDEX IF NOT EXISTS idx_variants_product_display ON variants (product_id, displayOrder)`,
  `CREATE INDEX IF NOT EXISTS idx_variants_shop ON variants (shop_id)`,
  `CREATE INDEX IF NOT EXISTS idx_variant_options_variant ON variant_options (variant_id)`,
  `CREATE INDEX IF NOT EXISTS idx_variant_options_value ON variant_options (value)`,
  `CREATE INDEX IF NOT EXISTS idx_skus_product ON product_skus (product_id)`,
  `CREATE INDEX IF NOT EXISTS idx_skus_quantity ON product_skus (quantity)`,
];

export const CATALOG_QUERY = `
  SELECT 
    p.*, 
    c.id as category_id, 
    c.name as category_name, 
    c.createdAt as category_createdAt, 
    COALESCE((
      SELECT json_group_array(json_object(
        'id', pi.id,
        'shop_id', pi.shop_id,
        'product_id', pi.product_id,
        'url', pi.url,
        'indexedDBId', pi.indexedDBId,
        'displayOrder', pi."displayOrder",
        'hidden', pi.hidden,
        'createdAt', pi.createdAt
      )) FROM product_images pi 
      WHERE pi.product_id = p.id AND pi.deletedAt IS NULL
    ), '[]') as images, 
    COALESCE((
      SELECT json_group_array(json_object(
        'id', col.id,
        'shop_id', col.shop_id,
        'name', col.name,
        'createdAt', col.createdAt,
        'deletedAt', col.deletedAt,
        'collection_product_id', cp.id
      )) FROM collections col
      INNER JOIN collection_products cp ON cp.collection_id = col.id
      WHERE cp.product_id = p.id AND col.deletedAt IS NULL
    ), '[]') as collections, 
    COALESCE((
      SELECT json_group_array(json_object(
        'id', v.id,
        'shop_id', v.shop_id,
        'product_id', v.product_id,
        'name', v.name,
        'displayOrder', v."displayOrder",
        'createdAt', v.createdAt,
        'options', (
          SELECT COALESCE(json_group_array(CAST(vo.value AS TEXT)), '[]')
          FROM variant_options vo
          WHERE vo.variant_id = v.id AND vo.shop_id = v.shop_id AND vo.deletedAt IS NULL AND vo.value IS NOT NULL
        ),
        'skus', (
          SELECT COALESCE(json_group_array(json_object(
            'id', s.id,
            'shop_id', s.shop_id,
            'product_id', s.product_id,
            'quantity', s.quantity,
            'options', s.options,
            'createdAt', s.createdAt,
            'deletedAt', s.deletedAt
          )), '[]')
          FROM product_skus s
          WHERE s.product_id = p.id AND s.deletedAt IS NULL
        )
      )) FROM variants v
      WHERE v.product_id = p.id AND v.deletedAt IS NULL
    ), '[]') as variants
  FROM products p
  LEFT JOIN categories c ON c.id = p.category_id
  WHERE p.shop_id = ? AND p.deletedAt IS NULL
`;

let schemaReady: Promise<void> | null = null;

export const ensureSchema = async (db: D1Database) => {
  if (!schemaReady) {
    schemaReady = (async () => {
      for (const statement of SCHEMA_STATEMENTS) {
        await execStatement(db, statement);
      }
    })();
  }
  await schemaReady;
};

export const queryCatalog = async (db: D1Database, shopId: string) => {
  const rows = await selectAll<Record<string, unknown>>(db, CATALOG_QUERY, [
    shopId,
  ]);
  return rows.map((row) => ({
    ...row,
    images: parseJsonArray(row.images),
    collections: parseJsonArray(row.collections),
    variants: parseVariants(row.variants),
  }));
};

export const queryCategories = async (db: D1Database, shopId: string) => {
  const rows = await selectAll<Record<string, unknown>>(
    db,
    `SELECT id, shop_id, name, createdAt FROM categories WHERE shop_id = ? AND deletedAt IS NULL ORDER BY name ASC`,
    [shopId],
  );
  return rows;
};

export const queryCollections = async (db: D1Database, shopId: string) => {
  const rows = await selectAll<Record<string, unknown>>(
    db,
    `SELECT
      c.id,
      c.shop_id,
      c.name,
      c.createdAt,
      COALESCE((
        SELECT json_group_array(cp.product_id)
        FROM collection_products cp
        WHERE cp.collection_id = c.id AND cp.deletedAt IS NULL
      ), '[]') as productIds
    FROM collections c
    WHERE c.shop_id = ? AND c.deletedAt IS NULL
    ORDER BY c.name ASC`,
    [shopId],
  );
  return rows.map((row) => ({
    ...row,
    productIds: parseJsonArray(row.productIds),
  }));
};

export const parseJsonArray = (value: unknown) => {
  if (value === null || value === undefined) {
    return [];
  }
  if (Array.isArray(value)) {
    return value;
  }
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
};

export const parseVariants = (value: unknown) => {
  const variants = parseJsonArray(value);
  return variants.map((variant) => {
    if (!variant || typeof variant !== "object") {
      return variant;
    }

    const v = variant as Record<string, unknown>;
    const skus = parseJsonArray(v.skus).map((sku) => {
      if (!sku || typeof sku !== "object") {
        return sku;
      }
      const skuRecord = sku as Record<string, unknown>;
      if (typeof skuRecord.options === "string") {
        try {
          skuRecord.options = JSON.parse(skuRecord.options);
        } catch {
          skuRecord.options = {};
        }
      }
      return skuRecord;
    });

    return { ...v, skus };
  });
};

const execStatement = async (
  db: D1Database,
  sql: string,
  bindValues?: unknown,
) => {
  const prepared = db.prepare(sql);
  const bound = bindStatement(prepared, bindValues);
  await bound.run();
};

export const selectAll = async <T>(
  db: D1Database,
  sql: string,
  bindValues?: unknown,
): Promise<T[]> => {
  const prepared = db.prepare(sql);
  const bound = bindStatement(prepared, bindValues);
  const result = await bound.all<T>();
  return result.results;
};

const bindStatement = (
  statement: ReturnType<D1Database["prepare"]>,
  bindValues?: unknown,
) => {
  if (!bindValues) {
    return statement;
  }

  if (Array.isArray(bindValues)) {
    return statement.bind(...bindValues);
  }

  if (typeof bindValues === "object" && bindValues !== null) {
    const normalized: Record<string, unknown> = { ...bindValues };
    for (const [key, value] of Object.entries(bindValues)) {
      const trimmed = key.replace(/^[$:@]/, "");
      if (!(trimmed in normalized)) {
        normalized[trimmed] = value;
      }
    }
    return statement.bind(normalized);
  }

  return statement;
};
