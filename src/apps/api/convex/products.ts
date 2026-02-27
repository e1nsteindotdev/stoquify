import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import {
  insertVariants,
  insertVariantsInventory,
} from "./actions/product_actions";
import { authedMutation } from "./customeFunction";

export const listProducts = query({
  args: {
    storeId: v.id("stores"),
  },
  handler: async (ctx, { storeId }) => {
    let products = await ctx.db
      .query("products")
      .filter((e) => e.eq(e.field("storeId"), storeId))
      .collect();

    const images = await ctx.db.query("images").collect();
    const variants = await ctx.db.query("variants").collect();
    const variantOptions = await ctx.db.query("variantOptions").collect();
    const skus = await ctx.db.query("skus").collect();

    const collections = await ctx.db
      .query("collections")
      .filter((e) => e.eq(e.field("storeId"), storeId))
      .collect();

    return products.map((product) => {
      return {
        ...product,
        images: images
          .filter((img) => img.productId === product._id)
          .sort((a, b) => a.order - b.order),
        skus: skus
          .filter((sku) => sku.productId === product._id)
          .map((sku) => ({
            ...sku,
            options: variantOptions.filter((option) =>
              sku.options.includes(option._id),
            ),
          })),
        variants: variants
          .filter((v) => v.productId === product._id)
          .map((variant) => {
            const options = variantOptions.filter(
              (option) => option.variantId === variant._id,
            );
            return {
              ...variant,
              options,
            };
          }),
        collections: product.collections
          .map((id) => collections.find((col) => col._id == id))
          .filter((col): col is NonNullable<typeof col> => col != null),
      };
    });
  },
});

export const getCatalog = query({
  args: {
    storeId: v.id("stores"),
  },
  handler: async (ctx, { storeId }) => {
    let products = await ctx.db
      .query("products")
      .filter((e) => e.eq(e.field("storeId"), storeId))
      .collect();

    const images = await ctx.db.query("images").collect();
    const variants = await ctx.db.query("variants").collect();
    const variantOptions = await ctx.db.query("variantOptions").collect();
    const skus = await ctx.db.query("skus").collect();
    const categories = await ctx.db
      .query("categories")
      .filter((e) => e.eq(e.field("storeId"), storeId))
      .collect();
    const collections = await ctx.db
      .query("collections")
      .filter((e) => e.eq(e.field("storeId"), storeId))
      .collect();

    const activeProducts = products.filter((p) => p.status === "active");

    const activeCategoryIds = new Set(
      activeProducts.map((p) => p.categoryId).filter((id) => id !== undefined),
    );
    const activeCollectionIds = new Set(
      activeProducts.flatMap((p) => p.collections ?? []),
    );

    const data = {
      products: activeProducts.map((product) => ({
        ...product,
        images: images
          .filter((img) => img.productId === product._id)
          .sort((a, b) => a.order - b.order),
        skus: skus
          .filter((sku) => sku.productId === product._id)
          .map((sku) => ({
            ...sku,
            options: variantOptions.filter((option) =>
              sku.options.includes(option._id),
            ),
          })),
        variants: variants
          .filter((v) => v.productId === product._id)
          .map((variant) => {
            const options = variantOptions.filter(
              (option) => option.variantId === variant._id,
            );
            return {
              ...variant,
              options,
            };
          }),
      })),
      categories: categories.filter((c) => activeCategoryIds.has(c._id)),
      collections: collections.filter((c) => activeCollectionIds.has(c._id)),
    };
    console.log("returning cataglog data :", data);

    return data;
  },
});

export const getProductById = query({
  args: { id: v.id("products") },
  handler: async (ctx, { id }) => {
    const product = await ctx.db.get(id);
    if (!product) return null;

    const images = await ctx.db
      .query("images")
      .filter((e) => e.eq(e.field("productId"), id))
      .collect();
    const variants = await ctx.db
      .query("variants")
      .filter((e) => e.eq(e.field("productId"), id))
      .collect();

    const variantOptions = await ctx.db.query("variantOptions").collect();

    const skus = await ctx.db
      .query("skus")
      .filter((e) => e.eq(e.field("productId"), id))
      .collect();

    return {
      ...product,
      variants: variants.map((variant) => ({
        ...variant,
        options: variantOptions.filter(
          (option) => option.variantId === variant._id,
        ),
      })),
      skus: skus.map((sku) => {
        return {
          ...sku,
          options: variantOptions.filter((option) =>
            sku.options.includes(option._id),
          ),
        };
      }),
      images: images.sort((a, b) => a.order - b.order),
    };
  },
});

