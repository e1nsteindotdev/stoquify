import { defineSchema, defineTable } from "convex/server";
import { authTables } from "@convex-dev/auth/server";
import { v } from "convex/values";

const permissions = v.array(
  v.object({
    storeId: v.optional(v.id("stores")),
    resource: v.string(),
    action: v.union(v.literal("write"), v.literal("read"), v.literal("*")),
  }),
);

const schema = defineSchema({
  ...authTables,
  users: defineTable({
    lastUpdate: v.optional(v.number()),
    deleted: v.optional(v.boolean()),
    name: v.optional(v.string()),
    image: v.optional(v.string()),
    email: v.optional(v.string()),
    emailVerificationTime: v.optional(v.number()),
    phone: v.optional(v.string()),
    phoneVerificationTime: v.optional(v.number()),
    isAnonymous: v.optional(v.boolean()),
    organizationId: v.optional(v.id("organizations")),
    role: v.optional(
      v.union(v.literal("founder"), v.literal("admin"), v.literal("staff")),
    ),
    permissions: v.optional(permissions),
  })
    .index("email", ["email"])
    .index("phone", ["phone"])
    .index("by_organization", ["organizationId"]),

  // Organizations
  organizations: defineTable({
    lastUpdate: v.optional(v.number()),
    deleted: v.optional(v.boolean()),
    name: v.optional(v.string()),
    owner: v.optional(v.id("users")),
  }),

  // Stores
  stores: defineTable({
    lastUpdate: v.optional(v.number()),
    deleted: v.optional(v.boolean()),
    name: v.string(),
    organizationId: v.id("organizations"),
  })
    .index("by_organization", ["organizationId"])
    .index("by_name", ["name"]),

  // Magic links for invitations
  magicLinks: defineTable({
    lastUpdate: v.optional(v.number()),
    deleted: v.optional(v.boolean()),
    email: v.optional(v.string()),
    token: v.string(),
    role: v.union(v.literal("founder"), v.literal("admin"), v.literal("staff")),
    permissions,
    organizationId: v.id("organizations"),
    expiresAt: v.number(),
    usedAt: v.optional(v.number()),
  })
    .index("by_token", ["token"])
    .index("by_organization", ["organizationId"]),

  // Sign-in magic links for mobile QR code sign-in
  signInMagicLinks: defineTable({
    lastUpdate: v.optional(v.number()),
    deleted: v.optional(v.boolean()),
    userId: v.id("users"),
    token: v.string(),
    expiresAt: v.number(),
    usedAt: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index("by_token", ["token"])
    .index("by_user", ["userId"]),

  categories: defineTable({
    lastUpdate: v.optional(v.number()),
    deleted: v.optional(v.boolean()),
    name: v.string(),
    storeId: v.id("stores"),
  }).index("by_store", ["storeId"]),

  products: defineTable({
    lastUpdate: v.optional(v.number()),
    deleted: v.optional(v.boolean()),
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
    collections: v.optional(v.array(v.id("collections"))),
    images: v.optional(v.any()), // temp migration
  }).index("by_store", ["storeId"]),

  images: defineTable({
    lastUpdate: v.optional(v.number()),
    deleted: v.optional(v.boolean()),
    indexedDBId: v.optional(v.number()),
    productId: v.optional(v.id("products")),
    url: v.string(),
    order: v.number(),
    hidden: v.boolean(),
  }),

  variants: defineTable({
    lastUpdate: v.optional(v.number()),
    deleted: v.optional(v.boolean()),
    productId: v.id("products"),
    name: v.string(),
    order: v.number(),
    parentVariantId: v.optional(v.string()), // Temp migration field
  }).index("productId", ["productId", "order"]),

  variantOptions: defineTable({
    lastUpdate: v.optional(v.number()),
    deleted: v.optional(v.boolean()),
    variantId: v.id("variants"),
    order: v.optional(v.number()),
    name: v.string(),
  }),

  skus: defineTable({
    lastUpdate: v.optional(v.number()),
    deleted: v.optional(v.boolean()),
    productId: v.id("products"),
    quantity: v.number(),
    options: v.array(v.id("variantOptions")),
  }).index("productId", ["productId"]),

  collections: defineTable({
    lastUpdate: v.optional(v.number()),
    deleted: v.optional(v.boolean()),
    storeId: v.optional(v.id("stores")),
    title: v.string(),
    productIds: v.optional(v.array(v.id("products"))),
  }).index("by_store", ["storeId"]),

  wilayat: defineTable({
    lastUpdate: v.optional(v.number()),
    deleted: v.optional(v.boolean()),
    name: v.string(),
    htmlName: v.string(),
    deliveryCost: v.number(),
  }),

  customers: defineTable({
    lastUpdate: v.optional(v.number()),
    deleted: v.optional(v.boolean()),
    storeId: v.optional(v.id("stores")),
    firstName: v.string(),
    lastName: v.string(),
    phoneNumber: v.number(),
    latestAddressId: v.optional(v.id("addresses")),
    lastestAdressId: v.optional(v.string()), // Temporary migration field
  })
    .index("by_store", ["storeId"])
    .index("by_phone", ["phoneNumber"]),

  addresses: defineTable({
    lastUpdate: v.optional(v.number()),
    deleted: v.optional(v.boolean()),
    wilayaId: v.id("wilayat"),
    address: v.string(),
  }),

  sales: defineTable({
    lastUpdate: v.optional(v.number()),
    deleted: v.optional(v.boolean()),
    storeId: v.id("stores"),
    createdAt: v.number(),
    source: v.union(v.literal("online"), v.literal("in_store")),
    status: v.union(
      v.literal("pending"),
      v.literal("confirmed"),
      v.literal("denied"),
    ),
    shippingStatus: v.optional(
      v.union(
        v.literal("pending"),
        v.literal("prepared"),
        v.literal("shipped"),
        v.literal("delivered"),
        v.literal("returned"),
      ),
    ),
    customerId: v.optional(v.id("customers")),
    addressId: v.optional(v.id("addresses")),
    shipmentProvider: v.optional(v.string()),
    trackingNumber: v.optional(v.string()),
    shipmentNotes: v.optional(v.string()),
    subTotalCost: v.number(),
    deliveryCost: v.number(),
  })
    .index("by_store_createdAt", ["storeId", "createdAt"])
    .index("by_store_status", ["storeId", "status"])
    .index("by_store_source", ["storeId", "source"])
    .index("by_customer", ["customerId"]),

  saleItems: defineTable({
    lastUpdate: v.optional(v.number()),
    deleted: v.optional(v.boolean()),
    saleId: v.id("sales"),
    storeId: v.id("stores"),
    createdAt: v.number(),
    quantity: v.number(),
    productId: v.id("products"),
    skuId: v.id("skus"),
    price: v.number(),
    cost: v.optional(v.number()),
  })
    .index("by_sale", ["saleId"])
    .index("by_store_createdAt", ["storeId", "createdAt"])
    .index("by_product", ["productId"])
    .index("by_store_product_createdAt", ["storeId", "productId", "createdAt"]),

  faqs: defineTable({
    lastUpdate: v.optional(v.number()),
    deleted: v.optional(v.boolean()),
    question: v.string(),
    answer: v.string(),
    order: v.number(),
  }),

  settings: defineTable({
    lastUpdate: v.optional(v.number()),
    deleted: v.optional(v.boolean()),
    storeId: v.id("stores"),
    locationLink: v.optional(v.string()),
    instagramLink: v.optional(v.string()),
    facebookLink: v.optional(v.string()),
    tiktokLink: v.optional(v.string()),
  }).index("by_store", ["storeId"]),

  expenseCategories: defineTable({
    lastUpdate: v.optional(v.number()),
    deleted: v.optional(v.boolean()),
    name: v.string(),
    storeId: v.id("stores"),
  }).index("by_store", ["storeId"]),

  expenses: defineTable({
    lastUpdate: v.optional(v.number()),
    deleted: v.optional(v.boolean()),
    storeId: v.id("stores"),
    title: v.string(),
    description: v.optional(v.string()),
    cost: v.number(),
    date: v.number(),
    categoryId: v.optional(v.id("expenseCategories")),
  })
    .index("by_store", ["storeId"])
    .index("by_store_date", ["storeId", "date"])
    .index("by_category", ["categoryId"]),
});

export default schema;
