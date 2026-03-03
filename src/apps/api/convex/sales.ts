import { v } from "convex/values";
import { authedMutation, authedQuery } from "./customeFunction";

export const createSale = authedMutation({
  resource: "sales",
  action: "create",
  args: {
    order: v.array(
      v.object({
        quantity: v.number(),
        productId: v.id("products"),
        skuId: v.id("skus"),
        price: v.number(),
      }),
    ),
    subTotalCost: v.number(),
  },
  handler: async (ctx, args) => {
    const products = await Promise.all(
      args.order.map((item) => ctx.db.get(item.productId)),
    );

    const saleId = await ctx.db.insert("sales", {
      saleTime: new Date().toISOString(),
      order: args.order.map((item) => {
        const product = products.find((p) => p?._id === item.productId);
        return {
          quantity: item.quantity,
          productId: item.productId,
          skuId: item.skuId,
          price: item.price,
          cost: product?.cost,
        };
      }),
      subTotalCost: args.subTotalCost,
    });
    return saleId;
  },
});

export const listSales = authedQuery({
  resource: "sales",
  action: "read",
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("sales").order("desc").collect();
  },
});
