import type { D1Database, KVNamespace } from "@cloudflare/workers-types";
import type { LiveStoreSchema } from "@livestore/livestore";
import { makeKvAuthStorage } from "./auth/kv-kv";
import {
  ensureSchema,
  queryCatalog,
  queryCategories,
  queryCollections,
  CHECKPOINT_TABLE,
  migrateEventlogUniqueConstraint,
} from "./sql/queries";

export { migrateEventlogUniqueConstraint };
import {
  isCatalogEvent,
  materializeEventsToD1,
  EventInput,
} from "./sql-extractor";

export type Env = {
  DB: D1Database;
};

export const getCorsHeaders = (req: Request): Record<string, string> => {
  const origin = req.headers.get("Origin");
  const requestedHeaders = req.headers.get("Access-Control-Request-Headers");
  const allowHeaders =
    requestedHeaders ?? "Content-Type, Authorization, X-Requested-With";

  if (origin) {
    return {
      "Access-Control-Allow-Origin": origin,
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": allowHeaders,
      "Access-Control-Allow-Credentials": "true",
      Vary: "Origin, Access-Control-Request-Headers",
    };
  }

  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": allowHeaders,
  };
};

let schemaPromise: Promise<LiveStoreSchema> | null = null;

const getSchema = async (): Promise<LiveStoreSchema> => {
  if (!schemaPromise) {
    schemaPromise = import("../livestore/schema").then((m) => m.schema);
  }
  return schemaPromise;
};

