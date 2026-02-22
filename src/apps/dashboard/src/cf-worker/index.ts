/// <reference types="@cloudflare/workers-types" />

import type {
  D1Database,
  KVNamespace,
  DurableObjectNamespace,
} from "@cloudflare/workers-types";
import { Schema, Effect, Layer } from "effect";
import { HttpApiBuilder, HttpServer } from "@effect/platform";

import { SyncStoreDO } from "./sync-do";
import { migrateEventlogUniqueConstraint } from "./sql/queries";

export { SyncStoreDO };

type Env = {
  DB: D1Database;
  AUTH_KV: KVNamespace;
  SYNC_STORE_DO: DurableObjectNamespace;
};

const AUTH_COOKIE = "stoquify_session";

const getToken = (req: Request): string | null => {
  const cookie = req.headers.get("Cookie");
  if (!cookie) return null;
  const match = cookie.match(new RegExp(`${AUTH_COOKIE}=([^;]+)`));
  return match?.[1] ?? null;
};

const getCorsHeaders = (req: Request): Record<string, string> => {
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

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const pathname = url.pathname;

    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: getCorsHeaders(request),
      });
    }

    await migrateEventlogUniqueConstraint(env.DB);

    try {
      const response = await this.handleRequest(request, env);
      const corsHeaders = getCorsHeaders(request);
      const newHeaders = new Headers(corsHeaders);
      response.headers.forEach((value, key) => {
        newHeaders.set(key, value);
      });
      return new Response(response.body, {
        status: response.status,
        headers: newHeaders,
      });
    } catch (error) {
      console.error("API error:", error);
      return new Response("Internal error", {
        status: 500,
        headers: getCorsHeaders(request),
      });
    }
  },

  async handleRequest(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const pathname = url.pathname;

    if (pathname.startsWith("/api/auth/")) {
      return this.handleAuth(request, env);
    }

    if (pathname === "/events" && request.method === "POST") {
      return this.handleEvents(request, env);
    }

    if (pathname === "/orders" && request.method === "POST") {
      return this.handleOrders(request, env);
    }

    if (
      pathname === "/pull" &&
      (request.method === "GET" || request.method === "POST")
    ) {
      return this.handlePull(request, env);
    }

    if (pathname === "/ping" && request.method === "GET") {
      return new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (pathname === "/ping" && request.method === "POST") {
      return new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (pathname === "/catalog" && request.method === "GET") {
      return this.handleCatalog(request, env.DB);
    }

    if (pathname === "/categories" && request.method === "GET") {
      return this.handleCategories(request, env.DB);
    }

    if (pathname === "/collections" && request.method === "GET") {
      return this.handleCollections(request, env.DB);
    }

    return new Response("Not found", { status: 404 });
  },

  async handleAuth(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const pathname = url.pathname;

    if (pathname === "/api/auth/signup" && request.method === "POST") {
      return this.handleSignup(request, env);
    }

    if (pathname === "/api/auth/login" && request.method === "POST") {
      return this.handleLogin(request, env);
    }

    if (pathname === "/api/auth/login-magic" && request.method === "POST") {
      return this.handleMagicLinkLogin(request, env);
    }

    if (
      pathname === "/api/auth/create-magic-link" &&
      request.method === "POST"
    ) {
      return this.handleCreateMagicLink(request, env);
    }

    if (pathname === "/api/auth/logout" && request.method === "POST") {
      return this.handleLogout(request, env);
    }

    if (pathname === "/api/auth/me" && request.method === "GET") {
      return this.handleMe(request, env);
    }

    if (pathname === "/api/auth/disable-user" && request.method === "POST") {
      return this.handleDisableUser(request, env);
    }

    return new Response("Not found", { status: 404 });
  },

  async handleSignup(request: Request, env: Env): Promise<Response> {
    const body = await request.json();
    const { phone, name, email, password, organizationName, shopName } =
      body as any;

    if (!phone || !name || !password || !organizationName || !shopName) {
      return Response.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    if (password.length < 4) {
      return Response.json(
        { error: "Password must be at least 4 characters" },
        { status: 400 },
      );
    }

    const { makeKvAuthStorage } = await import("./auth/kv-kv");
    const { signup: doSignup } = await import("./auth/service");
    const storage = makeKvAuthStorage(env.AUTH_KV);

    try {
      const result = await doSignup(storage, {
        phone,
        name,
        email,
        password,
        organizationName,
        shopName,
      });

      return Response.json({
        user: result.user,
        organization: result.organization,
        shop: result.shop,
        storeId: result.organization.storeId,
      });
    } catch (e: any) {
      return Response.json(
        { error: e.message || "Signup failed" },
        { status: 500 },
      );
    }
  },

  async handleLogin(request: Request, env: Env): Promise<Response> {
    const body = await request.json();
    const { phone, password } = body as any;

    if (!phone || !password) {
      return Response.json(
        { error: "Missing phone or password" },
        { status: 400 },
      );
    }

    const { makeKvAuthStorage } = await import("./auth/kv-kv");
    const { login: doLogin } = await import("./auth/service");
    const storage = makeKvAuthStorage(env.AUTH_KV);

    try {
      const result = await doLogin(storage, { phone, password });
      return Response.json({
        user: result.user,
        organization: result.organization,
        shop: result.shop,
        storeId: result.organization.storeId,
        member: result.member,
      });
    } catch (e: any) {
      const status = e.name === "AuthError" ? 401 : 500;
      return Response.json({ error: e.message || "Login failed" }, { status });
    }
  },

  async handleMagicLinkLogin(request: Request, env: Env): Promise<Response> {
    const body = await request.json();
    const { token, phone, name, password } = body as any;

    if (!token || !phone || !name || !password) {
      return Response.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    const { makeKvAuthStorage } = await import("./auth/kv-kv");
    const { loginWithMagicLink } = await import("./auth/service");
    const storage = makeKvAuthStorage(env.AUTH_KV);

    try {
      const result = await loginWithMagicLink(storage, {
        token,
        phone,
        name,
        password,
      });
      return Response.json({
        user: result.user,
        organization: result.organization,
        shop: result.shop,
        storeId: result.organization.storeId,
        member: result.member,
      });
    } catch (e: any) {
      const status = e.name === "AuthError" ? 401 : 500;
      return Response.json(
        { error: e.message || "Magic link login failed" },
        { status },
      );
    }
  },

  async handleCreateMagicLink(request: Request, env: Env): Promise<Response> {
    const token = getToken(request);
    if (!token) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { role, permissions, shopId } = body as any;

    const { makeKvAuthStorage } = await import("./auth/kv-kv");
    const { validateSession, createMagicLink } = await import("./auth/service");
    const storage = makeKvAuthStorage(env.AUTH_KV);

    try {
      const session = await validateSession(storage, token);
      if (session.member.role !== "admin") {
        return Response.json(
          { error: "Only admins can create magic links" },
          { status: 403 },
        );
      }

      const result = await createMagicLink(storage, {
        role: role || "staff",
        permissions: permissions || [],
        shopId,
        createdByUserId: session.user.id,
      });

      return Response.json({ magicLink: result.token });
    } catch (e: any) {
      return Response.json(
        { error: e.message || "Failed to create magic link" },
        { status: 500 },
      );
    }
  },

  async handleLogout(request: Request, env: Env): Promise<Response> {
    const token = getToken(request);
    if (token) {
      const { makeKvAuthStorage } = await import("./auth/kv-kv");
      const { logout } = await import("./auth/service");
      const storage = makeKvAuthStorage(env.AUTH_KV);
      try {
        await logout(storage, token);
      } catch (e) {
        console.error("Logout error:", e);
      }
    }
    return Response.json({ ok: true });
  },

  async handleMe(request: Request, env: Env): Promise<Response> {
    const token = getToken(request);
    if (!token) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { makeKvAuthStorage } = await import("./auth/kv-kv");
    const { validateSession } = await import("./auth/service");
    const storage = makeKvAuthStorage(env.AUTH_KV);

    try {
      const session = await validateSession(storage, token);
      return Response.json({
        user: session.user,
        organization: session.organization,
        shop: session.shop,
        storeId: session.organization.storeId,
        member: session.member,
      });
    } catch (e: any) {
      return Response.json(
        { error: e.message || "Invalid session" },
        { status: 401 },
      );
    }
  },

  async handleDisableUser(request: Request, env: Env): Promise<Response> {
    const token = getToken(request);
    if (!token) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { userId } = body as any;

    const { makeKvAuthStorage } = await import("./auth/kv-kv");
    const { validateSession, disableUser } = await import("./auth/service");
    const storage = makeKvAuthStorage(env.AUTH_KV);

    try {
      const session = await validateSession(storage, token);
      if (session.user.role !== "founder") {
        return Response.json(
          { error: "Only founders can disable users" },
          { status: 403 },
        );
      }

      await disableUser(storage, userId);
      return Response.json({ ok: true });
    } catch (e: any) {
      return Response.json(
        { error: e.message || "Failed to disable user" },
        { status: 500 },
      );
    }
  },

  async handleEvents(request: Request, env: Env): Promise<Response> {
    const body = await request.json();
    const { storeId, events } = body as any;

    if (!storeId || !Array.isArray(events) || events.length === 0) {
      return Response.json(
        { error: "Invalid request: missing storeId or events" },
        { status: 400 },
      );
    }

    const doId = env.SYNC_STORE_DO.idFromName(storeId);
    const stub = env.SYNC_STORE_DO.get(doId);

    const response = await stub.fetch(
      new URL("/do/push", "http://localhost").toString(),
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ storeId, events }),
      },
    );

    const result = await response.json();
    return Response.json(result, { status: response.status });
  },

  async handlePull(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    let storeId = url.searchParams.get("storeId");
    let afterSeq = parseInt(url.searchParams.get("afterSeq") ?? "0", 10);

    if (request.method === "POST") {
      const body = await request.json();
      storeId = storeId || body.storeId;
      afterSeq = body.afterSeq ?? afterSeq;
    }

    if (!storeId) {
      return Response.json({ error: "Missing storeId" }, { status: 400 });
    }

    const doId = env.SYNC_STORE_DO.idFromName(storeId);
    const stub = env.SYNC_STORE_DO.get(doId);

    const response = await stub.fetch(
      new URL("/do/pull", "http://localhost").toString(),
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ storeId, afterSeq }),
      },
    );

    const result = await response.json();
    return Response.json(result, { status: response.status });
  },

  async handleOrders(request: Request, env: Env): Promise<Response> {
    const body = await request.json();
    const { shopId, order, storeId: providedStoreId } = body as any;

    if (!shopId || !order) {
      return Response.json(
        { error: "Invalid request: missing shopId or order" },
        { status: 400 },
      );
    }

    const { makeKvAuthStorage } = await import("./auth/kv-kv");
    const { ensureSchema, CHECKPOINT_TABLE } = await import("./sql/queries");
    const storage = makeKvAuthStorage(env.AUTH_KV);

    try {
      const shop = await storage.getShop(shopId);
      if (!shop) {
        return Response.json({ error: "Shop not found" }, { status: 404 });
      }

      const organization = await storage.getOrganization(shop.organizationId);
      const storeId = organization?.storeId;

      if (!storeId) {
        return Response.json(
          { error: "Unable to resolve storeId for shopId" },
          { status: 422 },
        );
      }

      if (providedStoreId && providedStoreId !== storeId) {
        return Response.json(
          { error: "Provided storeId does not match shopId" },
          { status: 409 },
        );
      }

      await ensureSchema(env.DB);

      const orderId = crypto.randomUUID();
      const clientId = "checkout-web";
      const sessionId = crypto.randomUUID();
      const timestamp = Date.now();

      const checkpoint = await env.DB.prepare(
        `SELECT lastSeqNum FROM ${CHECKPOINT_TABLE} WHERE storeId = ?`,
      )
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

      await env.DB.prepare(
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

      await env.DB.prepare(
        `INSERT INTO ${CHECKPOINT_TABLE} (storeId, lastSeqNum) VALUES (?, ?)
         ON CONFLICT(storeId) DO UPDATE SET lastSeqNum = excluded.lastSeqNum`,
      )
        .bind(storeId, seqNum)
        .run();

      return Response.json({ orderId, lastSeqNum: seqNum });
    } catch (e: any) {
      return Response.json(
        { error: e.message || "Failed to create order" },
        { status: 500 },
      );
    }
  },

  async handleCatalog(request: Request, db: D1Database): Promise<Response> {
    const url = new URL(request.url);
    const shopId = url.searchParams.get("shopId");

    if (!shopId) {
      return Response.json({ error: "Missing shopId" }, { status: 400 });
    }

    const { queryCatalog, ensureSchema } = await import("./sql/queries");
    await ensureSchema(db);

    try {
      const products = await queryCatalog(db, shopId);
      return Response.json({ products });
    } catch (e: any) {
      return Response.json(
        { error: e.message || "Failed to query catalog" },
        { status: 500 },
      );
    }
  },

  async handleCategories(request: Request, db: D1Database): Promise<Response> {
    const url = new URL(request.url);
    const shopId = url.searchParams.get("shopId");

    if (!shopId) {
      return Response.json({ error: "Missing shopId" }, { status: 400 });
    }

    const { queryCategories, ensureSchema } = await import("./sql/queries");
    await ensureSchema(db);

    try {
      const categories = await queryCategories(db, shopId);
      return Response.json({ categories });
    } catch (e: any) {
      return Response.json(
        { error: e.message || "Failed to query categories" },
        { status: 500 },
      );
    }
  },

  async handleCollections(request: Request, db: D1Database): Promise<Response> {
    const url = new URL(request.url);
    const shopId = url.searchParams.get("shopId");

    if (!shopId) {
      return Response.json({ error: "Missing shopId" }, { status: 400 });
    }

    const { queryCollections, ensureSchema } = await import("./sql/queries");
    await ensureSchema(db);

    try {
      const collections = await queryCollections(db, shopId);
      return Response.json({ collections });
    } catch (e: any) {
      return Response.json(
        { error: e.message || "Failed to query collections" },
        { status: 500 },
      );
    }
  },
};
