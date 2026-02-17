import type { D1Database } from "@cloudflare/workers-types";
import type { LiveStoreSchema } from "@livestore/livestore";
import {
  ensureCatalogSchema,
  isCatalogEvent,
  materializeEventsToD1,
  EventInput,
} from "./sql-extractor";

let schemaPromise: Promise<LiveStoreSchema> | null = null;

const getSchema = async (): Promise<LiveStoreSchema> => {
  if (!schemaPromise) {
    schemaPromise = import("../livestore/schema").then((m) => m.schema);
  }
  return schemaPromise;
};

const CHECKPOINT_TABLE = "catalog_checkpoint";

const CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
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

type Env = {
  DB: D1Database;
};

let schemaReady: Promise<void> | null = null;

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const pathname = url.pathname;

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    if (pathname === "/events" && request.method === "POST") {
      return handleEvents(request, env.DB);
    }

    if (
      (pathname === "/pull" && request.method === "GET") ||
      (pathname === "/pull" && request.method === "POST")
    ) {
      return handlePull(request, env.DB);
    }

    if (pathname === "/ping" && request.method === "GET") {
      return new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      });
    }

    if (pathname === "/ping" && request.method === "POST") {
      return new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      });
    }

    if (pathname === "/catalog" && request.method === "GET") {
      return handleCatalog(request, env.DB);
    }

    if (pathname === "/categories" && request.method === "GET") {
      return handleCategories(request, env.DB);
    }

    if (pathname === "/collections" && request.method === "GET") {
      return handleCollections(request, env.DB);
    }

    return new Response("Not found", { status: 404, headers: CORS_HEADERS });
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

const handleEvents = async (
  request: Request,
  db: D1Database,
): Promise<Response> => {
  try {
    const body = await request.json();
    const { storeId, events } = body;

    if (!storeId || !Array.isArray(events)) {
      return new Response("Invalid request: missing storeId or events", {
        status: 400,
        headers: CORS_HEADERS,
      });
    }

    await ensureSchema(db);

    const timestamp = Date.now();
    let maxSeqNum = 0;

    for (const event of events) {
      const seqNum = event.seqNum ?? 0;
      if (seqNum > maxSeqNum) maxSeqNum = seqNum;

      await db
        .prepare(
          `
        INSERT INTO eventlog (storeId, seqNum, eventName, eventArgs, clientId, sessionId, parentSeqNum, timestamp)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `,
        )
        .bind(
          storeId,
          seqNum,
          event.name,
          JSON.stringify(event.args),
          event.clientId,
          event.sessionId,
          event.parentSeqNum ?? 0,
          timestamp,
        )
        .run();
    }

    const eventInputs: EventInput[] = events.map((e) => ({
      name: e.name,
      args: e.args,
      seqNum: e.seqNum,
      parentSeqNum: e.parentSeqNum ?? 0,
      clientId: e.clientId,
      sessionId: e.sessionId,
    }));

    const schema = await getSchema();
    await materializeEventsToD1({
      db,
      schema,
      events: eventInputs,
      shouldIncludeEvent: isCatalogEvent,
    });

    await db
      .prepare(
        `
      INSERT INTO ${CHECKPOINT_TABLE} (storeId, lastSeqNum) VALUES (?, ?)
      ON CONFLICT(storeId) DO UPDATE SET lastSeqNum = excluded.lastSeqNum
    `,
      )
      .bind(storeId, maxSeqNum)
      .run();

    return Response.json({ lastSeqNum: maxSeqNum }, { headers: CORS_HEADERS });
  } catch (error) {
    console.error("handleEvents error:", error);
    return new Response("Internal error", {
      status: 500,
      headers: CORS_HEADERS,
    });
  }
};

