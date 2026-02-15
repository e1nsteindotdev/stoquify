import type { D1Database } from "@cloudflare/workers-types";
import {
  Effect,
  FetchHttpClient,
  HttpClient,
  HttpClientRequest,
  Layer,
  Option,
  RpcClient,
  RpcSerialization,
  Stream,
} from "@livestore/utils/effect";
// @ts-expect-error - resolved at runtime by dependency
import { SyncHttpRpc } from "@livestore/sync-cf/common";

const CHECKPOINT_TABLE = "catalog_checkpoint";

const CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "*",
};

const CATALOG_QUERY = `
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

const SCHEMA_STATEMENTS = [
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
    lastSeqNum INTEGER,
    backendId TEXT
  )`,
  `CREATE INDEX IF NOT EXISTS idx_variants_product_display ON variants (product_id, displayOrder)`,
  `CREATE INDEX IF NOT EXISTS idx_variants_shop ON variants (shop_id)`,
  `CREATE INDEX IF NOT EXISTS idx_variant_options_variant ON variant_options (variant_id)`,
  `CREATE INDEX IF NOT EXISTS idx_variant_options_value ON variant_options (value)`,
  `CREATE INDEX IF NOT EXISTS idx_skus_product ON product_skus (product_id)`,
  `CREATE INDEX IF NOT EXISTS idx_skus_quantity ON product_skus (quantity)`,
];

const PRODUCT_EVENT_NAMES = new Set([
  "v1.ProductInserted",
  "v1.ProductPartialUpdated",
  "v1.ProductDeleted",
  "v1.CategoryInserted",
  "v1.CategoryPartialUpdated",
  "v1.CategoryDeleted",
  "v1.ProductImageInserted",
  "v1.ProductImagePartialUpdated",
  "v1.ProductImageDeleted",
  "v1.VariantOptionInserted",
  "v1.VariantOptionDeleted",
  "v1.VariantInserted",
  "v1.VariantPartialUpdated",
  "v1.VariantOrderUpdated",
  "v1.VariantDeleted",
  "v1.SkuInserted",
  "v1.SkuPartialUpdated",
  "v1.SkuDeleted",
  "v1.CollectionInserted",
  "v1.CollectionPartialUpdated",
  "v1.CollectionDeleted",
  "v1.CollectionProductInserted",
  "v1.CollectionProductDeleted",
  "v1.ProductImagesProductIdSet",
  "v1.ProductImagesReordered",
]);

type Env = {
  DB: D1Database;
  VITE_LIVESTORE_SYNC_URL?: string;
};

type Checkpoint = {
  lastSeqNum: number;
  backendId: string | null;
};

let schemaReady: Promise<void> | null = null;

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    if (request.method !== "GET") {
      return new Response("Method not allowed", {
        status: 405,
        headers: CORS_HEADERS,
      });
    }

    const url = new URL(request.url);
    const storeId = url.searchParams.get("storeId")?.trim();
    const shopId = url.searchParams.get("shopId")?.trim();

    if (!storeId || !shopId) {
      return new Response("Missing storeId or shopId", {
        status: 400,
        headers: CORS_HEADERS,
      });
    }

    if (!env.VITE_LIVESTORE_SYNC_URL) {
      return new Response("Missing VITE_LIVESTORE_SYNC_URL", {
        status: 500,
        headers: CORS_HEADERS,
      });
    }

    await ensureSchema(env.DB);

    const checkpoint = await readCheckpoint(env.DB, storeId);
    const pullResult = await pullAndMaterialize({
      db: env.DB,
      storeId,
      syncUrl: env.VITE_LIVESTORE_SYNC_URL,
      checkpoint,
    });

    if (pullResult.updated) {
      await writeCheckpoint(
        env.DB,
        storeId,
        pullResult.lastSeqNum,
        pullResult.backendId,
      );
    }

    const products = await queryCatalog(env.DB, shopId);
    const response = Response.json({ products });
    for (const [key, value] of Object.entries(CORS_HEADERS)) {
      response.headers.set(key, value);
    }
    return response;
  },
};

const ensureSchema = async (db: D1Database) => {
  if (!schemaReady) {
    schemaReady = (async () => {
      for (const statement of SCHEMA_STATEMENTS) {
        await execStatement(db, statement);
      }
    })();
  }
  await schemaReady;
};

const readCheckpoint = async (
  db: D1Database,
  storeId: string,
): Promise<Checkpoint> => {
  const rows = await selectAll<{
    lastSeqNum: number | null;
    backendId: string | null;
  }>(
    db,
    `SELECT lastSeqNum, backendId FROM ${CHECKPOINT_TABLE} WHERE storeId = ?`,
    [storeId],
  );

  if (rows.length === 0) {
    return { lastSeqNum: 0, backendId: null };
  }

  return {
    lastSeqNum: Number(rows[0]?.lastSeqNum ?? 0),
    backendId: rows[0]?.backendId ?? null,
  };
};

