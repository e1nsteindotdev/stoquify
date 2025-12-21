import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const listCategories = query({
  handler: async (ctx) => {
    const categories = await ctx.db.query("categories").collect();
    const products = await ctx.db.query('products').collect()
    return categories.filter(c => {
      const ps = products.filter(p => p.categoryId == c._id && p.status === "active")
      return ps.length !== 0
    })
  },
});

export const listAllCategories = query({
  handler: async (ctx) => {
    const categories = await ctx.db.query("categories").collect()
    return categories
  }
})

export const createCategory = mutation({
  args: {
    name: v.string()
  },
  handler: async (ctx, args) => {
    const store = await ctx.db.query("stores").first()
    const categories = await ctx.db.query("categories").collect()
    if (!store) return;
    if (categories.filter(c => c.name === args.name).length > 0) return;

    return await ctx.db.insert("categories", { name: args.name, storeId: store?._id })
  },
});

export const getCategory = query({
  args: {
    categoryId: v.optional(v.string())
  },
  handler: async (ctx, { categoryId }) => {
    if (categoryId) {
      return await ctx.db.query('categories').filter(e => e.eq(e.field('_id'), categoryId)).unique()
    }
    else return;
  }
})
