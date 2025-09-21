import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { deleteVariants, deleteVariantsInventory, getVariants, getVariantsInventory, insertVariants, insertVariantsInventory } from "./actions/product_actions";
import { getUrl } from "./images";
import { Id } from "./_generated/dataModel";

export const listProduts = query({
  handler: async (ctx) => {
    const storeId = (await ctx.db.query("stores").first())?._id
    let products = await ctx.db.query("products").filter(e => e.eq(e.field('storeId'), storeId)).collect();
    const urls = new Map<Id<'_storage'>, string | undefined>()
    products.forEach(product => product?.images?.forEach(image => urls.set(image.storageId, undefined)))
    //const list = await Promise.all(Array.from(urls.keys()).map(async id => await ctx.storage.getUrl(id)))
    const list = await Promise.all(Array.from(urls.keys()).map(async id => urls.set(id, await ctx.storage.getUrl(id) ?? undefined)))
    console.log("list :", list)
    await Promise.all(products.forEach(async product => {
      if (product.images) {
        await Promise.all(product.images.map(async img => {
          const url = await ctx.storage.getUrl(img.storageId)
          urls.set(img.storageId, url ?? undefined)
        }))
      }
    }) ?? [])

    return products.map(product => {
      return { ...product, images: product?.images?.map(img => ({ ...img, url: urls.get(img.storageId) })) }
    })
  },
});

export const removeProduct = mutation({
  args: {
    id: v.id("products"),
  },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});

export const initiateProduct = mutation({
  handler: async (ctx) => {
    const store = await ctx.db.query("stores").first();
    if (store?._id) {
      return await ctx.db.insert("products", {
        storeId: store?._id,
        stockingStrategy: "by_variants",
        status: "incomplete",
      });
    }
    return null;
  },
});

export const updateProduct = mutation({
  args: {
    productId: v.id("products"),
    title: v.optional(v.string()),
    desc: v.optional(v.string()),
    price: v.optional(v.number()),
    discount: v.optional(v.number()),
    oldPrice: v.optional(v.number()),
    categoryId: v.optional(v.id("categories")),
    status: v.optional(
      v.union(v.literal("active"), v.literal("hidden"), v.literal("incomplete"))
    ),
    stockingStrategy: v.optional(
      v.union(
        v.literal("by_demand"),
        v.literal("by_variants"),
        v.literal("by_number")
      )
    ),
    images: v.optional(
      v.array(
        v.object({
          storageId: v.id("_storage"),
          url: v.optional(v.string()),
          order: v.number(),
          hidden: v.boolean(),
        })
      )
    ),
    quantity: v.optional(v.number()),
    variants: v.optional(
      v.array(
        v.object({
          _id: v.optional(v.id("variants")),
          _creationTime: v.optional(v.number()),
          productId: v.optional(v.id("products")),
          parentVariantId: v.optional(v.id("variants")),
          name: v.string(),
          order: v.number(),
          options: v.array(v.object({
            _id: v.optional(v.id("variantOptions")),
            _creationTime: v.optional(v.number()),
            variantId: v.optional(v.id("variants")),
            name: v.string(),
          })),
        })
      )
    ),
    variantsInventory: v.optional(v.any())
  },
  handler: async (ctx, args) => {
    console.log("update product args :", args)
    const { productId, variants, variantsInventory, ...updateData } = args;
    const cleanUpdateData = updateData
    await ctx.db.patch(productId, cleanUpdateData);

    if (variants && variants.length > 0) {
      deleteVariants(ctx, productId)
      insertVariants(ctx, variants, productId)
    }
    if (variantsInventory && variantsInventory.length > 0) {
      deleteVariantsInventory(ctx, productId)
      insertVariantsInventory(ctx, variantsInventory, productId)
    }
    return productId;
  },
});

export const getProductById = query({
  args: {
    id: v.id("products"),
  },
  handler: async (ctx, { id }) => {
    const product = await ctx.db.get(id);
    if (!product) return null

    const variants = await getVariants(ctx, product._id)
    const variantsInventory = await getVariantsInventory(ctx, product._id)

    return { ...product, variants, variantsInventory }
  },
});



export const addNewVariant = mutation({
  args: {
    productId: v.id('products'),
    name: v.string(),
    options: v.array(v.string())
  },
  handler: async (ctx, args) => {
    const prevVariants = await ctx.db.query("variants").filter(q => q.eq(q.field("productId"), args.productId)).collect()
    let lastVariant = prevVariants[0]
    for (let i = 1; i < prevVariants.length; i++) {
      if (prevVariants[i].order > lastVariant.order) lastVariant = prevVariants[i]
    }
    const newVariantId = await ctx.db.insert("variants", {
      parentVariantId: lastVariant._id ?? null,
      order: lastVariant.order ?? 1,
      name: args.name,
      productId: args.productId,
    })
    await Promise.all(args.options.map(async option => {
      await ctx.db.insert("variantOptions", {
        variantId: newVariantId,
        name: option,
      })
    }))
    return newVariantId
  }
})

export const sendImage = mutation({
  args: {
    storageId: v.id("_storage"),
    productId: v.id("products"),
    order: v.number(),
  },
  handler: async (ctx, args) => {
    const product = await ctx.db.get(args.productId);
    if (!product) {
      console.log("product doeesn't exist: ", args.productId, product);
      return null;
    }
    const images = product.images ?? [];
    images.push({
      storageId: args.storageId,
      hidden: false,
      order: args.order,
    });
    await ctx.db.patch(args.productId, { images: images });
    const url = await ctx.storage.getUrl(args.storageId);
    console.log("images attached succesffuly gonna return the url ", url);
    return url;
  },
});