const writeCheckpoint = async (
  db: D1Database,
  storeId: string,
  lastSeqNum: number,
  backendId: string | null,
) => {
  await execStatement(
    db,
    `INSERT INTO ${CHECKPOINT_TABLE} (storeId, lastSeqNum, backendId) VALUES (?, ?, ?)
     ON CONFLICT(storeId) DO UPDATE SET lastSeqNum = excluded.lastSeqNum, backendId = excluded.backendId`,
    [storeId, lastSeqNum, backendId],
  );
};

const pullAndMaterialize = async ({
  db,
  storeId,
  syncUrl,
  checkpoint,
}: {
  db: D1Database;
  storeId: string;
  syncUrl: string;
  checkpoint: Checkpoint;
}): Promise<{
  lastSeqNum: number;
  backendId: string | null;
  updated: boolean;
}> => {
  const effect = Effect.gen(function*() {
    const rpcUrl = new URL(syncUrl);
    if (!rpcUrl.pathname.endsWith("/http-rpc")) {
      rpcUrl.pathname = rpcUrl.pathname.replace(/\/$/, "") + "/http-rpc";
    }
    rpcUrl.searchParams.set("storeId", storeId);
    rpcUrl.searchParams.set("transport", "http");

    const HttpProtocolLive = RpcClient.layerProtocolHttp({
      url: rpcUrl.toString(),
      transformClient: HttpClient.mapRequest((request) =>
        request.pipe(
          HttpClientRequest.setHeaders({
            "x-livestore-store-id": storeId,
          }),
        ),
      ),
    }).pipe(Layer.provide(RpcSerialization.layerJson));

    const rpcClient = (yield* RpcClient.make(SyncHttpRpc as any).pipe(
      Effect.provide(HttpProtocolLive),
    )) as any;

    let lastSeqNum = checkpoint.lastSeqNum;
    let backendId = checkpoint.backendId;
    let updated = false;

    const cursor =
      checkpoint.lastSeqNum > 0 && checkpoint.backendId
        ? Option.some({
          eventSequenceNumber: checkpoint.lastSeqNum,
          backendId: checkpoint.backendId,
        })
        : Option.none();

    const pullStream = rpcClient.SyncHttpRpc.Pull({
      storeId,
      payload: undefined,
      cursor,
    });

    yield* pullStream.pipe(
      Stream.runForEach((res: any) =>
        Effect.gen(function*() {
          backendId = res.backendId ?? backendId;
          const events = res.batch?.map((item: any) => item.eventEncoded) ?? [];
          if (events.length > 0) {
            yield* Effect.promise(() => applyEvents(db, events));
            const lastEvent = events[events.length - 1];
            if (lastEvent && lastEvent.seqNum > lastSeqNum) {
              lastSeqNum = lastEvent.seqNum;
              updated = true;
            }
          }
        }),
      ),
    );

    return { lastSeqNum, backendId, updated };
  }).pipe(Effect.provide(FetchHttpClient.layer));

  return Effect.runPromise(effect as any);
};

const applyEvents = async (db: D1Database, events: Array<any>) => {
  for (const event of events) {
    if (!event || !PRODUCT_EVENT_NAMES.has(event.name)) {
      continue;
    }
    await applyEvent(db, event);
  }
};

