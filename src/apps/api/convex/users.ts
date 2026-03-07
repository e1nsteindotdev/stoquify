import { v } from "convex/values";
import { authedQuery } from "./customFunctions";

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
  resource: "users",
  action: "read",
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
  args: {
    cursor: v.optional(v.number()),
  },
  handler: async (ctx, { cursor }) => {
    const currentUser = await ctx.db.get(ctx.userId);

    if (!currentUser) return [];

    let query = ctx.db
      .query("users")
      .filter((q) =>
        q.eq(q.field("organizationId"), currentUser.organizationId),
      );

    if (cursor) {
      query = query.filter((q) => q.gt(q.field("lastUpdate"), cursor));
    }

    const users = await query.collect();

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
