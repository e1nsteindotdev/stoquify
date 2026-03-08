import { v } from "convex/values";
import { authedMutation, authedQuery } from "./customFunctions";
import { Id } from "./_generated/dataModel";

export const insert = authedMutation({
  resource: "stores",
  action: "create",
  args: {
    name: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(ctx.userId);

    if (!user?.organizationId) {
      throw new Error("No organization found");
    }

    const now = Date.now();
    const store = await ctx.db.insert("stores", {
      name: args.name,
      organizationId: user.organizationId,
      lastUpdate: now,
    });

    return store;
  },
});

export const list = authedQuery({
  args: {
    cursor: v.optional(v.number()),
  },
  handler: async (ctx, { cursor }) => {
    const user = await ctx.db.get(ctx.userId);
    if (!user?.organizationId) return [];

    let query = ctx.db
      .query("stores")
      .withIndex("by_organization", (q) =>
        q.eq("organizationId", user.organizationId as Id<"organizations">),
      );

    if (cursor) {
      query = query.filter((q) => q.gt(q.field("lastUpdate"), cursor));
    }

    return await query.collect();
  },
});
