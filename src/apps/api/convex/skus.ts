import { v } from "convex/values";
import { authedMutation, authedQuery } from "./customFunctions";

export const listQuantities = authedQuery({
  resource: "skus",
  action: "read",
  args: { skuIds: v.array(v.id("skus")) },
  handler: async (ctx, { skuIds }) => {
    const results = await Promise.all(
      skuIds.map(async (skuId) => {
        const sku = await ctx.db.get(skuId);
        return { skuId, quantity: sku?.quantity ?? 0 };
      }),
    );
    return results;
  },
});

export const replace = authedMutation({
  resource: "skus",
  action: "update",
  args: {
    productId: v.id("products"),
    skus: v.array(
      v.object({
        quantity: v.number(),
        options: v.array(v.id("variantOptions")),
      }),
    ),
  },
  handler: async (ctx, args) => {
    try {
      const removeSKUsPromises = (
        await ctx.db
          .query("skus")
          .filter((q) => q.eq(q.field("productId"), args.productId))
          .collect()
      ).map((sku) => ctx.db.delete(sku._id));

      const insertSKUsPromises = args.skus.map((sku) =>
        ctx.db.insert("skus", {
          productId: args.productId,
          quantity: sku.quantity,
          options: sku.options,
        }),
      );

      await Promise.all([...insertSKUsPromises, ...removeSKUsPromises]);
      return { ok: true };
    } catch (e) {
      return { ok: false };
    }
  },
});