export const handleEvents = async (
  request: Request,
  db: D1Database,
  kv?: KVNamespace,
): Promise<Response> => {
  try {
    const body = await request.json();
    const { storeId, events } = body;

    if (!storeId || !Array.isArray(events)) {
      return new Response("Invalid request: missing storeId or events", {
        status: 400,
        headers: getCorsHeaders(request),
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

    console.log("pushed events to eventlog :", events);

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
        `INSERT INTO ${CHECKPOINT_TABLE} (storeId, lastSeqNum) VALUES (?, ?)
      ON CONFLICT(storeId) DO UPDATE SET lastSeqNum = excluded.lastSeqNum
    `,
      )
      .bind(storeId, maxSeqNum)
      .run();

    return Response.json(
      { lastSeqNum: maxSeqNum },
      { headers: getCorsHeaders(request) },
    );
  } catch (error) {
    console.error("handleEvents error:", error);
    return new Response("Internal error", {
      status: 500,
      headers: getCorsHeaders(request),
    });
  }
};

export type OrderInput = {
  shopId: string;
  storeId?: string;
  order: {
    firstName: string;
    lastName: string;
    phoneNumber: number;
    wilaya: string;
    address: string;
    items: Array<{
      productId: string;
      quantity: number;
      price: number;
      selection: Array<{
        variantId: string;
        variantOptionId: string;
      }>;
    }>;
  };
};

export const handleOrders = async (
  request: Request,
  db: D1Database,
  kv: KVNamespace,
): Promise<Response> => {
  try {
    const body = (await request.json()) as OrderInput;
    const { shopId, order } = body;

    if (!shopId || !order) {
      return new Response("Invalid request: missing shopId or order", {
        status: 400,
        headers: getCorsHeaders(request),
      });
    }

    const storage = makeKvAuthStorage(kv);
    const shop = await storage.getShop(shopId);
    if (!shop) {
      return new Response("Unknown shopId", {
        status: 404,
        headers: getCorsHeaders(request),
      });
    }

    const organization = await storage.getOrganization(shop.organizationId);
    const storeId = organization?.storeId;
    if (!storeId) {
      return new Response("Unable to resolve storeId for shopId", {
        status: 422,
        headers: getCorsHeaders(request),
      });
    }

    if (body.storeId && body.storeId !== storeId) {
      return new Response("Provided storeId does not match shopId", {
        status: 409,
        headers: getCorsHeaders(request),
      });
    }

    await ensureSchema(db);

    const orderId = crypto.randomUUID();
    const clientId = "checkout-web";
    const sessionId = crypto.randomUUID();
    const timestamp = Date.now();

    const checkpoint = await db
      .prepare(`SELECT lastSeqNum FROM ${CHECKPOINT_TABLE} WHERE storeId = ?`)
      .bind(storeId)
      .first<{ lastSeqNum: number }>();
    const seqNum = (checkpoint?.lastSeqNum ?? 0) + 1;

    const eventArgs = {
      id: orderId,
      shop_id: shopId,
      address: JSON.stringify({
        firstName: order.firstName,
        lastName: order.lastName,
        phoneNumber: order.phoneNumber,
        wilaya: order.wilaya,
        address: order.address,
      }),
      status: "pending",
      createdAt: timestamp,
      deletedAt: null,
    };

    await db
      .prepare(
        `INSERT INTO eventlog (storeId, seqNum, eventName, eventArgs, clientId, sessionId, parentSeqNum, timestamp)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .bind(
        storeId,
        seqNum,
        "v1.OrderCreated",
        JSON.stringify(eventArgs),
        clientId,
        sessionId,
        0,
        timestamp,
      )
      .run();

    await db
      .prepare(
        `INSERT INTO ${CHECKPOINT_TABLE} (storeId, lastSeqNum) VALUES (?, ?)
         ON CONFLICT(storeId) DO UPDATE SET lastSeqNum = excluded.lastSeqNum`,
      )
      .bind(storeId, seqNum)
      .run();

    console.log("pushed order event to the evnet log : ", orderId);

    return Response.json(
      { orderId, lastSeqNum: seqNum },
      { headers: getCorsHeaders(request) },
    );
  } catch (error) {
    console.error("handleOrders error:", error);
    return new Response("Internal error", {
      status: 500,
      headers: getCorsHeaders(request),
    });
  }
};

export const handlePull = async (
  request: Request,
  db: D1Database,
  kv?: KVNamespace,
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
        headers: getCorsHeaders(request),
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
      { headers: getCorsHeaders(request) },
    );
  } catch (error) {
    console.error("handlePull error:", error);
    return new Response("Internal error", {
      status: 500,
      headers: getCorsHeaders(request),
    });
  }
};

export const handleCatalog = async (
  request: Request,
  db: D1Database,
): Promise<Response> => {
  try {
    console.log("querying the catalog");
    const url = new URL(request.url);
    const shopId = url.searchParams.get("shopId");

    if (!shopId) {
      return new Response("Missing shopId", {
        status: 400,
        headers: getCorsHeaders(request),
      });
    }

    await ensureSchema(db);
    const products = await queryCatalog(db, shopId);

    return Response.json({ products }, { headers: getCorsHeaders(request) });
  } catch (error) {
    console.error("handleCatalog error:", error);
    return new Response("Internal error", {
      status: 500,
      headers: getCorsHeaders(request),
    });
  }
};

export const handleCategories = async (
  request: Request,
  db: D1Database,
): Promise<Response> => {
  try {
    const url = new URL(request.url);
    const shopId = url.searchParams.get("shopId");

    if (!shopId) {
      return new Response("Missing shopId", {
        status: 400,
        headers: getCorsHeaders(request),
      });
    }

    await ensureSchema(db);
    const categories = await queryCategories(db, shopId);

    return Response.json({ categories }, { headers: getCorsHeaders(request) });
  } catch (error) {
    console.error("handleCategories error:", error);
    return new Response("Internal error", {
      status: 500,
      headers: getCorsHeaders(request),
    });
  }
};

export const handleCollections = async (
  request: Request,
  db: D1Database,
): Promise<Response> => {
  try {
    const url = new URL(request.url);
    const shopId = url.searchParams.get("shopId");

    if (!shopId) {
      return new Response("Missing shopId", {
        status: 400,
        headers: getCorsHeaders(request),
      });
    }

    await ensureSchema(db);
    const collections = await queryCollections(db, shopId);

    return Response.json({ collections }, { headers: getCorsHeaders(request) });
  } catch (error) {
    console.error("handleCollections error:", error);
    return new Response("Internal error", {
      status: 500,
      headers: getCorsHeaders(request),
    });
  }
};
