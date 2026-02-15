import type { D1Database } from "@cloudflare/workers-types";
import type { LiveStoreSchema } from "@livestore/livestore";
import { Schema } from "@livestore/livestore";

export interface EventSqlStatement {
  readonly sql: string;
  readonly bindValues: Record<string, unknown> | ReadonlyArray<unknown>;
  readonly writeTables: ReadonlySet<string> | undefined;
}

export interface EventSqlResult {
  readonly eventName: string;
  readonly seqNum: number;
  readonly statements: ReadonlyArray<EventSqlStatement>;
}

export type EventInput = {
  name: string;
  args: unknown;
  seqNum: number;
  parentSeqNum: number;
  clientId: string;
  sessionId: string;
};

const CATALOG_SCHEMA_STATEMENTS = [
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
  `CREATE INDEX IF NOT EXISTS idx_variants_product_display ON variants (product_id, displayOrder)`,
  `CREATE INDEX IF NOT EXISTS idx_variants_shop ON variants (shop_id)`,
  `CREATE INDEX IF NOT EXISTS idx_variant_options_variant ON variant_options (variant_id)`,
  `CREATE INDEX IF NOT EXISTS idx_variant_options_value ON variant_options (value)`,
  `CREATE INDEX IF NOT EXISTS idx_skus_product ON product_skus (product_id)`,
  `CREATE INDEX IF NOT EXISTS idx_skus_quantity ON product_skus (quantity)`,
];

