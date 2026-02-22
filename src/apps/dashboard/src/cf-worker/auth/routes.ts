import type { D1Database, KVNamespace } from "@cloudflare/workers-types";
import { makeKvAuthStorage } from "./kv-kv";
import * as authService from "./service";
import { CHECKPOINT_TABLE, ensureSchema } from "../sql/queries";

type Env = {
  DB: D1Database;
  AUTH_KV: KVNamespace;
};

const AUTH_COOKIE = "stoquify_session";

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

const getToken = (req: Request): string | null => {
  const cookie = req.headers.get("Cookie");
  if (!cookie) return null;
  const match = cookie.match(new RegExp(`${AUTH_COOKIE}=([^;]+)`));
  return match?.[1] ?? null;
};

const setCookie = (token: string, origin: string): Headers => {
  const corsHeaders = {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers":
      "Content-Type, Authorization, X-Requested-With",
    "Access-Control-Allow-Credentials": "true",
    Vary: "Origin, Access-Control-Request-Headers",
  };
  const headers = new Headers(corsHeaders);
  headers.set(
    "Set-Cookie",
    `${AUTH_COOKIE}=${token}; Path=/; HttpOnly; Secure; SameSite=None`,
  );
  return headers;
};

const clearCookie = (origin: string): Headers => {
  const corsHeaders = {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers":
      "Content-Type, Authorization, X-Requested-With",
    "Access-Control-Allow-Credentials": "true",
    Vary: "Origin, Access-Control-Request-Headers",
  };
  const headers = new Headers(corsHeaders);
  headers.set(
    "Set-Cookie",
    `${AUTH_COOKIE}=; Path=/; HttpOnly; Secure; SameSite=None; Max-Age=0`,
  );
  return headers;
};

