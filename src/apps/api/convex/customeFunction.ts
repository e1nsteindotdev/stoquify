import { query, mutation, action } from "./_generated/server";
import {
  customQuery,
  customMutation,
  customAction,
} from "convex-helpers/server/customFunctions";
import { ConvexError } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

type AuthOption = { resource: string; action: string };

async function ensureAuthenticated(ctx: any, opts?: AuthOption) {
  const userId = await getAuthUserId(ctx);
  if (userId === null) {
    throw new ConvexError("Not authenticated");
  }

  if (!opts) return {};

  const { resource, action } = opts;
  const user = await ctx.db.get(userId);
  const hasPermission = user?.permissions?.some(
    (perm: { resource: string; action: string }) =>
      (perm.resource === "*" || perm.resource === resource) &&
      (perm.action === action || perm.action === "*"),
  );
  if (!hasPermission)
    throw new ConvexError(
      "User does not have permission to perform this action.",
    );

  return {};
}

export const authedQuery = customQuery(query, {
  args: {},
  input: async (ctx, args, opts?: Record<string, any>) => {
    await ensureAuthenticated(ctx, opts as AuthOption | undefined);
    return { ctx, args };
  },
});

export const authedMutation = customMutation(mutation, {
  args: {},

  input: async (ctx, args, opts?: Record<string, any>) => {
    await ensureAuthenticated(ctx, opts as AuthOption | undefined);
    return { ctx, args };
  },
});

export const authedAction = customAction(action, {
  args: {},
  input: async (ctx, args, opts?: Record<string, any>) => {
    await ensureAuthenticated(ctx, opts as AuthOption | undefined);
    return { ctx, args };
  },
});
