import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const listExpenseCategories = query({
  args: {
    storeId: v.id("stores"),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("expenseCategories")
      .withIndex("by_store", (q) => q.eq("storeId", args.storeId))
      .collect();
  },
});

export const createExpenseCategory = mutation({
  args: {
    storeId: v.id("stores"),
    name: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("expenseCategories")
      .withIndex("by_store", (q) => q.eq("storeId", args.storeId))
      .filter((q) => q.eq(q.field("name"), args.name))
      .first();

    if (existing) return existing._id;

    const id = await ctx.db.insert("expenseCategories", {
      name: args.name,
      storeId: args.storeId,
    });
    return id;
  },
});

export const deleteExpenseCategory = mutation({
  args: {
    id: v.id("expenseCategories"),
  },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});
