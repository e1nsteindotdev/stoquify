import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const createSale = mutation({
  args: {
    order: v.array(
      v.object({
        quantity: v.number(),
        productId: v.id("products"),
        price: v.number(),
        selection: v.array(
          v.object({
            variantId: v.id("variants"),
            variantOptionId: v.id("variantOptions"),
          })
        ),
      })
    ),
    subTotalCost: v.number(),
  },
  handler: async (ctx, args) => {
    const saleId = await ctx.db.insert("sales", {
      order: args.order,
      subTotalCost: args.subTotalCost,
      createdAt: Date.now(),
    });
    return saleId;
  },
});

export const listSales = query({
  handler: async (ctx) => {
    return await ctx.db
      .query("sales")
      .withIndex("by_createdAt")
      .order("desc")
      .collect();
  },
});
