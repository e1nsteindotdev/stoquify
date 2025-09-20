import { defineSchema, defineTable } from "convex/server";
import { authTables } from "@convex-dev/auth/server";
import { v } from "convex/values";

const schema = defineSchema({
  ...authTables,
  users: defineTable({
    email: v.optional(v.string()),
    organizationId: v.optional(v.id("organizations")),
  }),

  stores: defineTable({
    name: v.string(),
    organizationId: v.id("organizations"),
  }),

  organizations: defineTable({
    name: v.string(),
    owner: v.optional(v.id("users")),
  }),

  categories: defineTable({
    name: v.string(),
    storeId: v.id("stores"),
  }).index("by_store", ["storeId"]),

  products: defineTable({
    storeId: v.id("stores"),
    title: v.optional(v.string()),
    desc: v.optional(v.string()),
    categoryId: v.optional(v.id("categories")),
    price: v.optional(v.number()),
    status: v.union(
      v.literal("active"),
      v.literal("hidden"),
      v.literal("incomplete")
    ),
    discount: v.optional(v.number()),
    oldPrice: v.optional(v.number()),
    stockingStrategy: v.union(
      v.literal("by_demand"),
      v.literal("by_variants"),
      v.literal("by_number")
    ),
    quantity: v.optional(v.number()),
    images: v.optional(v.array(
      v.object({
        storageId: v.id('_storage'),
        url: v.optional(v.string()),
        order: v.number(),
        hidden: v.boolean(),
      })
    )),
  }).index("by_store", ["storeId"]),

  variants: defineTable({
    productId: v.id("products"),
    parentVariantId: v.optional(v.id("variants")),
    name: v.string(),
    order: v.number(),
  }).index("by_productId", ["productId"]),

  variantOptions: defineTable({
    name: v.string(),
    variantId: v.id("variants"),
  }).index("by_variantId", ['variantId']),

  variantsInventory: defineTable({
    productId: v.id('products'),
    path: v.array(v.string()),
    quantity: v.number()
  }).index("by_productId", ["productId"])
});

export default schema;
