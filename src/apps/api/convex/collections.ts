import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const listCollections = query({
  args: {
    productId: v.optional(v.id('products'))
  },
  handler: async (ctx, args) => {
    if (args.productId) {
      let collections = await ctx.db.query('collections').collect()
      return collections.filter(c => {
        const ids = c?.productIds?.filter(id => id === args.productId)?.length
        if (ids && ids > 0)
          return true
        else
          return false
      })
    }
    else return undefined
  }
})

export const listAllCollections = query({
  handler: async (ctx) => {
    return await ctx.db.query('collections').collect()
  }
})

export const listSelectedCollectionsIds = query({
  args: {
    productId: v.optional(v.id('products'))
  },
  handler: async (ctx, args) => {
    if (args.productId) {
      let collections = await ctx.db.query('collections').collect()
      const ids = collections.filter(c => {
        const ids = c?.productIds?.filter(id => id === args.productId)?.length
        if (ids && ids > 0)
          return true
        else
          return false
      }).map(c => c._id)
      return ids;
    }
    else
      return;
  }
})

export const createCollection = mutation({
  args: {
    title: v.string(),
  },
  handler: async (ctx, args) => {
    const collections = await ctx.db.query('collections').collect()
    for (let c of collections) {
      if (c.title == args.title)
        return {
          ok: false,
          msg: "Collection already exists with this name."
        }
    }
    const id = await ctx.db.insert('collections', { title: args.title })
    return {
      ok: true,
      id
    }
  }
})


