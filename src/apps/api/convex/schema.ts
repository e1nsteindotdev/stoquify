import { defineSchema, defineTable } from "convex/server";
import { authTables } from "@convex-dev/auth/server";
import { v } from "convex/values";

const permissions = v.array(
  v.object({
    storeId: v.id("stores"),
    resource: v.string(),
    action: v.union(
      v.literal("write"),
      v.literal("read"),
      v.literal("update"),
      v.literal("delete"),
      v.literal("create"),
      v.literal("*"),
    ),
  }),
);

const schema = defineSchema({
  ...authTables,
  users: defineTable({
    name: v.string(),
    image: v.optional(v.string()),
    email: v.optional(v.string()),
    emailVerificationTime: v.optional(v.number()),
    phone: v.string(),
    phoneVerificationTime: v.optional(v.number()),
    isAnonymous: v.optional(v.boolean()),
    organizationId: v.id("organizations"),
    role: v.union(v.literal("founder"), v.literal("admin"), v.literal("staff")),
    permissions,
  })
    .index("email", ["email"])
    .index("by_organization", ["organizationId"]),

  // Organizations
  organizations: defineTable({
    name: v.string(),
    owner: v.optional(v.id("users")),
  }),

  // Stores
  stores: defineTable({
    name: v.string(),
    organizationId: v.id("organizations"),
  }).index("by_organization", ["organizationId"]),

  // Magic links for invitations
  magicLinks: defineTable({
    email: v.string(),
    token: v.string(),
    role: v.union(v.literal("admin"), v.literal("staff")),
    permissions,
    organizationId: v.id("organizations"),
    storeId: v.id("stores"),
    expiresAt: v.number(),
    usedAt: v.optional(v.number()),
  })
    .index("by_token", ["token"])
    .index("by_email", ["email"]),

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
    cost: v.optional(v.number()),
    status: v.union(
      v.literal("active"),
      v.literal("hidden"),
      v.literal("incomplete"),
    ),
    discount: v.optional(v.number()),
    oldPrice: v.optional(v.number()),
    stockingStrategy: v.union(
      v.literal("by_demand"),
      v.literal("by_variants"),
      v.literal("by_number"),
    ),
    quantity: v.optional(v.number()),
    collections: v.array(v.id("collections")),
  }).index("by_store", ["storeId"]),

  images: defineTable({
    indexedDBId: v.optional(v.number()),
    productId: v.optional(v.id("products")),
    url: v.string(),
    order: v.number(),
    hidden: v.boolean(),
  }),

  variants: defineTable({
    productId: v.id("products"),
    name: v.string(),
    order: v.number(),
  }).index("productId", ["productId", "order"]),

  variantOptions: defineTable({
    variantId: v.id("variants"),
    order: v.number(),
    name: v.string(),
  }),

  skus: defineTable({
    productId: v.id("products"),
    quantity: v.number(),
    options: v.array(v.id("variantOptions")),
  }).index("productId", ["productId"]),

  collections: defineTable({
    storeId: v.id("stores"),
    title: v.string(),
    productIds: v.optional(v.array(v.id("products"))),
  }).index("by_store", ["storeId"]),

  wilayat: defineTable({
    name: v.string(),
    htmlName: v.string(),
    deliveryCost: v.number(),
  }),

  customers: defineTable({
    firstName: v.string(),
    lastName: v.string(),
    phoneNumber: v.number(),
    lastestAdressId: v.id("addresses"),
  }).index("by_phone", ["phoneNumber"]),

  addresses: defineTable({
    wilayaId: v.id("wilayat"),
    address: v.string(),
  }),

  orders: defineTable({
    customerId: v.id("customers"),
    order: v.array(
      v.object({
        quantity: v.number(),
        productId: v.id("products"),
        price: v.number(),
        cost: v.optional(v.number()),
        selection: v.array(
          v.object({
            variantId: v.id("variants"),
            variantOptionId: v.id("variantOptions"),
          }),
        ),
      }),
    ),
    addressId: v.id("addresses"),
    deliveryCost: v.number(),
    subTotalCost: v.number(),
    status: v.union(
      v.literal("pending"),
      v.literal("confirmed"),
      v.literal("denied"),
    ),
  }).index("by_customer", ["customerId"]),

  sales: defineTable({
    order: v.array(
      v.object({
        quantity: v.number(),
        productId: v.id("products"),
        price: v.number(),
        cost: v.optional(v.number()),
        selection: v.array(
          v.object({
            variantId: v.id("variants"),
            variantOptionId: v.id("variantOptions"),
          }),
        ),
      }),
    ),
    subTotalCost: v.number(),
  }),

  faqs: defineTable({
    question: v.string(),
    answer: v.string(),
    order: v.number(),
  }),

  settings: defineTable({
    storeId: v.id("stores"),
    locationLink: v.optional(v.string()),
    instagramLink: v.optional(v.string()),
    facebookLink: v.optional(v.string()),
    tiktokLink: v.optional(v.string()),
  }).index("by_store", ["storeId"]),
});

export default schema;
