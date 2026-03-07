import { v } from "convex/values";
import { authedMutation, authedQuery } from "./customFunctions";

export const listFaqs = authedQuery({
  resource: "settings",
  action: "read",
  args: {
    cursor: v.optional(v.number()),
  },
  handler: async (ctx, { cursor }) => {
    let query = ctx.db.query("faqs");

    if (cursor) {
      query = query.filter((q) => q.gt(q.field("lastUpdate"), cursor));
    }

    const faqs = await query.collect();
    return faqs.sort((a, b) => a.order - b.order);
  },
});

export const insertFaq = authedMutation({
  resource: "settings",
  action: "create",
  args: {
    question: v.string(),
    answer: v.string(),
    order: v.number(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    return await ctx.db.insert("faqs", {
      question: args.question,
      answer: args.answer,
      order: args.order,
      lastUpdate: now,
    });
  },
});

export const updateFaq = authedMutation({
  resource: "settings",
  action: "update",
  args: {
    id: v.id("faqs"),
    question: v.optional(v.string()),
    answer: v.optional(v.string()),
    order: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    await ctx.db.patch(id, { ...updates, lastUpdate: Date.now() });
  },
});

export const removeFaq = authedMutation({
  resource: "settings",
  action: "delete",
  args: {
    id: v.id("faqs"),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { deleted: true, lastUpdate: Date.now() });
  },
});

export const get = authedQuery({
  resource: "settings",
  action: "read",
  args: {},
  handler: async (ctx) => {
    const storeId = (await ctx.db.query("stores").first())?._id;
    if (!storeId) return null;

    const settings = await ctx.db
      .query("settings")
      .withIndex("by_store", (q) => q.eq("storeId", storeId))
      .first();

    return settings;
  },
});

export const update = authedMutation({
  resource: "settings",
  action: "update",
  args: {
    locationLink: v.optional(v.string()),
    instagramLink: v.optional(v.string()),
    facebookLink: v.optional(v.string()),
    tiktokLink: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const storeId = (await ctx.db.query("stores").first())?._id;
    if (!storeId) throw new Error("No store found");

    const existing = await ctx.db
      .query("settings")
      .withIndex("by_store", (q) => q.eq("storeId", storeId))
      .first();

    const now = Date.now();

    if (existing) {
      await ctx.db.patch(existing._id, { ...args, lastUpdate: now });
      return existing._id;
    } else {
      return await ctx.db.insert("settings", {
        storeId,
        ...args,
        lastUpdate: now,
      });
    }
  },
});
