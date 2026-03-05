import { v } from "convex/values";
import { authedMutation, authedQuery } from "./customeFunction";

export const generateUploadUrl = authedMutation({
  resource: "images",
  action: "create",
  args: {},
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl();
  },
});

export const getUrl = authedQuery({
  resource: "images",
  action: "read",
  args: {
    storageId: v.id("_storage"),
  },
  handler: async (ctx, args) => {
    return await ctx.storage.getUrl(args.storageId);
  },
});

export const createImage = authedMutation({
  resource: "images",
  action: "create",
  args: {
    productId: v.id("products"),
    url: v.string(),
    order: v.number(),
    hidden: v.boolean(),
    indexedDBId: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("images", {
      productId: args.productId,
      url: args.url,
      order: args.order,
      hidden: args.hidden,
      indexedDBId: args.indexedDBId,
    });
  },
});

export const updateImage = authedMutation({
  resource: "images",
  action: "update",
  args: {
    imageId: v.id("images"),
    url: v.optional(v.string()),
    order: v.optional(v.number()),
    hidden: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { imageId, ...updates } = args;
    await ctx.db.patch(imageId, updates);
    return imageId;
  },
});

export const deleteImage = authedMutation({
  resource: "images",
  action: "delete",
  args: {
    imageId: v.id("images"),
  },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.imageId);
  },
});

export const handleImageChanges = authedMutation({
  resource: "images",
  action: "update",
  args: {
    productId: v.id("products"),
    toCreate: v.array(
      v.object({
        url: v.string(),
        order: v.number(),
        hidden: v.boolean(),
        indexedDBId: v.optional(v.number()),
      }),
    ),
    toUpdate: v.array(
      v.object({
        imageId: v.id("images"),
        url: v.optional(v.string()),
        order: v.optional(v.number()),
        hidden: v.optional(v.boolean()),
        indexedDBId: v.optional(v.number()),
      }),
    ),
    toDelete: v.array(v.id("images")),
  },
  handler: async (ctx, args) => {
    try {
      for (const image of args.toDelete) {
        await ctx.db.delete(image);
      }

      for (const image of args.toUpdate) {
        const { imageId, ...updates } = image;
        await ctx.db.patch(imageId, updates);
      }

      for (const image of args.toCreate) {
        console.log({
          productId: args.productId,
          url: image.url,
          order: image.order,
          hidden: image.hidden,
          indexedDBId: image.indexedDBId,
        });
        await ctx.db.insert("images", {
          productId: args.productId,
          url: image.url,
          order: image.order,
          hidden: image.hidden,
          indexedDBId: image.indexedDBId,
        });
      }
      return { ok: true };
    } catch (e) {
      return { ok: false };
    }
  },
});
