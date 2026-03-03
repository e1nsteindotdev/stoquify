import { v } from "convex/values";
import { authedMutation, authedQuery } from "./customeFunction";

export const listExpenses = authedQuery({
  resource: "expenses",
  action: "read",
  args: {
    storeId: v.id("stores"),
  },
  handler: async (ctx, args) => {
    const expenses = await ctx.db
      .query("expenses")
      .withIndex("by_store", (q) => q.eq("storeId", args.storeId))
      .order("desc")
      .collect();

    const categories = await ctx.db
      .query("expenseCategories")
      .withIndex("by_store", (q) => q.eq("storeId", args.storeId))
      .collect();

    const categoryMap = new Map(categories.map((c) => [c._id, c]));

    return expenses.map((expense) => ({
      ...expense,
      category: expense.categoryId
        ? categoryMap.get(expense.categoryId)
        : undefined,
    }));
  },
});

export const createExpense = authedMutation({
  resource: "expenses",
  action: "create",
  args: {
    storeId: v.id("stores"),
    title: v.string(),
    description: v.optional(v.string()),
    cost: v.number(),
    date: v.number(),
    categoryId: v.optional(v.id("expenseCategories")),
  },
  handler: async (ctx, args) => {
    const id = await ctx.db.insert("expenses", {
      storeId: args.storeId,
      title: args.title,
      description: args.description,
      cost: args.cost,
      date: args.date,
      categoryId: args.categoryId,
    });
    return id;
  },
});

export const updateExpense = authedMutation({
  resource: "expenses",
  action: "update",
  args: {
    id: v.id("expenses"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    cost: v.optional(v.number()),
    date: v.optional(v.number()),
    categoryId: v.optional(v.id("expenseCategories")),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    await ctx.db.patch(id, updates);
  },
});

export const deleteExpense = authedMutation({
  resource: "expenses",
  action: "delete",
  args: {
    id: v.id("expenses"),
  },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});
