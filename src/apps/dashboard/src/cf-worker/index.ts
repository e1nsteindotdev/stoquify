import type { D1Database } from "@cloudflare/workers-types";
import { CORS_HEADERS } from "./actions";
import {
  handleEvents,
  handleOrders,
  handlePull,
  handleCatalog,
  handleCategories,
  handleCollections,
} from "./actions";

type Env = {
  DB: D1Database;
};

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

    if (pathname === "/orders" && request.method === "POST") {
      return handleOrders(request, env.DB);
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
