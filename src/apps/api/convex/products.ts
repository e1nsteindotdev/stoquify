import { v } from "convex/values";
import { internalQuery, query } from "./_generated/server";
import {
  insertVariants,
  insertVariantsInventory,
} from "./actions/product_actions";
import { authedMutation, authedQuery } from "./customFunctions";

export const list = authedQuery({
  resource: "products",
  action: "read",
  args: {
    storeId: v.id("stores"),
  },
  handler: async (ctx, { storeId }) => {
    const products = await ctx.db
      .query("products")
      .withIndex("by_store", (q) => q.eq("storeId", storeId))
      .collect();

    const collections = await ctx.db
      .query("collections")
      .withIndex("by_store", (q) => q.eq("storeId", storeId))
      .collect();

    const categories = await ctx.db
      .query("categories")
      .withIndex("by_store", (q) => q.eq("storeId", storeId))
      .collect();

    return await Promise.all(
      products.map(async (product) => {
        const images = await ctx.db
          .query("images")
          .filter((q) => q.eq(q.field("productId"), product._id))
          .collect();

        const variants = await ctx.db
          .query("variants")
          .withIndex("productId", (q) => q.eq("productId", product._id))
          .collect();

        const skus = await ctx.db
          .query("skus")
          .withIndex("productId", (q) => q.eq("productId", product._id))
          .collect();

        const variantsWithOptions = await Promise.all(
          variants.map(async (variant) => {
            const options = await ctx.db
              .query("variantOptions")
              .filter((q) => q.eq(q.field("variantId"), variant._id))
              .collect();
            return { ...variant, options };
          }),
        );

        const skusWithOptions = await Promise.all(
          skus.map(async (sku) => {
            const options = await Promise.all(
              sku.options.map((optId) => ctx.db.get(optId)),
            );
            return {
              ...sku,
              options: options.filter(
                (o): o is NonNullable<typeof o> => o !== null,
              ),
            };
          }),
        );

        return {
          ...product,
          category: categories.find((c) => c._id === product.categoryId),
          images: images.sort((a, b) => a.order - b.order),
          skus: skusWithOptions,
          variants: variantsWithOptions,
          collections: (product.collections || [])
            .map((id) => collections.find((col) => col._id == id))
            .filter((col): col is NonNullable<typeof col> => col != null),
        };
      }),
    );
  },
});

export const catalog = query({
  args: {
    storeId: v.id("stores"),
  },
  handler: async (ctx, { storeId }) => {
    const products = await ctx.db
      .query("products")
      .withIndex("by_store", (q) => q.eq("storeId", storeId))
      .collect();

    const activeProducts = products.filter((p) => p.status === "active");

    const categories = await ctx.db
      .query("categories")
      .withIndex("by_store", (q) => q.eq("storeId", storeId))
      .collect();
    const collections = await ctx.db
      .query("collections")
      .withIndex("by_store", (q) => q.eq("storeId", storeId))
      .collect();

    const activeCategoryIds = new Set(
      activeProducts.map((p) => p.categoryId).filter((id) => id !== undefined),
    );
    const activeCollectionIds = new Set(
      activeProducts.flatMap((p) => p.collections ?? []),
    );

    const settings = await ctx.db
      .query("settings")
      .withIndex("by_store", (q) => q.eq("storeId", storeId))
      .first();

    const faqs = await ctx.db.query("faqs").collect();
    const wilayat = await ctx.db.query("wilayat").collect();

    const resolvedProducts = await Promise.all(
      activeProducts.map(async (product) => {
        const images = await ctx.db
          .query("images")
          .filter((q) => q.eq(q.field("productId"), product._id))
          .collect();

        const variants = await ctx.db
          .query("variants")
          .withIndex("productId", (q) => q.eq("productId", product._id))
          .collect();

        const skus = await ctx.db
          .query("skus")
          .withIndex("productId", (q) => q.eq("productId", product._id))
          .collect();

        const variantsWithOptions = await Promise.all(
          variants.map(async (variant) => {
            const options = await ctx.db
              .query("variantOptions")
              .filter((q) => q.eq(q.field("variantId"), variant._id))
              .collect();
            return { ...variant, options };
          }),
        );

        const skusWithOptions = await Promise.all(
          skus.map(async (sku) => {
            const options = await Promise.all(
              sku.options.map((optId) => ctx.db.get(optId)),
            );
            return {
              ...sku,
              options: options.filter(
                (o): o is NonNullable<typeof o> => o !== null,
              ),
            };
          }),
        );

        return {
          ...product,
          images: images.sort((a, b) => a.order - b.order),
          skus: skusWithOptions,
          variants: variantsWithOptions,
        };
      }),
    );

    const data = {
      products: resolvedProducts,
      categories: categories.filter((c) => activeCategoryIds.has(c._id)),
      collections: collections.filter((c) => activeCollectionIds.has(c._id)),
      settings: settings || null,
      faqs: faqs.sort((a, b) => a.order - b.order),
      wilayat: wilayat,
    };

    return data;
  },
});

export const get = authedQuery({
  resource: "products",
  action: "read",
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

export const remove = authedMutation({
  resource: "products",
  action: "delete",
  args: {
    id: v.id("products"),
  },
  handler: async (ctx, { id }) => {
    await ctx.db.delete(id);

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

export const attachImage = authedMutation({
  resource: "products",
  action: "update",
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

export const listByCategory = authedQuery({
  resource: "products",
  action: "read",
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

export const insert = authedMutation({
  resource: "products",
  action: "create",
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

export const update = authedMutation({
  resource: "products",
  action: "update",
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

export const stats = internalQuery({
  handler: async (ctx) => {
    const products = await ctx.db.query("products").collect();
    const productIds = products.map((p) => p._id);
    const saleItems = await ctx.db.query("saleItems").collect();
    const salesMap = new Map();
    for (const productId of productIds) {
      const saleIds = new Set(
        saleItems
          .filter((item) => item.productId === productId)
          .map((item) => item.saleId),
      );
      salesMap.set(productId, {
        name: products.find((p) => p._id === productId)?.title,
        size: saleIds.size,
      });
    }
    console.log(salesMap);
    return null;
  },
});
