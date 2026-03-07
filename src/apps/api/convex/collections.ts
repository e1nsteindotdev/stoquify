import { v } from "convex/values";
import { authedMutation, authedQuery } from "./customFunctions";

export const listByProduct = authedQuery({
  resource: "collections",
  action: "read",
  args: {
    productId: v.optional(v.id("products")),
  },
  handler: async (ctx, args) => {
    if (args.productId) {
      let collections = await ctx.db.query("collections").collect();
      return collections.filter((c) => {
        const ids = c?.productIds?.filter(
          (id) => id === args.productId,
        )?.length;
        if (ids && ids > 0) return true;
        else return false;
      });
    } else return undefined;
  },
});

export const list = authedQuery({
  resource: "collections",
  action: "read",
  args: {
    storeId: v.id("stores"),
    cursor: v.optional(v.number()),
  },
  handler: async (ctx, { storeId, cursor }) => {
    let query = ctx.db
      .query("collections")
      .filter((e) => e.eq(e.field("storeId"), storeId));

    if (cursor) {
      query = query.filter((q) => q.gt(q.field("lastUpdate"), cursor));
    }

    return await query.collect();
  },
});

export const listSelected = authedQuery({
  resource: "collections",
  action: "read",
  args: {
    productId: v.optional(v.id("products")),
  },
  handler: async (ctx, args) => {
    if (args.productId) {
      let collections = await ctx.db.query("collections").collect();
      const ids = collections
        .filter((c) => {
          const ids = c?.productIds?.filter(
            (id) => id === args.productId,
          )?.length;
          if (ids && ids > 0) return true;
          else return false;
        })
        .map((c) => c._id);
      return ids;
    } else return;
  },
});

export const insert = authedMutation({
  resource: "collections",
  action: "create",
  args: {
    storeId: v.id("stores"),
    title: v.string(),
  },
  handler: async (ctx, args) => {
    const collections = await ctx.db
      .query("collections")
      .filter((e) => e.eq(e.field("storeId"), args.storeId))
      .collect();
    for (let c of collections) {
      if (c.title == args.title)
        return {
          ok: false,
          msg: "Collection already exists with this name.",
        };
    }
    const now = Date.now();
    const id = await ctx.db.insert("collections", {
      storeId: args.storeId,
      title: args.title,
      lastUpdate: now,
    });
    return {
      ok: true,
      id,
    };
  },
});
