import { mutation } from "./_generated/server";

export const backfillProductCosts = mutation({
  handler: async (ctx) => {
    const products = await ctx.db.query("products").collect();
    let updatedCount = 0;

    for (const product of products) {
      if (product.price && (product.cost === undefined || product.cost === 0)) {
        await ctx.db.patch(product._id, {
          cost: product.price * 0.7,
        });
        updatedCount++;
      }
    }

    return { updatedCount };
  },
});