export const deleteProduct = mutation({
  args: {
    id: v.id("products"),
  },
  handler: async (ctx, { id }) => {
    await ctx.db.delete(id);

    // loop through variants, variantOptions, skus, images that are attached to this product and remove them too.
    const images = await ctx.db
      .query("images")
      .filter((e) => e.eq(e.field("productId"), id))
      .collect();

    const variants = await ctx.db
      .query("variants")
      .filter((e) => e.eq(e.field("productId"), id))
      .collect();

    const variantOptions = await ctx.db.query("variantOptions").collect();

    const skus = await ctx.db
      .query("skus")
      .filter((e) => e.eq(e.field("productId"), id))
      .collect();

    for (const image of images) {
      await ctx.db.delete(image._id);
    }

    for (const sku of skus) {
      await ctx.db.delete(sku._id);
    }

    for (const variant of variants) {
      const relatedOptions = variantOptions.filter(
        (option) => option.variantId === variant._id,
      );
      for (const option of relatedOptions) {
        await ctx.db.delete(option._id);
      }
      await ctx.db.delete(variant._id);
    }
  },
});

export const sendImage = mutation({
  args: {
    storageId: v.id("_storage"),
    productId: v.id("products"),
    order: v.number(),
    indexedDBId: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const product = await ctx.db.get(args.productId);
    if (!product) {
      console.log("product doeesn't exist: ", args.productId, product);
      return null;
    }
    const url = await ctx.storage.getUrl(args.storageId);
    if (!url) {
      console.log("failed to get url for storageId: ", args.storageId);
      return null;
    }
    await ctx.db.insert("images", {
      productId: args.productId,
      url: args.storageId,
      order: args.order,
      hidden: false,
      indexedDBId: args.indexedDBId,
    });
    console.log("images attached succesffuly gonna return the url ", url);
    return url;
  },
});

export const getProductByCategory = query({
  args: {
    categoryId: v.id("categories"),
  },
  handler: async (ctx, { categoryId }) => {
    return await ctx.db
      .query("products")
      .filter((q) => q.eq(q.field("categoryId"), categoryId))
      .collect();
  },
});

export const createProduct = authedMutation({
  args: {
    storeId: v.id("stores"),
    title: v.optional(v.string()),
    desc: v.optional(v.string()),
    price: v.optional(v.number()),
    cost: v.optional(v.number()),
    discount: v.optional(v.number()),
    oldPrice: v.optional(v.number()),
    categoryId: v.optional(v.id("categories")),
    status: v.optional(
      v.union(
        v.literal("active"),
        v.literal("hidden"),
        v.literal("incomplete"),
      ),
    ),
    stockingStrategy: v.optional(
      v.union(
        v.literal("by_demand"),
        v.literal("by_variants"),
        v.literal("by_number"),
      ),
    ),
    images: v.optional(
      v.array(
        v.object({
          storageId: v.id("_storage"),
          url: v.optional(v.string()),
          order: v.number(),
          hidden: v.boolean(),
        }),
      ),
    ),
    quantity: v.optional(v.number()),
    variants: v.optional(
      v.array(
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
      ),
    ),
    collections: v.array(v.id("collections")),
    variantsInventory: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    try {
      const {
        variants,
        variantsInventory,
        collections,
        images,
        status,
        stockingStrategy,
        ...productData
      } = args;

      const productId = await ctx.db.insert("products", {
        status: status ?? "incomplete",
        stockingStrategy: stockingStrategy ?? "by_variants",
        collections,
        ...productData,
        storeId: args.storeId,
      });

      if (images && images.length > 0) {
        for (const img of images) {
          await ctx.db.insert("images", {
            productId,
            url: img.storageId,
            order: img.order,
            hidden: img.hidden,
          });
        }
      }

      if (variants && variants.length > 0) {
        insertVariants(ctx, variants, productId);
      }
      if (variantsInventory && variantsInventory.length > 0) {
        insertVariantsInventory(ctx, variantsInventory, productId);
      }

      if (collections && collections.length > 0) {
        for (const collectionId of collections) {
          const collection = await ctx.db.get(collectionId);
          if (collection) {
            await ctx.db.patch(collectionId, {
              productIds: [...(collection.productIds ?? []), productId],
            });
          }
        }
      }
      return { ok: true, productId };
    } catch (e) {
      return { ok: false };
    }
  },
});

export const updateProductMetaData = mutation({
  args: {
    productId: v.id("products"),
    title: v.optional(v.string()),
    desc: v.optional(v.string()),
    price: v.optional(v.number()),
    cost: v.optional(v.number()),
    discount: v.optional(v.number()),
    oldPrice: v.optional(v.number()),
    categoryId: v.optional(v.id("categories")),
    status: v.optional(
      v.union(
        v.literal("active"),
        v.literal("hidden"),
        v.literal("incomplete"),
      ),
    ),
    stockingStrategy: v.optional(
      v.union(
        v.literal("by_demand"),
        v.literal("by_variants"),
        v.literal("by_number"),
      ),
    ),
    quantity: v.optional(v.number()),
    collections: v.optional(v.array(v.id("collections"))),
  },
  handler: async (ctx, args) => {
    try {
      const { productId, status, stockingStrategy, ...updateData } = args;

      const cleanData: Record<string, unknown> = {};
      for (const [key, value] of Object.entries({
        ...updateData,
        status,
        stockingStrategy,
      })) {
        if (value !== undefined && value !== null) {
          cleanData[key] = value;
        }
      }
      await ctx.db.patch(productId, cleanData);

      return { ok: true };
    } catch (e) {
      return { ok: false };
    }
  },
});
