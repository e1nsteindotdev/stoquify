import { v } from "convex/values";
import { authedMutation, authedQuery } from "./customeFunction";

// Get FAQs
export const getFAQs = authedQuery({
  resource: "settings",
  action: "read",
  args: {},
  handler: async (ctx) => {
    const faqs = await ctx.db.query("faqs").collect();
    return faqs.sort((a, b) => a.order - b.order);
  },
});

// Create FAQ
export const createFAQ = authedMutation({
  resource: "settings",
  action: "create",
  args: {
    question: v.string(),
    answer: v.string(),
    order: v.number(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("faqs", {
      question: args.question,
      answer: args.answer,
      order: args.order,
    });
  },
});

// Update FAQ
export const updateFAQ = authedMutation({
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
    await ctx.db.patch(id, updates);
  },
});

// Delete FAQ
export const deleteFAQ = authedMutation({
  resource: "settings",
  action: "delete",
  args: {
    id: v.id("faqs"),
  },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});

// Get settings for the default store
export const getSettings = authedQuery({
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

    // if (!settings) {
    //   // Create default settings if none exist
    //   const defaultId = await ctx.db.insert("settings", {
    //     storeId: storeId,
    //     locationLink: "",
    //     instagramLink: "",
    //     facebookLink: "",
    //     tiktokLink: "",
    //   });
    //   return await ctx.db.get(defaultId);
    // }

    return settings;
  },
});

// Update settings for the default store
export const updateSettings = authedMutation({
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

    if (existing) {
      await ctx.db.patch(existing._id, args);
      return existing._id;
    } else {
      return await ctx.db.insert("settings", {
        storeId,
        ...args,
      });
    }
  },
});
