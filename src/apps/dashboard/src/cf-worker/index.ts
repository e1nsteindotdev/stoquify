import { makeDurableObject, makeWorker } from "@livestore/sync-cf/cf-worker";

const WSS_DO = class extends makeDurableObject({
  onPush: async (message) => {
    console.log("pushed events");
  },
  onPull: async (message) => {
    console.log("pulled events");
  },
}) { };

export class WebSocketServer extends WSS_DO { }

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
