import { query, mutation, action } from "./_generated/server";
import {
  customQuery,
  customMutation,
  customAction,
} from "convex-helpers/server/customFunctions";
import { ConvexError } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

async function ensureAuthenticated(ctx: any, role?: string | string[] | undefined) {
  const userId = await getAuthUserId(ctx);
  if (userId === null) {
    throw new ConvexError("Not authenticated");
  }
  if (role) {
    const user = await ctx.db.get(userId)
    if (role) {
      if (typeof role === 'string') {
        if (user?.role != role) throw new ConvexError("User with this role is not authorized to do this.")
      } else {
        role.forEach(role => {
          if (user?.role != role) throw new ConvexError("User with this role is not authorized to do this.")
        })
      }
    }
  }
  return {};
}

export const authedQuery = customQuery(query, {
  args: {},
  input: async (ctx, args, opts?: { roles?: string | string[] | undefined }) => {
    await ensureAuthenticated(ctx, opts?.roles);
    return { ctx: {}, args };
  },
});

export const authedMutation = customMutation(mutation, {
  args: {},
  input: async (ctx, args, opts?: { roles?: string | string[] | undefined }) => {
    await ensureAuthenticated(ctx, opts?.roles);
    return { ctx: {}, args };
  },
});

export const authedAction = customAction(action, {
  args: {},
  input: async (ctx, args, opts?: { roles?: string | string[] | undefined }) => {
    await ensureAuthenticated(ctx, opts?.roles);
    return { ctx: {}, args };
  },
});
