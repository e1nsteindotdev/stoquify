import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const listCategories = query({
  handler: async (ctx) => {
    return await ctx.db.query("categories").collect();
  },
});

export const createCategory = mutation({
  args: {
    name: v.string()
  },
  handler: async (ctx, args) => {
    const store = await ctx.db.query("stores").first()
    if (!store) return;
    return await ctx.db.insert("categories", { name: args.name, storeId: store?._id })
  },
});
