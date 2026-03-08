import { v } from "convex/values";
import { authedQuery, authedMutation } from "./customFunctions";

const permissions = v.array(
  v.object({
    storeId: v.optional(v.id("stores")),
    resource: v.string(),
    action: v.union(v.literal("write"), v.literal("read"), v.literal("*")),
  }),
);

export const getById = authedQuery({
  resource: "users",
  action: "read",
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const currentUser = await ctx.db.get(ctx.userId);
    if (!currentUser) return null;

    const user = await ctx.db.get(args.userId);
    if (!user || user.organizationId !== currentUser.organizationId) {
      return null;
    }
    return user;
  },
});

export const get = authedQuery({
  resource: "users",
  action: "read",
  args: {},
  handler: async (ctx) => {
    const user = await ctx.db.get(ctx.userId);
    return user;
  },
});

export const me = authedQuery({
  args: {},
  handler: async (ctx) => {
    const user = await ctx.db.get(ctx.userId);

    if (!user) return null;

    const organization = await ctx.db
      .query("organizations")
      .filter((q) => q.eq(q.field("_id"), user?.organizationId))
      .unique();

    if (!organization) return null;

    return {
      _id: user._id,
      name: user.name,
      email: user.email,
      phoneNumber: user.phone,
      permissions: user.permissions,
      role: user.role,
      organization: organization,
    };
  },
});

export const listOrganization = authedQuery({
  resource: "users",
  action: "read",
  args: {},
  handler: async (ctx) => {
    const currentUser = await ctx.db.get(ctx.userId);

    if (!currentUser) return [];

    const users = await ctx.db
      .query("users")
      .filter((q) =>
        q.eq(q.field("organizationId"), currentUser.organizationId),
      )
      .collect();

    return users.map((user) => ({
      _id: user._id,
      name: user.name,
      email: user.email,
      phoneNumber: user.phone,
      permissions: user.permissions,
      role: user.role,
    }));
  },
});

export const remove = authedMutation({
  resource: "employees",
  action: "write",
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const currentUser = await ctx.db.get(ctx.userId);
    if (!currentUser) throw new Error("Not authenticated");

    const userToDelete = await ctx.db.get(args.userId);
    if (!userToDelete) throw new Error("User not found");

    if (userToDelete.organizationId !== currentUser.organizationId) {
      throw new Error("Not authorized");
    }

    // Delete auth accounts to prevent breaking auth for others
    const authAccounts = await ctx.db
      .query("authAccounts")
      .filter((q) => q.eq(q.field("userId"), args.userId))
      .collect();

    for (const account of authAccounts) {
      await ctx.db.delete(account._id);
    }

    // Delete user sessions too
    const sessions = await ctx.db
      .query("authSessions")
      .filter((q) => q.eq(q.field("userId"), args.userId))
      .collect();

    for (const session of sessions) {
      await ctx.db.delete(session._id);
    }

    await ctx.db.delete(args.userId);
  },
});

export const updatePermissions = authedMutation({
  resource: "employees",
  action: "write",
  args: {
    userId: v.id("users"),
    role: v.union(v.literal("founder"), v.literal("admin"), v.literal("staff")),
    permissions: permissions,
  },
  handler: async (ctx, args) => {
    const currentUser = await ctx.db.get(ctx.userId);
    if (!currentUser) throw new Error("Not authenticated");

    const userToUpdate = await ctx.db.get(args.userId);
    if (!userToUpdate) throw new Error("User not found");

    if (userToUpdate.organizationId !== currentUser.organizationId) {
      throw new Error("Not authorized");
    }

    await ctx.db.patch(args.userId, {
      role: args.role,
      permissions: args.permissions,
      lastUpdate: Date.now(),
    });
  },
});
