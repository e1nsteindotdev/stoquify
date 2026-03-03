import { v } from "convex/values";
import { authedMutation, authedQuery } from "./customeFunction";

export const listExpenseCategories = authedQuery({
  resource: "expenseCategories",
  action: "read",
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

export const createExpenseCategory = authedMutation({
  resource: "expenseCategories",
  action: "create",
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

export const deleteExpenseCategory = authedMutation({
  resource: "expenseCategories",
  action: "delete",
  args: {
    id: v.id("expenseCategories"),
  },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});
