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
    createdAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Fetch product costs
    const products = await Promise.all(
      args.order.map((item) => ctx.db.get(item.productId))
    );

    const saleId = await ctx.db.insert("sales", {
      order: args.order.map((item) => {
        const product = products.find((p) => p?._id === item.productId);
        return {
          ...item,
          cost: product?.cost,
        };
      }),
      subTotalCost: args.subTotalCost,
      createdAt: args.createdAt ?? Date.now(),
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
