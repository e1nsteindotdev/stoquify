import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const placeOrder = mutation({
  args: v.object({
    order: v.array(
      v.object({
        customerId: v.id('customers'),
        orderContent: v.array(
          v.object({
            quantity: v.number(),
            productId: v.id('products'),
            price: v.number(),
            selection: v.array(v.object({
              variantId: v.id('variants'),
              variantOptionId: v.id('variantOptions'),
            })),
          })
        ),
        address: v.id('addresses'),
      }))
  }),
  handler: async (ctx, args) => {
    return null
  }
})


export const getWilayat = query({
  handler: async (ctx) => {
    return await ctx.db.query('wilayat').collect()
  }
})
