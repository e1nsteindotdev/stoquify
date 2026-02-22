import type { KVNamespace } from "@cloudflare/workers-types";
import { makeKvAuthStorage } from "./kv-kv";
import * as authService from "./service";
import type { ValidatedSession } from "./service";
import { getCorsHeaders } from "../actions";

export const getSessionToken = (request: Request): string | null => {
  const cookie = request.headers.get("Cookie");
  if (!cookie) return null;
  const match = cookie.match(/stoquify_session=([^;]+)/);
  return match?.[1] ?? null;
};

export const canPerform = (
  member: ValidatedSession["member"],
  action: string,
): boolean => {
  if (member.role === "admin") return true;
  return member.permissions.includes(action);
};

export const withAuth = async (
  request: Request,
  kv: KVNamespace,
  handler: (session: ValidatedSession) => Promise<Response>,
): Promise<Response> => {
  const token = getSessionToken(request);
  if (!token) {
    return new Response("Unauthorized", {
      status: 401,
      headers: getCorsHeaders(request),
    });
  }

  const storage = makeKvAuthStorage(kv);

  try {
    const session = await authService.validateSession(storage, token);
    return await handler(session);
  } catch (e: any) {
    if (e.name === "AuthError") {
      return new Response(e.message, {
        status: 401,
        headers: getCorsHeaders(request),
      });
    }
    return new Response(e.message || "Error", {
      status: 500,
      headers: getCorsHeaders(request),
    });
  }
};