const handlePull = async (
  request: Request,
  db: D1Database,
): Promise<Response> => {
  try {
    const url = new URL(request.url);
    let storeId = url.searchParams.get("storeId");
    let afterSeq = parseInt(url.searchParams.get("afterSeq") ?? "0", 10);

    if (request.method === "POST") {
      const body = await request.json();
      storeId = storeId || body.storeId;
      afterSeq = body.afterSeq ?? afterSeq;
    }

    if (!storeId) {
      return new Response("Missing storeId", {
        status: 400,
        headers: CORS_HEADERS,
      });
    }

    await ensureSchema(db);

    const rows = await db
      .prepare(
        `
      SELECT seqNum, eventName, eventArgs, clientId, sessionId, parentSeqNum
      FROM eventlog
      WHERE storeId = ? AND seqNum > ?
      ORDER BY seqNum ASC
    `,
      )
      .bind(storeId, afterSeq)
      .all<{
        seqNum: number;
        eventName: string;
        eventArgs: string;
        clientId: string;
        sessionId: string;
        parentSeqNum: number;
      }>();

    const events = rows.results.map((row) => ({
      name: row.eventName,
      args: JSON.parse(row.eventArgs || "{}"),
      seqNum: row.seqNum,
      parentSeqNum: row.parentSeqNum,
      clientId: row.clientId,
      sessionId: row.sessionId,
    }));

    const checkpoint = await db
      .prepare(
        `
      SELECT lastSeqNum FROM ${CHECKPOINT_TABLE} WHERE storeId = ?
    `,
      )
      .bind(storeId)
      .first<{ lastSeqNum: number }>();

    return Response.json(
      {
        events,
        checkpoint: checkpoint?.lastSeqNum ?? 0,
      },
      { headers: CORS_HEADERS },
    );
  } catch (error) {
    console.error("handlePull error:", error);
    return new Response("Internal error", {
      status: 500,
      headers: CORS_HEADERS,
    });
  }
};

const handleCatalog = async (
  request: Request,
  db: D1Database,
): Promise<Response> => {
  try {
    const url = new URL(request.url);
    const shopId = url.searchParams.get("shopId");

    if (!shopId) {
      return new Response("Missing shopId", {
        status: 400,
        headers: CORS_HEADERS,
      });
    }

    await ensureSchema(db);
    const products = await queryCatalog(db, shopId);

    return Response.json({ products }, { headers: CORS_HEADERS });
  } catch (error) {
    console.error("handleCatalog error:", error);
    return new Response("Internal error", {
      status: 500,
      headers: CORS_HEADERS,
    });
  }
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

const handleCategories = async (
  request: Request,
  db: D1Database,
): Promise<Response> => {
  try {
    const url = new URL(request.url);
    const shopId = url.searchParams.get("shopId");

    if (!shopId) {
      return new Response("Missing shopId", {
        status: 400,
        headers: CORS_HEADERS,
      });
    }

    await ensureSchema(db);
    const categories = await queryCategories(db, shopId);

    return Response.json({ categories }, { headers: CORS_HEADERS });
  } catch (error) {
    console.error("handleCategories error:", error);
    return new Response("Internal error", {
      status: 500,
      headers: CORS_HEADERS,
    });
  }
};

const queryCategories = async (db: D1Database, shopId: string) => {
  const rows = await selectAll<Record<string, unknown>>(
    db,
    `SELECT id, shop_id, name, createdAt FROM categories WHERE shop_id = ? AND deletedAt IS NULL ORDER BY name ASC`,
    [shopId],
  );
  return rows;
};

const handleCollections = async (
  request: Request,
  db: D1Database,
): Promise<Response> => {
  try {
    const url = new URL(request.url);
    const shopId = url.searchParams.get("shopId");

    if (!shopId) {
      return new Response("Missing shopId", {
        status: 400,
        headers: CORS_HEADERS,
      });
    }

    await ensureSchema(db);
    const collections = await queryCollections(db, shopId);

    return Response.json({ collections }, { headers: CORS_HEADERS });
  } catch (error) {
    console.error("handleCollections error:", error);
    return new Response("Internal error", {
      status: 500,
      headers: CORS_HEADERS,
    });
  }
};

const queryCollections = async (db: D1Database, shopId: string) => {
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
