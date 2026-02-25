import { v } from "convex/values";
import { mutation } from "./_generated/server";

export const handleVariantChanges = mutation({
  args: {
    productId: v.id("products"),
    toDelete: v.array(v.id("variants")),
    toUpdate: v.array(
      v.object({
        variantId: v.id("variants"),
        name: v.string(),
        order: v.number(),
        options: v.array(
          v.object({
            order: v.number(),
            name: v.string(),
          }),
        ),
      }),
    ),
    toCreate: v.array(
      v.object({
        name: v.string(),
        order: v.number(),
        options: v.array(
          v.object({
            order: v.number(),
            name: v.string(),
          }),
        ),
      }),
    ),
  },
  handler: async (ctx, args) => {
    try {
      for (const variantId of args.toDelete) {
        const variantOptions = await ctx.db
          .query("variantOptions")
          .filter((q) => q.eq(q.field("variantId"), variantId))
          .collect();
        for (const option of variantOptions) {
          await ctx.db.delete(option._id);
        }
        await ctx.db.delete(variantId);
      }

      for (const update of args.toUpdate) {
        const { variantId, options } = update;
        await ctx.db.patch(variantId, {
          name: update.name,
          order: update.order,
        });

        const oldOptions = await ctx.db
          .query("variantOptions")
          .filter((q) => q.eq(q.field("variantId"), variantId))
          .collect();

        const oldOptionMap = new Map(oldOptions.map((o) => [o.name, o]));

        for (const option of options) {
          const existingOption = oldOptionMap.get(option.name);
          if (existingOption) {
            await ctx.db.patch(existingOption._id, {
              order: option.order,
            });
            oldOptionMap.delete(option.name);
          } else {
            await ctx.db.insert("variantOptions", {
              variantId,
              order: option.order,
              name: option.name,
            });
          }
        }

        for (const [, option] of oldOptionMap) {
          await ctx.db.delete(option._id);
        }
      }

      for (const variant of args.toCreate) {
        const newVariantId = await ctx.db.insert("variants", {
          productId: args.productId,
          name: variant.name,
          order: variant.order,
        });

        for (const option of variant.options) {
          await ctx.db.insert("variantOptions", {
            variantId: newVariantId,
            order: option.order,
            name: option.name,
          });
        }
      }

      const newestVariants = await ctx.db
        .query("variants")
        .filter((e) => e.eq(e.field("productId"), args.productId))
        .collect();
      const options = (await ctx.db.query('variantOptions').collect())
        .filter(opt => newestVariants.map(variant => variant._id).includes(opt.variantId))
      return { ok: true, options };
    } catch (e) {
      return { ok: false, options: [] };
    }
  },
});