const CATALOG_EVENT_NAMES = new Set([
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

let schemaReady: Promise<void> | null = null;

export const ensureCatalogSchema = async (db: D1Database) => {
  if (!schemaReady) {
    schemaReady = (async () => {
      for (const statement of CATALOG_SCHEMA_STATEMENTS) {
        await execStatement(db, statement);
      }
    })();
  }
  await schemaReady;
};

export const isCatalogEvent = (eventName: string) =>
  CATALOG_EVENT_NAMES.has(eventName);

export const extractBatchEventSql = async (
  events: ReadonlyArray<EventInput>,
  schema: LiveStoreSchema,
  db: D1Database,
  shouldIncludeEvent?: (eventName: string) => boolean,
  queryCache?: QueryCache,
): Promise<ReadonlyArray<EventSqlResult>> => {
  const results: EventSqlResult[] = [];

  for (const event of events) {
    if (shouldIncludeEvent && !shouldIncludeEvent(event.name)) {
      continue;
    }
    const result = extractEventSql(event, schema, db, queryCache);
    if (result) {
      results.push(result);
    }
  }

  return results;
};

export const materializeEventsToD1 = async (args: {
  db: D1Database;
  schema: LiveStoreSchema;
  events: ReadonlyArray<EventInput>;
  shouldIncludeEvent?: (eventName: string) => boolean;
}) => {
  await ensureCatalogSchema(args.db);
  const queryCache = await buildQueryCache(
    args.db,
    args.events,
    args.shouldIncludeEvent,
  );
  const results = await extractBatchEventSql(
    args.events,
    args.schema,
    args.db,
    args.shouldIncludeEvent,
    queryCache,
  );

  for (const result of results) {
    for (const stmt of result.statements) {
      if (!stmt.sql) {
        continue;
      }
      await execStatement(args.db, stmt.sql, stmt.bindValues);
    }
  }
};

const extractEventSql = (
  event: EventInput,
  schema: LiveStoreSchema,
  db: D1Database,
  queryCache?: QueryCache,
): EventSqlResult | undefined => {
  const eventDef = schema.eventsDefsMap.get(event.name);
  if (!eventDef) {
    return undefined;
  }

  const materializer = schema.state.materializers.get(event.name);
  if (!materializer) {
    return undefined;
  }

  const decodedArgs = Schema.decodeUnknownSync(eventDef.schema)(event.args);

  const materializerResult = materializer(decodedArgs, {
    eventDef,
    query: (queryBuilder: any) =>
      executeQuery(queryBuilder, queryCache ?? emptyQueryCache),
    currentFacts: new Map(),
    event: {
      name: event.name,
      args: decodedArgs,
      seqNum: { global: event.seqNum, client: 0, rebaseGeneration: 0 },
      parentSeqNum: {
        global: event.parentSeqNum,
        client: 0,
        rebaseGeneration: 0,
      },
      clientId: event.clientId,
      sessionId: event.sessionId,
    },
  } as any);

  const statements = fromMaterializerResult(materializerResult);

  return {
    eventName: event.name,
    seqNum: event.seqNum,
    statements,
  };
};

const fromMaterializerResult = (
  materializerResult: unknown,
): ReadonlyArray<EventSqlStatement> => {
  const normalize = (input: unknown): EventSqlStatement => {
    if (
      typeof input === "object" &&
      input !== null &&
      "asSql" in input &&
      typeof (input as Record<string, unknown>).asSql === "function"
    ) {
      const {
        query: sql,
        bindValues,
        usedTables,
      } = (
        input as {
          asSql: () => {
            query: string;
            bindValues: Record<string, unknown>;
            usedTables: ReadonlySet<string> | undefined;
          };
        }
      ).asSql();
      return { sql, bindValues, writeTables: usedTables };
    }

    if (typeof input === "object" && input !== null && "sql" in input) {
      const obj = input as {
        sql: string;
        bindValues?: Record<string, unknown> | ReadonlyArray<unknown>;
        writeTables?: ReadonlySet<string>;
      };
      return {
        sql: obj.sql,
        bindValues: obj.bindValues ?? {},
        writeTables: obj.writeTables,
      };
    }

    if (typeof input === "string") {
      return { sql: input, bindValues: [], writeTables: undefined };
    }

    return { sql: "", bindValues: [], writeTables: undefined };
  };

  if (Array.isArray(materializerResult)) {
    return materializerResult.flatMap(normalize);
  }
  return [normalize(materializerResult)];
};

type QueryCache = {
  products: Set<string>;
  productImages: Set<string>;
};

const emptyQueryCache: QueryCache = {
  products: new Set(),
  productImages: new Set(),
};

const executeQuery = (queryBuilder: any, cache: QueryCache) => {
  if (!queryBuilder || typeof queryBuilder.asSql !== "function") {
    return [];
  }
  const { query, bindValues } = queryBuilder.asSql();
  const table = extractTableName(query);
  const id = extractIdFromBindValues(bindValues);

  if (!table || !id) {
    return [];
  }

  if (table === "products" && cache.products.has(id)) {
    return [{}];
  }

  if (table === "product_images" && cache.productImages.has(id)) {
    return [{}];
  }

  return [];
};

const buildQueryCache = async (
  db: D1Database,
  events: ReadonlyArray<EventInput>,
  shouldIncludeEvent?: (eventName: string) => boolean,
): Promise<QueryCache> => {
  const productIds = new Set<string>();
  const productImageIds = new Set<string>();

  for (const event of events) {
    if (shouldIncludeEvent && !shouldIncludeEvent(event.name)) {
      continue;
    }
    if (event.name === "v1.ProductInserted" && event.args) {
      const id = (event.args as Record<string, unknown>).id;
      if (typeof id === "string") {
        productIds.add(id);
      }
    }
    if (event.name === "v1.ProductImageInserted" && event.args) {
      const id = (event.args as Record<string, unknown>).id;
      if (typeof id === "string") {
        productImageIds.add(id);
      }
    }
  }

  return {
    products: await loadExistingIds(db, "products", productIds),
    productImages: await loadExistingIds(db, "product_images", productImageIds),
  };
};

const loadExistingIds = async (
  db: D1Database,
  tableName: string,
  ids: Set<string>,
) => {
  if (ids.size === 0) {
    return new Set<string>();
  }

  const results = new Set<string>();
  const idList = Array.from(ids);
  const chunkSize = 80;

  for (let i = 0; i < idList.length; i += chunkSize) {
    const chunk = idList.slice(i, i + chunkSize);
    const placeholders = chunk.map(() => "?").join(", ");
    const rows = await selectAll<{ id: string }>(
      db,
      `SELECT id FROM ${tableName} WHERE id IN (${placeholders})`,
      chunk,
    );
    for (const row of rows) {
      if (row?.id) {
        results.add(row.id);
      }
    }
  }

  return results;
};

const extractTableName = (sql: string) => {
  const match = sql.match(/from\s+([a-zA-Z0-9_]+)/i);
  return match?.[1] ?? null;
};

const extractIdFromBindValues = (
  bindValues?: Record<string, unknown> | ReadonlyArray<unknown>,
) => {
  if (!bindValues || Array.isArray(bindValues)) {
    return null;
  }
  const map = bindValues as Record<string, unknown>;
  const direct = map.id;
  if (typeof direct === "string") {
    return direct;
  }
  const whereId = map.where_id;
  if (typeof whereId === "string") {
    return whereId;
  }
  for (const value of Object.values(map)) {
    if (typeof value === "string") {
      return value;
    }
  }
  return null;
};

const execStatement = async (
  db: D1Database,
  sql: string,
  bindValues?: Record<string, unknown> | ReadonlyArray<unknown>,
) => {
  const prepared = db.prepare(sql);
  const { normalizedSql, values } = normalizeSql(sql, bindValues);
  const stmt = normalizedSql === sql ? prepared : db.prepare(normalizedSql);
  if (values.length > 0) {
    await stmt.bind(...values).run();
  } else {
    await stmt.run();
  }
};

const selectAll = async <T>(
  db: D1Database,
  sql: string,
  bindValues?: Record<string, unknown> | ReadonlyArray<unknown>,
): Promise<T[]> => {
  const prepared = db.prepare(sql);
  const { normalizedSql, values } = normalizeSql(sql, bindValues);
  const stmt = normalizedSql === sql ? prepared : db.prepare(normalizedSql);
  const result =
    values.length > 0
      ? await stmt.bind(...values).all<T>()
      : await stmt.all<T>();
  return result.results;
};

const normalizeSql = (
  sql: string,
  bindValues?: Record<string, unknown> | ReadonlyArray<unknown>,
): { normalizedSql: string; values: unknown[] } => {
  if (!bindValues) {
    return { normalizedSql: sql, values: [] };
  }

  if (Array.isArray(bindValues)) {
    return { normalizedSql: sql, values: [...bindValues] };
  }

  const values: unknown[] = [];
  const normalizedSql = sql.replace(/\$[A-Za-z0-9_]+/g, (match) => {
    const key = match.slice(1);
    values.push(bindValues[key]);
    return "?";
  });

  return { normalizedSql, values };
};
