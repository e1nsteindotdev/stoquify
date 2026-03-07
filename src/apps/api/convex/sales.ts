import { v } from "convex/values";
import { authedMutation, authedQuery } from "./customFunctions";
import { mutation, query } from "./_generated/server";

async function getSaleItemsWithDetails(ctx: any, saleId: any) {
  const items = await ctx.db
    .query("saleItems")
    .withIndex("by_sale", (q: any) => q.eq("saleId", saleId))
    .collect();

  return await Promise.all(
    items.map(async (item: any) => {
      const product = await ctx.db.get(item.productId);
      const sku = await ctx.db.get(item.skuId);
      const variantOptions = sku
        ? await Promise.all(
            sku.options.map(async (optId: any) => {
              return await ctx.db.get(optId);
            }),
          )
        : [];

      return {
        ...item,
        product,
        sku,
        variantOptions: variantOptions.filter(Boolean),
      };
    }),
  );
}

const saleItemSchema = v.object({
  quantity: v.number(),
  productId: v.id("products"),
  skuId: v.id("skus"),
  price: v.number(),
  cost: v.optional(v.number()),
});

export const insert = mutation({
  args: v.object({
    source: v.union(v.literal("online"), v.literal("in_store")),
    order: v.array(saleItemSchema),
    address: v.optional(v.string()),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    phoneNumber: v.optional(v.number()),
    wilaya: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    if (args.source === "online") {
      if (
        !args.address ||
        !args.firstName ||
        !args.lastName ||
        !args.phoneNumber ||
        !args.wilaya
      ) {
        throw new Error("online sales require customer and shipping fields");
      }
    }

    const products = await Promise.all(
      args.order.map((item) => ctx.db.get(item.productId)),
    );
    const validProducts = products.filter(
      (product): product is NonNullable<(typeof products)[number]> =>
        product !== null,
    );

    if (validProducts.length === 0) {
      throw new Error("no valid products found for this sale");
    }

    const storeId = validProducts[0].storeId;
    const isSameStore = validProducts.every(
      (product) => product.storeId === storeId,
    );

    if (!isSameStore) {
      throw new Error("all sale items must belong to the same store");
    }

    let customerId: any;
    let addressId: any;
    let deliveryCost = 0;
    let shippingStatus:
      | "pending"
      | "prepared"
      | "shipped"
      | "delivered"
      | "returned"
      | undefined;

    if (args.source === "online") {
      const fullWilaya = await ctx.db
        .query("wilayat")
        .filter((e) => e.eq(e.field("name"), args.wilaya))
        .first();

      if (!fullWilaya) throw new Error("wilaya doesnt exist");

      const newAddressId = await ctx.db.insert("addresses", {
        wilayaId: fullWilaya._id,
        address: args.address!,
      });

      let customer = await ctx.db
        .query("customers")
        .filter((e) => e.eq(e.field("phoneNumber"), args.phoneNumber!))
        .first();

      if (!customer) {
        const newCustomerId = await ctx.db.insert("customers", {
          storeId,
          firstName: args.firstName!,
          lastName: args.lastName!,
          phoneNumber: args.phoneNumber!,
          latestAddressId: newAddressId,
        });
        customer = await ctx.db.get(newCustomerId);
      }

      if (!customer) throw new Error("couldnt create customer for some reason");

      await ctx.db.patch(customer._id, {
        firstName: args.firstName!,
        lastName: args.lastName!,
        latestAddressId: newAddressId,
      });

      customerId = customer._id;
      addressId = newAddressId;
      deliveryCost = fullWilaya.deliveryCost;
      shippingStatus = "pending";
    }

    const createdAt = Date.now();
    const subTotalCost = args.order.reduce(
      (acc, item) => acc + item.price * item.quantity,
      0,
    );

    const saleId = await ctx.db.insert("sales", {
      storeId,
      createdAt,
      source: args.source,
      status: args.source === "in_store" ? "confirmed" : "pending",
      shippingStatus,
      customerId,
      addressId,
      deliveryCost,
      subTotalCost,
    });

    for (const item of args.order) {
      const product = validProducts.find((p) => p._id === item.productId);

      await ctx.db.insert("saleItems", {
        saleId,
        storeId,
        createdAt,
        quantity: item.quantity,
        productId: item.productId,
        skuId: item.skuId,
        price: item.price,
        cost: product?.cost ?? item.cost,
      });

      if (args.source === "in_store") {
        const sku = await ctx.db.get(item.skuId);
        if (sku) {
          const newQuantity = Math.max(0, sku.quantity - item.quantity);
          await ctx.db.patch(item.skuId, { quantity: newQuantity });
        }
      }
    }

    return saleId;
  },
});

export const listWilayat = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("wilayat").collect();
  },
});