const applyEvent = async (db: D1Database, event: any) => {
  const args = (event?.args ?? {}) as Record<string, unknown>;

  switch (event.name) {
    case "v1.ProductInserted":
      return insertOrReplace(db, "products", normalizeRecord(args));
    case "v1.ProductPartialUpdated":
      return applyPartialUpdate(db, "products", args);
    case "v1.ProductDeleted":
      return applyPartialUpdate(db, "products", args);
    case "v1.CategoryInserted":
      return insertOrReplace(db, "categories", normalizeRecord(args));
    case "v1.CategoryPartialUpdated":
      return applyPartialUpdate(db, "categories", args);
    case "v1.CategoryDeleted":
      return applyPartialUpdate(db, "categories", args);
    case "v1.ProductImageInserted":
      return insertOrReplace(db, "product_images", normalizeRecord(args));
    case "v1.ProductImagePartialUpdated":
      return applyPartialUpdate(db, "product_images", args);
    case "v1.ProductImageDeleted":
      return applyPartialUpdate(db, "product_images", args);
    case "v1.VariantOptionInserted":
      return insertOrReplace(db, "variant_options", normalizeRecord(args));
    case "v1.VariantOptionDeleted":
      return applyPartialUpdate(db, "variant_options", args);
    case "v1.VariantInserted": {
      const { options, skus, ...variant } = args as Record<string, any>;
      await insertOrReplace(db, "variants", normalizeRecord(variant));

      for (const option of options ?? []) {
        await insertOrReplace(
          db,
          "variant_options",
          normalizeRecord({
            id: option.id,
            shop_id: variant.shop_id,
            variant_id: variant.id,
            value: option.value,
            createdAt: option.createdAt,
          }),
        );
      }

      for (const sku of skus ?? []) {
        await insertOrReplace(
          db,
          "product_skus",
          normalizeRecord({
            id: sku.id,
            shop_id: variant.shop_id,
            product_id: variant.product_id,
            quantity: sku.quantity,
            options: sku.options,
            createdAt: sku.createdAt,
          }),
        );
      }

      return;
    }
    case "v1.VariantPartialUpdated":
      return applyPartialUpdate(db, "variants", args);
    case "v1.VariantOrderUpdated":
      return applyPartialUpdate(db, "variants", args);
    case "v1.VariantDeleted":
      return applyPartialUpdate(db, "variants", args);
    case "v1.SkuInserted":
      return insertOrReplace(db, "product_skus", normalizeRecord(args));
    case "v1.SkuPartialUpdated":
      return applyPartialUpdate(db, "product_skus", args);
    case "v1.SkuDeleted":
      return applyPartialUpdate(db, "product_skus", args);
    case "v1.CollectionInserted":
      return insertOrReplace(db, "collections", normalizeRecord(args));
    case "v1.CollectionPartialUpdated":
      return applyPartialUpdate(db, "collections", args);
    case "v1.CollectionDeleted":
      return applyPartialUpdate(db, "collections", args);
    case "v1.CollectionProductInserted":
      return insertOrReplace(db, "collection_products", normalizeRecord(args));
    case "v1.CollectionProductDeleted":
      return applyPartialUpdate(db, "collection_products", args);
    case "v1.ProductImagesProductIdSet": {
      const imageIds = Array.isArray(args.imageIds) ? args.imageIds : [];
      for (const id of imageIds) {
        await execStatement(
          db,
          "UPDATE product_images SET product_id = ? WHERE id = ?",
          [args.productId, id],
        );
      }
      return;
    }
    case "v1.ProductImagesReordered": {
      const updates = Array.isArray(args) ? args : [];
      for (const update of updates) {
        await execStatement(
          db,
          "UPDATE product_images SET displayOrder = ? WHERE id = ?",
          [update.displayOrder, update.id],
        );
      }
      return;
    }
    default:
      return;
  }
};

const insertOrReplace = async (
  db: D1Database,
  tableName: string,
  record: Record<string, unknown>,
) => {
  const entries = Object.entries(record).filter(
    ([, value]) => value !== undefined,
  );
  const keys = entries.map(([key]) => key);
  const values = entries.map(([key, value]) => normalizeValue(key, value));
  const placeholders = keys.map(() => "?").join(", ");

  await execStatement(
    db,
    `INSERT OR REPLACE INTO ${tableName} (${keys.join(", ")}) VALUES (${placeholders})`,
    values,
  );
};

const applyPartialUpdate = async (
  db: D1Database,
  tableName: string,
  changes: Record<string, unknown>,
) => {
  const updateEntries = Object.entries(changes).filter(
    ([key, value]) => value !== undefined && key !== "id",
  );

  if (updateEntries.length === 0 || changes.id === undefined) {
    return;
  }

  const setClause = updateEntries.map(([key]) => `${key} = ?`).join(", ");
  const values = updateEntries.map(([key, value]) =>
    normalizeValue(key, value),
  );
  values.push(changes.id);

  await execStatement(
    db,
    `UPDATE ${tableName} SET ${setClause} WHERE id = ?`,
    values,
  );
};

const normalizeRecord = (record: Record<string, unknown>) => {
  const entries = Object.entries(record).filter(
    ([, value]) => value !== undefined,
  );
  return Object.fromEntries(
    entries.map(([key, value]) => [key, normalizeValue(key, value)]),
  );
};

const normalizeValue = (key: string, value: unknown) => {
  if (value === undefined) {
    return value;
  }
  if (key.endsWith("At")) {
    return normalizeDate(value);
  }
  if (key === "options") {
    return serializeJson(value);
  }
  return value;
};

const normalizeDate = (value: unknown) => {
  if (value instanceof Date) {
    return value.getTime();
  }
  if (typeof value === "string") {
    const parsed = Date.parse(value);
    return Number.isNaN(parsed) ? value : parsed;
  }
  return value;
};

const serializeJson = (value: unknown) => {
  if (typeof value === "string") {
    return value;
  }
  return JSON.stringify(value ?? {});
};

const queryCatalog = async (db: D1Database, shopId: string) => {
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

const parseJsonArray = (value: unknown) => {
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

const parseVariants = (value: unknown) => {
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

const selectAll = async <T>(
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
  statement: D1PreparedStatement,
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

type D1PreparedStatement = ReturnType<D1Database["prepare"]>;
