import { v } from "convex/values";
import { authedQuery } from "./customFunctions";
import { Id } from "./_generated/dataModel";

async function getOnlineSalesByCustomer(ctx: any, customerId: any) {
  const sales = await ctx.db
    .query("sales")
    .withIndex("by_customer", (q: any) => q.eq("customerId", customerId))
    .collect();

  return sales.filter((sale: any) => sale.source === "online");
}

export const list = authedQuery({
  resource: "customers",
  action: "read",
  args: {
    storeId: v.id("stores"),
    cursor: v.optional(v.number()),
  },
  handler: async (ctx, { storeId, cursor }) => {
    let query = ctx.db
      .query("customers")
      .withIndex("by_store", (q) => q.eq("storeId", storeId));

    if (cursor) {
      query = query.filter((q) => q.gt(q.field("lastUpdate"), cursor));
    }

    const customers = await query.collect();

    return await Promise.all(
      customers.map(async (customer) => {
        const address = customer.latestAddressId
          ? await ctx.db.get(customer.latestAddressId)
          : null;
        const wilaya = address ? await ctx.db.get(address.wilayaId) : null;

        const sales = await getOnlineSalesByCustomer(ctx, customer._id);

        const sortedSales = sales.sort(
          (a: any, b: any) => b.createdAt - a.createdAt,
        );
        const lastOrderDate =
          sortedSales.length > 0
            ? new Date(sortedSales[0].createdAt).toISOString()
            : null;

        let totalRevenue = 0;
        let totalProfit = 0;

        for (const sale of sales) {
          const items = await ctx.db
            .query("saleItems")
            .withIndex("by_sale", (q) => q.eq("saleId", sale._id))
            .collect();

          for (const item of items) {
            totalRevenue += item.price * item.quantity;
            if (item.cost !== undefined) {
              totalProfit += (item.price - item.cost) * item.quantity;
            }
          }

          totalRevenue += sale.deliveryCost;
        }

        return {
          ...customer,
          address: address
            ? {
                ...address,
                wilaya,
              }
            : null,
          orderCount: sales.length,
          lastOrderDate,
          totalRevenue,
          totalProfit,
        };
      }),
    );
  },
});

export const get = authedQuery({
  resource: "customers",
  action: "read",
  args: { customerId: v.id("customers") },
  handler: async (ctx, { customerId }) => {
    const customer = await ctx.db.get(customerId);
    if (!customer) return null;

    const address = customer.latestAddressId
      ? await ctx.db.get(customer.latestAddressId as Id<"addresses">)
      : null;
    const wilaya = address
      ? await ctx.db.get(address.wilayaId as Id<"wilayat">)
      : null;

    const sales = await getOnlineSalesByCustomer(ctx, customerId);
    const sortedSales = sales.sort(
      (a: any, b: any) => b.createdAt - a.createdAt,
    );

    const ordersWithDetails = await Promise.all(
      sortedSales.map(async (sale: any) => {
        const saleAddress = sale.addressId
          ? ((await ctx.db.get(sale.addressId)) as any)
          : null;
        const saleWilaya = saleAddress
          ? await ctx.db.get(saleAddress.wilayaId)
          : null;

        return {
          ...sale,
          orderTime: new Date(sale.createdAt).toISOString(),
          address: saleAddress
            ? {
                ...saleAddress,
                wilaya: saleWilaya,
              }
            : null,
        };
      }),
    );

    return {
      ...customer,
      address: address
        ? {
            ...address,
            wilaya,
          }
        : null,
      orders: ordersWithDetails,
    };
  },
});

export const getByPhone = authedQuery({
  resource: "customers",
  action: "read",
  args: { phoneNumber: v.number() },
  handler: async (ctx, { phoneNumber }) => {
    const customer = await ctx.db
      .query("customers")
      .withIndex("by_phone", (q) => q.eq("phoneNumber", phoneNumber))
      .first();

    if (!customer) return null;

    const address = customer.latestAddressId
      ? await ctx.db.get(customer.latestAddressId as Id<"addresses">)
      : null;
    const wilaya = address
      ? await ctx.db.get(address.wilayaId as Id<"wilayat">)
      : null;

    return {
      ...customer,
      address: address
        ? {
            ...address,
            wilaya,
          }
        : null,
    };
  },
});
