import type { D1Database } from "@cloudflare/workers-types";
import { makeDurableObject, makeWorker } from "@livestore/sync-cf/cf-worker";
import { schema } from "../livestore/schema";
import { isCatalogEvent, materializeEventsToD1 } from "./sql-extractor";

let cachedEnv: { DB: D1Database } | null = null;

const WSS_DO = class extends makeDurableObject({
  onPush: async (message) => {
    if (!cachedEnv?.DB) {
      return;
    }

    const events = message.batch as unknown as Array<{
      name: string;
      args: unknown;
      seqNum: number;
      parentSeqNum: number;
      clientId: string;
      sessionId: string;
    }>;

    if (!events.length) {
      return;
    }

    try {
      await materializeEventsToD1({
        db: cachedEnv.DB,
        schema,
        events,
        shouldIncludeEvent: isCatalogEvent,
      });
    } catch (error) {
      console.error("Failed to materialize push batch", error);
    }
  },
  onPull: async (message) => {
    console.log("pulled events");
  },
}) {
  constructor(state: any, env: any) {
    super(state, env);
    if (!cachedEnv) {
      cachedEnv = { DB: env.DB };
    }
  }
};

export class WebSocketServer extends WSS_DO {}

export default {
  async fetch(request: any, env: any, ctx: any) {
    const url = new URL(request.url);

    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
          "Access-Control-Allow-Headers":
            request.headers.get("Access-Control-Request-Headers") ?? "*",
          "Access-Control-Max-Age": "86400",
        },
      });
    }

    if (url.pathname === "/get-head" && request.method === "GET") {
      console.log("recived /get-head request");
      const storeId = url.searchParams.get("storeId");
      const dbName = `eventlog_7_${storeId?.replace(/[^a-zA-Z0-9]/g, "_")}`;
      const result = await env.DB.prepare(
        `SELECT MAX(seqNum) as maxSeq FROM ${dbName}`,
      ).first();
      const head = (result?.maxSeq as number) ?? 0;
      console.log("got head :", head);

      const response = Response.json({ parentSeqNum: head });
      response.headers.set("Access-Control-Allow-Origin", "*");
      return response;
    }

    const worker = makeWorker({
      validatePayload: (payload: any) => {
        if (payload?.authToken !== "insecure-token-change-me") {
          throw new Error("Invalid auth token");
        }
      },
    });

    return worker.fetch(request, env, ctx);
  },
};
