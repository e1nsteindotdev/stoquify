import { v } from "convex/values";
import { authedQuery } from "./customeFunction";

export const listCustomers = authedQuery({
  resource: "customers",
  action: "read",
  args: {},
  handler: async (ctx) => {
    const customers = await ctx.db.query("customers").collect();

    return await Promise.all(
      customers.map(async (customer) => {
        const address = await ctx.db.get(customer.lastestAdressId);
        const wilaya = address ? await ctx.db.get(address.wilayaId) : null;

        // Get orders for this customer
        const orders = await ctx.db
          .query("orders")
          .withIndex("by_customer", (q) => q.eq("customerId", customer._id))
          .collect();

        const sortedOrders = orders.sort(
          (a, b) => (b._creationTime || 0) - (a._creationTime || 0),
        );

        const lastOrderDate =
          sortedOrders.length > 0 ? sortedOrders[0].orderTime : null;

        let totalRevenue = 0;
        let totalProfit = 0;

        for (const order of orders) {
          for (const item of order.order) {
            totalRevenue += item.price * item.quantity;
            if (item.cost !== undefined) {
              totalProfit += (item.price - item.cost) * item.quantity;
            }
          }
          totalRevenue += order.deliveryCost;
        }

        return {
          ...customer,
          address: address
            ? {
                ...address,
                wilaya,
              }
            : null,
          orderCount: orders.length,
          lastOrderDate,
          totalRevenue,
          totalProfit,
        };
      }),
    );
  },
});

export const getCustomer = authedQuery({
  resource: "customers",
  action: "read",
  args: { customerId: v.id("customers") },
  handler: async (ctx, { customerId }) => {
    const customer = await ctx.db.get(customerId);
    if (!customer) return null;

    const address = await ctx.db.get(customer.lastestAdressId);
    const wilaya = address ? await ctx.db.get(address.wilayaId) : null;

    // Get all orders for this customer
    const orders = await ctx.db
      .query("orders")
      .withIndex("by_customer", (q) => q.eq("customerId", customerId))
      .collect();

    const sortedOrders = orders.sort(
      (a, b) => (b._creationTime || 0) - (a._creationTime || 0),
    );

    const ordersWithDetails = await Promise.all(
      sortedOrders.map(async (order) => {
        const orderAddress = await ctx.db.get(order.addressId);
        const orderWilaya = orderAddress
          ? await ctx.db.get(orderAddress.wilayaId)
          : null;

        return {
          ...order,
          address: orderAddress
            ? {
                ...orderAddress,
                wilaya: orderWilaya,
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

export const getCustomerByPhone = authedQuery({
  resource: "customers",
  action: "read",
  args: { phoneNumber: v.number() },
  handler: async (ctx, { phoneNumber }) => {
    const customer = await ctx.db
      .query("customers")
      .withIndex("by_phone", (q) => q.eq("phoneNumber", phoneNumber))
      .first();

    if (!customer) return null;

    const address = await ctx.db.get(customer.lastestAdressId);
    const wilaya = address ? await ctx.db.get(address.wilayaId) : null;

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
