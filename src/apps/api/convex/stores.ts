import { v } from "convex/values";
import { authedMutation, authedQuery } from "./customeFunction";

export const create = authedMutation({
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

    const store = await ctx.db.insert("stores", {
      name: args.name,
      organizationId: user.organizationId,
    });

    return store;
  },
});

export const list = authedQuery({
  resource: "stores",
  action: "read",
  handler: async (ctx) => {
    const user = await ctx.db.get(ctx.userId);
    if (!user?.organizationId) return [];

    return await ctx.db
      .query("stores")
      .withIndex("by_organization", (q) =>
        q.eq("organizationId", user.organizationId),
      )
      .collect();
  },
});