const seedAuthBootstrapEvents = async (
  db: D1Database,
  input: {
    storeId: string;
    organization: { id: string; name: string; createdAt: number };
    shop: {
      id: string;
      name: string;
      organizationId: string;
      createdAt: number;
    };
  },
) => {
  await ensureSchema(db);

  const checkpoint = await db
    .prepare(`SELECT lastSeqNum FROM ${CHECKPOINT_TABLE} WHERE storeId = ?`)
    .bind(input.storeId)
    .first<{ lastSeqNum: number }>();

  let seqNum = checkpoint?.lastSeqNum ?? 0;
  const timestamp = Date.now();

  const events = [
    {
      name: "v1.OrgCreated",
      args: {
        id: input.organization.id,
        organization_name: input.organization.name,
        createdAt: input.organization.createdAt,
      },
    },
    {
      name: "v1.ShopCreated",
      args: {
        id: input.shop.id,
        name: input.shop.name,
        organization_id: input.shop.organizationId,
        createdAt: input.shop.createdAt,
      },
    },
  ];

  for (const event of events) {
    seqNum += 1;
    await db
      .prepare(
        `INSERT INTO eventlog (storeId, seqNum, eventName, eventArgs, clientId, sessionId, parentSeqNum, timestamp)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .bind(
        input.storeId,
        seqNum,
        event.name,
        JSON.stringify(event.args),
        "auth-bootstrap",
        `signup:${input.organization.id}`,
        seqNum - 1,
        timestamp,
      )
      .run();
  }

  await db
    .prepare(
      `INSERT INTO ${CHECKPOINT_TABLE} (storeId, lastSeqNum) VALUES (?, ?)
       ON CONFLICT(storeId) DO UPDATE SET lastSeqNum = excluded.lastSeqNum`,
    )
    .bind(input.storeId, seqNum)
    .run();
};

const deleteAllKvKeys = async (kv: KVNamespace): Promise<number> => {
  let cursor: string | undefined;
  let deletedKeys = 0;

  do {
    const page = await kv.list({ cursor, limit: 1000 });
    if (page.keys.length > 0) {
      await Promise.all(page.keys.map((key) => kv.delete(key.name)));
      deletedKeys += page.keys.length;
    }
    cursor = page.list_complete ? undefined : page.cursor;
  } while (cursor);

  return deletedKeys;
};

export const handleAuth = async (
  request: Request,
  env: Env,
): Promise<Response> => {
  const storage = makeKvAuthStorage(env.AUTH_KV);
  const url = new URL(request.url);
  const pathname = url.pathname;

  // DEV ONLY: reset all auth KV entries
  if (
    pathname === "/api/auth/reset-kv" &&
    (request.method === "GET" || request.method === "POST")
  ) {
    try {
      const deletedKeys = await deleteAllKvKeys(env.AUTH_KV);
      return Response.json(
        {
          ok: true,
          deletedKeys,
          message: "AUTH_KV cleared",
        },
        { headers: getCorsHeaders(request) },
      );
    } catch (e: any) {
      return new Response(e.message || "Error", {
        status: 500,
        headers: getCorsHeaders(request),
      });
    }
  }

  // POST /api/auth/signup
  if (pathname === "/api/auth/signup" && request.method === "POST") {
    try {
      const body = await request.json();
      const { phone, name, email, password, organizationName, shopName } = body;

      if (!phone || !name || !password || !organizationName || !shopName) {
        return new Response("Missing required fields", {
          status: 400,
          headers: getCorsHeaders(request),
        });
      }

      if (password.length < 4) {
        return new Response("Password must be at least 4 characters", {
          status: 400,
          headers: getCorsHeaders(request),
        });
      }

      const result = await authService.signup(storage, {
        phone,
        name,
        email,
        password,
        organizationName,
        shopName,
      });

      try {
        await seedAuthBootstrapEvents(env.DB, {
          storeId: result.organization.storeId,
          organization: {
            id: result.organization.id,
            name: result.organization.name,
            createdAt: result.organization.createdAt,
          },
          shop: {
            id: result.shop.id,
            name: result.shop.name,
            organizationId: result.shop.organizationId,
            createdAt: result.shop.createdAt,
          },
        });
      } catch (seedError) {
        console.error("Failed to seed auth bootstrap events", seedError);
      }

      const headers = setCookie(
        result.sessionToken,
        request.headers.get("Origin") ?? "*",
      );

      return Response.json(
        {
          user: {
            id: result.user.id,
            phone: result.user.phone,
            name: result.user.name,
            role: result.user.role,
            confirmed: result.user.confirmed,
          },
          organization: {
            id: result.organization.id,
            name: result.organization.name,
          },
          shop: {
            id: result.shop.id,
            name: result.shop.name,
          },
          storeId: result.organization.storeId,
        },
        { headers },
      );
    } catch (e: any) {
      return new Response(e.message || "Error", {
        status: 500,
        headers: getCorsHeaders(request),
      });
    }
  }

  // POST /api/auth/login
  if (pathname === "/api/auth/login" && request.method === "POST") {
    try {
      const body = await request.json();
      const { phone, password } = body;

      if (!phone || !password) {
        return new Response("Missing phone or password", {
          status: 400,
          headers: getCorsHeaders(request),
        });
      }

      const result = await authService.login(storage, { phone, password });
      console.log("login result : ", result);

      const headers = setCookie(
        result.sessionToken,
        request.headers.get("Origin") ?? "*",
      );

      return Response.json(
        {
          user: {
            id: result.user.id,
            phone: result.user.phone,
            name: result.user.name,
            role: result.user.role,
            confirmed: result.user.confirmed,
          },
          organization: {
            id: result.organization.id,
            name: result.organization.name,
          },
          shop: {
            id: result.shop.id,
            name: result.shop.name,
          },
          storeId: result.organization.storeId,
          member: {
            role: result.member.role,
            permissions: result.member.permissions,
          },
        },
        { headers },
      );
    } catch (e: any) {
      const status = e.name === "AuthError" ? 401 : 500;
      console.warn("[auth/login] failed", {
        status,
        reason: e?.message ?? "Unknown error",
        errorName: e?.name ?? "UnknownError",
        origin: request.headers.get("Origin"),
      });
      return new Response(e.message || "Error", {
        status,
        headers: getCorsHeaders(request),
      });
    }
  }

  // POST /api/auth/login-magic
  if (pathname === "/api/auth/login-magic" && request.method === "POST") {
    try {
      const body = await request.json();
      const { token, phone, name, password } = body;

      if (!token || !phone || !name || !password) {
        return new Response("Missing required fields", {
          status: 400,
          headers: getCorsHeaders(request),
        });
      }

      if (password.length < 4) {
        return new Response("Password must be at least 4 characters", {
          status: 400,
          headers: getCorsHeaders(request),
        });
      }

      const result = await authService.loginWithMagicLink(storage, {
        token,
        phone,
        name,
        password,
      });
      const headers = setCookie(
        result.sessionToken,
        request.headers.get("Origin") ?? "*",
      );

      return Response.json(
        {
          user: {
            id: result.user.id,
            phone: result.user.phone,
            name: result.user.name,
            role: result.user.role,
            confirmed: result.user.confirmed,
          },
          organization: {
            id: result.organization.id,
            name: result.organization.name,
          },
          shop: {
            id: result.shop.id,
            name: result.shop.name,
          },
          storeId: result.organization.storeId,
          member: {
            role: result.member.role,
            permissions: result.member.permissions,
          },
        },
        { headers },
      );
    } catch (e: any) {
      const status = e.name === "AuthError" ? 401 : 500;
      return new Response(e.message || "Error", {
        status,
        headers: getCorsHeaders(request),
      });
    }
  }

  // POST /api/auth/create-magic-link
  if (pathname === "/api/auth/create-magic-link" && request.method === "POST") {
    try {
      const token = getToken(request);
      if (!token) {
        return new Response("Unauthorized", {
          status: 401,
          headers: getCorsHeaders(request),
        });
      }

      const session = await authService.validateSession(storage, token);
      if (!session.member.role || session.member.role !== "admin") {
        return new Response("Forbidden - admin only", {
          status: 403,
          headers: getCorsHeaders(request),
        });
      }

      const body = await request.json();
      const { role, permissions, shopId } = body;

      const result = await authService.createMagicLink(storage, {
        role: role || "staff",
        permissions: permissions || [],
        shopId,
        createdByUserId: session.user.id,
      });

      const magicLinkUrl = `${url.origin}/signup?token=${result.token}`;

      return Response.json(
        { magicLink: magicLinkUrl },
        { headers: getCorsHeaders(request) },
      );
    } catch (e: any) {
      const status = e.name === "AuthError" ? 401 : 500;
      return new Response(e.message || "Error", {
        status,
        headers: getCorsHeaders(request),
      });
    }
  }

  // POST /api/auth/logout
  if (pathname === "/api/auth/logout" && request.method === "POST") {
    const token = getToken(request);
    if (token) {
      await authService.logout(storage, token);
    }
    return Response.json(
      { ok: true },
      { headers: clearCookie(request.headers.get("Origin") ?? "*") },
    );
  }

  // GET /api/auth/me
  if (pathname === "/api/auth/me" && request.method === "GET") {
    try {
      const token = getToken(request);
      if (!token) {
        console.warn("[auth/me] missing session cookie", {
          hasCookieHeader: Boolean(request.headers.get("Cookie")),
          origin: request.headers.get("Origin"),
        });
        return new Response("Unauthorized", {
          status: 401,
          headers: getCorsHeaders(request),
        });
      }

      const session = await authService.validateSession(storage, token);

      return Response.json(
        {
          user: {
            id: session.user.id,
            phone: session.user.phone,
            name: session.user.name,
            role: session.user.role,
            confirmed: session.user.confirmed,
          },
          organization: {
            id: session.organization.id,
            name: session.organization.name,
          },
          shop: {
            id: session.shop.id,
            name: session.shop.name,
          },
          storeId: session.organization.storeId,
          member: {
            role: session.member.role,
            permissions: session.member.permissions,
          },
        },
        { headers: getCorsHeaders(request) },
      );
    } catch (e: any) {
      console.warn("[auth/me] session validation failed", {
        reason: e?.message ?? "Unknown error",
        errorName: e?.name ?? "UnknownError",
        origin: request.headers.get("Origin"),
      });
      return new Response(e.message || "Error", {
        status: 401,
        headers: getCorsHeaders(request),
      });
    }
  }

  // POST /api/auth/disable-user
  if (pathname === "/api/auth/disable-user" && request.method === "POST") {
    try {
      const token = getToken(request);
      if (!token) {
        return new Response("Unauthorized", {
          status: 401,
          headers: getCorsHeaders(request),
        });
      }

      const session = await authService.validateSession(storage, token);
      if (session.user.role !== "founder") {
        return new Response("Forbidden - founder only", {
          status: 403,
          headers: getCorsHeaders(request),
        });
      }

      const body = await request.json();
      const { userId } = body;

      await authService.disableUser(storage, userId);

      return Response.json({ ok: true }, { headers: getCorsHeaders(request) });
    } catch (e: any) {
      const status = e.name === "AuthError" ? 401 : 500;
      return new Response(e.message || "Error", {
        status,
        headers: getCorsHeaders(request),
      });
    }
  }

  return new Response("Not found", {
    status: 404,
    headers: getCorsHeaders(request),
  });
};
