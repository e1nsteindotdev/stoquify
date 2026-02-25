"use node";
import { v, type Infer } from "convex/values";
import { type Id } from "../_generated/dataModel";
import { type MutationCtx, type QueryCtx } from "../_generated/server";

const convextVariantType = v.array(
  v.object({
    _id: v.optional(v.id("variants")),
    _creationTime: v.optional(v.number()),
    productId: v.optional(v.id("products")),
    name: v.string(),
    order: v.number(),
    options: v.array(
      v.object({
        _id: v.optional(v.id("variantOptions")),
        _creationTime: v.optional(v.number()),
        variantId: v.optional(v.id("variants")),
        optionName: v.string(),
      }),
    ),
  }),
);

type TVariant = Infer<typeof convextVariantType>;

const convextVariantInventoryType = v.array(
  v.object({
    _id: v.optional(v.id("skus")),
    _creationTime: v.optional(v.number()),
    productId: v.optional(v.id("products")),
    quantity: v.number(),
    options: v.array(
      v.object({
        order: v.number(),
        variantId: v.id("variants"),
        optionId: v.id("variantOptions"),
      }),
    ),
  }),
);

type TVariantInventory = Infer<typeof convextVariantInventoryType>;

export function generateVariantsInventoryFingerPrint(
  path: Array<string | undefined>,
  ctx: QueryCtx,
) {
  let fp = "";
  path.forEach((n) => {
    if (n) {
      if (n != "") fp.concat("-");
      fp.concat(n);
    }
  });
  return fp;
}
export async function getVariants(ctx: QueryCtx, id: Id<"products">) {
  const variants = await ctx.db
    .query("variants")
    .filter((q) => q.eq(q.field("productId"), id))
    .collect();

  return await Promise.all(
    variants.map(async (v) => {
      const options = await ctx.db
        .query("variantOptions")
        .filter((q) => q.eq(q.field("variantId"), v._id))
        .collect();
      return { ...v, options };
    }),
  );
}

export async function getVariantsInventory(
  ctx: QueryCtx,
  productId: Id<"products">,
) {
  const data = await ctx.db
    .query("skus")
    .filter((q) => q.eq(q.field("productId"), productId))
    .collect();
  return data;
}

export async function deleteVariants(
  ctx: MutationCtx,
  productId: Id<"products">,
) {
  const pastVariants = await ctx.db
    .query("variants")
    .filter((q) => q.eq(q.field("productId"), productId))
    .collect();

  const pastOptions = await Promise.all(
    pastVariants.map(
      async (v) =>
        await ctx.db
          .query("variantOptions")
          .filter((q) => q.eq(q.field("variantId"), v._id))
          .collect(),
    ),
  );

  await Promise.all(pastVariants.map(async (v) => await ctx.db.delete(v._id)));
  await Promise.all(
    pastOptions.map(async (oList) =>
      oList.map(async (o) => await ctx.db.delete(o._id)),
    ),
  );
}

export async function deleteVariantsInventory(
  ctx: MutationCtx,
  productId: Id<"products">,
) {
  const pastVariantsInventory = await ctx.db
    .query("skus")
    .filter((q) => q.eq(q.field("productId"), productId))
    .collect();

  await Promise.all(
    pastVariantsInventory.map(async (v) => await ctx.db.delete(v._id)),
  );
}

export async function insertVariants(
  ctx: MutationCtx,
  variants: TVariant,
  productId: Id<"products">,
) {
  variants = variants.sort((a, b) => a.order - b.order);
  for (let v of variants) {
    const optionNames = v.options.map((o) => o.optionName);
    const newVariantId: Id<"variants"> = await ctx.db.insert("variants", {
      productId: productId,
      name: v.name,
      order: v.order,
      options: optionNames,
    });

    await Promise.all(
      v.options.map((o) =>
        ctx.db.insert("variantOptions", {
          optionName: o.optionName,
          variantId: newVariantId,
        }),
      ),
    );
  }
}

export async function insertVariantsInventory(
  ctx: MutationCtx,
  variantsInventory: TVariantInventory,
  productId: Id<"products">,
) {
  for (let v of variantsInventory) {
    await ctx.db.insert("skus", {
      productId: productId,
      quantity: v.quantity ?? 0,
      options: v.options,
    });
  }
}