export const list = authedQuery({
  resource: "sales",
  action: "read",
  args: {
    storeId: v.id("stores"),
    source: v.optional(v.union(v.literal("online"), v.literal("in_store"))),
    cursor: v.optional(v.number()),
  },
  handler: async (ctx, { storeId, source, cursor }) => {
    let query = ctx.db
      .query("sales")
      .withIndex("by_store_createdAt", (q) => q.eq("storeId", storeId));

    if (cursor) {
      query = query.filter((q) => q.gt(q.field("lastUpdate"), cursor));
    }

    const allSales = await query.collect();
    const filteredSales = source
      ? allSales.filter((sale) => sale.source === source)
      : allSales;
    const sortedSales = filteredSales.sort((a, b) => b.createdAt - a.createdAt);

    const phoneNumberCounts = new Map<string, number>();
    for (const sale of filteredSales) {
      if (!sale.customerId) continue;
      const customer = await ctx.db.get(sale.customerId);
      if (customer?.phoneNumber) {
        const phoneKey = customer.phoneNumber.toString();
        phoneNumberCounts.set(
          phoneKey,
          (phoneNumberCounts.get(phoneKey) || 0) + 1,
        );
      }
    }

    return await Promise.all(
      sortedSales.map(async (sale) => {
        const customer = sale.customerId
          ? await ctx.db.get(sale.customerId)
          : null;
        const address = sale.addressId
          ? await ctx.db.get(sale.addressId)
          : null;
        const wilaya = address ? await ctx.db.get(address.wilayaId) : null;

        const items = await ctx.db
          .query("saleItems")
          .withIndex("by_sale", (q) => q.eq("saleId", sale._id))
          .collect();

        const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
        const profit = items.reduce((sum, item) => {
          const itemCost = item.cost || 0;
          return sum + (item.price - itemCost) * item.quantity;
        }, 0);

        return {
          ...sale,
          items,
          customer,
          address: address
            ? {
                ...address,
                wilaya,
              }
            : null,
          itemCount,
          profit,
          customerOrderCount: customer?.phoneNumber
            ? phoneNumberCounts.get(customer.phoneNumber.toString()) || 0
            : 0,
        };
      }),
    );
  },
});

export const get = authedQuery({
  resource: "sales",
  action: "read",
  args: { saleId: v.id("sales") },
  handler: async (ctx, { saleId }) => {
    const sale = await ctx.db.get(saleId);
    if (!sale) return null;

    const customer = sale.customerId ? await ctx.db.get(sale.customerId) : null;
    const address = sale.addressId ? await ctx.db.get(sale.addressId) : null;
    const wilaya = address ? await ctx.db.get(address.wilayaId) : null;

    const items = await getSaleItemsWithDetails(ctx, saleId);

    return {
      ...sale,
      items,
      customer,
      address: address
        ? {
            ...address,
            wilaya,
          }
        : null,
    };
  },
});

export const confirm = authedMutation({
  resource: "sales",
  action: "update",
  args: { saleId: v.id("sales") },
  handler: async (ctx, { saleId }) => {
    const sale = await ctx.db.get(saleId);
    if (!sale || sale.source !== "online") {
      return { ok: false, error: "order not found" };
    }

    const items = await ctx.db
      .query("saleItems")
      .withIndex("by_sale", (q) => q.eq("saleId", saleId))
      .collect();

    const insufficientStockItems: Array<{
      skuId: string;
      requested: number;
      available: number;
    }> = [];

    for (const item of items) {
      const sku = await ctx.db.get(item.skuId);
      if (sku && sku.quantity < item.quantity) {
        insufficientStockItems.push({
          skuId: item.skuId,
          requested: item.quantity,
          available: sku.quantity,
        });
      }
    }

    if (insufficientStockItems.length > 0) {
      return {
        ok: false,
        error: "stock_not_sufficient",
        insufficientStockItems,
      };
    }

    for (const item of items) {
      const sku = await ctx.db.get(item.skuId);
      if (sku) {
        const newQuantity = Math.max(0, sku.quantity - item.quantity);
        await ctx.db.patch(item.skuId, { quantity: newQuantity });
      }
    }

    await ctx.db.patch(saleId, { status: "confirmed" });
    return { ok: true, message: "success" };
  },
});

export const deny = authedMutation({
  resource: "sales",
  action: "update",
  args: { saleId: v.id("sales") },
  handler: async (ctx, { saleId }) => {
    await ctx.db.patch(saleId, { status: "denied" });
    return "success";
  },
});

export const remove = authedMutation({
  resource: "sales",
  action: "delete",
  args: { saleId: v.id("sales") },
  handler: async (ctx, { saleId }) => {
    const items = await ctx.db
      .query("saleItems")
      .withIndex("by_sale", (q) => q.eq("saleId", saleId))
      .collect();

    for (const item of items) {
      await ctx.db.delete(item._id);
    }

    await ctx.db.delete(saleId);
    return "success";
  },
});
