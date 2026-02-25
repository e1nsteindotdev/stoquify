import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const generateUploadUrl = mutation({
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl();
  },
});

export const getUrl = query({
  args: {
    storageId: v.id("_storage"),
  },
  handler: async (ctx, args) => {
    return await ctx.storage.getUrl(args.storageId);
  },
});

export const createImage = mutation({
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

export const updateImage = mutation({
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

export const deleteImage = mutation({
  args: {
    imageId: v.id("images"),
  },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.imageId);
  },
});

export const handleImageChanges = mutation({
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
          indexedDBId: image.indexedDBId
        })
        await ctx.db.insert("images", {
          productId: args.productId,
          url: image.url,
          order: image.order,
          hidden: image.hidden,
          indexedDBId: image.indexedDBId,
        });
      }
      return { ok: true }
    } catch (e) {
      return { ok: false }
    }
  },
});
