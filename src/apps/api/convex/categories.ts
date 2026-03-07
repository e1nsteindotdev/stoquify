import { v } from "convex/values";
import { authedMutation, authedQuery } from "./customFunctions";

export const listActive = authedQuery({
  resource: "categories",
  action: "read",
  args: { storeId: v.id("stores") },
  handler: async (ctx, { storeId }) => {
    const categories = await ctx.db
      .query("categories")
      .withIndex("by_store", (q) => q.eq("storeId", storeId))
      .collect();
    const products = await ctx.db
      .query("products")
      .withIndex("by_store", (q) => q.eq("storeId", storeId))
      .collect();
    return categories.filter((c) => {
      const ps = products.filter(
        (p) => p.categoryId == c._id && p.status === "active",
      );
      return ps.length !== 0;
    });
  },
});
export const list = authedQuery({
  resource: "categories",
  action: "read",
  args: {
    storeId: v.id("stores"),
    cursor: v.optional(v.number()),
  },
  handler: async (ctx, { storeId, cursor }) => {
    let categoriesQuery = ctx.db
      .query("categories")
      .withIndex("by_store", (q) => q.eq("storeId", storeId));

    if (cursor) {
      categoriesQuery = categoriesQuery.filter((q) =>
        q.gt(q.field("lastUpdate"), cursor),
      );
    }

    const categories = await categoriesQuery.collect();
    return categories;
  },
});

export const insert = authedMutation({
  resource: "categories",
  action: "create",
  args: {
    storeId: v.id("stores"),
    name: v.string(),
  },
  handler: async (ctx, args) => {
    const categories = await ctx.db
      .query("categories")
      .withIndex("by_store", (q) => q.eq("storeId", args.storeId))
      .collect();
    if (categories.filter((c) => c.name === args.name).length > 0) return;
    const now = Date.now();
    const id = await ctx.db.insert("categories", {
      name: args.name,
      storeId: args.storeId,
      lastUpdate: now,
    });
    console.log("created cat :", id);
    return id;
  },
});

export const get = authedQuery({
  resource: "categories",
  action: "read",
  args: {
    categoryId: v.optional(v.string()),
  },
  handler: async (ctx, { categoryId }) => {
    if (categoryId) {
      return await ctx.db
        .query("categories")
        .filter((e) => e.eq(e.field("_id"), categoryId))
        .unique();
    } else return;
  },
});
