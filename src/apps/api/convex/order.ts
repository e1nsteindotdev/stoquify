import { v } from "convex/values";
import { authedMutation, authedQuery } from "./customeFunction";

export const placeOrder = authedMutation({
  resource: "orders",
  action: "create",
  args: v.object({
    address: v.string(),
    firstName: v.string(),
    lastName: v.string(),
    phoneNumber: v.number(),
    wilaya: v.string(),
    order: v.array(
      v.object({
        quantity: v.number(),
        productId: v.id("products"),
        skuId: v.id("skus"),
        price: v.number(),
        cost: v.optional(v.number()),
      }),
    ),
  }),
  handler: async (ctx, args) => {
    let fullWilaya = await ctx.db
      .query("wilayat")
      .filter((e) => e.eq(e.field("name"), args.wilaya))
      .first();
    console.log("found wilaya", fullWilaya?.name);
    if (!fullWilaya) return new Error("wilaya doesnt exist");

    const newAddressId = await ctx.db.insert("addresses", {
      wilayaId: fullWilaya?._id,
      address: args.address,
    });
    console.log("inserted new address", newAddressId);

    let customer = await ctx.db
      .query("customers")
      .filter((e) => e.eq(e.field("phoneNumber"), args.phoneNumber))
      .first();

    if (customer) console.log("found customer :", customer?._id);

    if (!customer) {
      const newCustomerId = await ctx.db.insert("customers", {
        firstName: args.firstName,
        lastName: args.lastName,
        phoneNumber: args.phoneNumber,
        lastestAdressId: newAddressId,
      });
      customer = await ctx.db.get(newCustomerId);
      console.log("created new csutomer :", newCustomerId);
    }
    if (!customer) return new Error("couldnt create customer for some reason");

    await ctx.db.patch(customer._id, {
      firstName: args.firstName,
      lastName: args.lastName,
      lastestAdressId: newAddressId,
    });

    const products = await Promise.all(
      args.order.map((v) => ctx.db.get(v.productId)),
    );
    const subTotalCostArr = products.map((p) => {
      if (p?.price) {
        const quantity =
          args.order.find((o) => o?.productId === p?._id)?.quantity ?? 0;
        return p.price * quantity;
      } else return 0;
    });
    const subTotalCost =
      subTotalCostArr.length > 0
        ? subTotalCostArr.reduce((acc, current) => acc + current)
        : 0;
    console.log("calculated the total cost :", subTotalCost);

    const placedOrder = await ctx.db.insert("orders", {
      orderTime: new Date().toISOString(),
      order: args.order.map((item) => {
        const product = products.find((p) => p?._id === item.productId);
        return {
          quantity: item.quantity,
          productId: item.productId,
          skuId: item.skuId,
          price: item.price,
          cost: product?.cost,
        };
      }),
      customerId: customer._id,
      addressId: newAddressId,
      deliveryCost: fullWilaya.deliveryCost,
      subTotalCost,
      status: "pending",
      source: "online",
    });
    console.log("ordered placed correctly :", placedOrder);

    return placedOrder;
  },
});

export const getWilayat = authedQuery({
  resource: "orders",
  action: "read",
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("wilayat").collect();
  },
});

export const listOrders = authedQuery({
  resource: "orders",
  action: "read",
  args: {},
  handler: async (ctx) => {
    const orders = await ctx.db.query("orders").collect();

    const sortedOrders = orders.sort(
      (a, b) => (b._creationTime || 0) - (a._creationTime || 0),
    );

    const phoneNumberCounts = new Map<string, number>();
    for (const order of orders) {
      const customer = await ctx.db.get(order.customerId);
      if (customer?.phoneNumber) {
        const count =
          phoneNumberCounts.get(customer.phoneNumber.toString()) || 0;
        phoneNumberCounts.set(customer.phoneNumber.toString(), count + 1);
      }
    }

    return await Promise.all(
      sortedOrders.map(async (order) => {
        const customer = await ctx.db.get(order.customerId);
        const address = await ctx.db.get(order.addressId);
        const wilaya = address ? await ctx.db.get(address.wilayaId) : null;

        const itemCount = order.order.reduce(
          (sum, item) => sum + item.quantity,
          0,
        );
        const profit = order.order.reduce((sum, item) => {
          const itemCost = item.cost || 0;
          return sum + (item.price - itemCost) * item.quantity;
        }, 0);

        return {
          ...order,
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

export const getOrder = authedQuery({
  resource: "orders",
  action: "read",
  args: { orderId: v.id("orders") },
  handler: async (ctx, { orderId }) => {
    const order = await ctx.db.get(orderId);
    if (!order) return null;

    const customer = await ctx.db.get(order.customerId);
    const address = await ctx.db.get(order.addressId);
    const wilaya = address ? await ctx.db.get(address.wilayaId) : null;

    const orderItems = await Promise.all(
      order.order.map(async (item) => {
        const product = await ctx.db.get(item.productId);
        const sku = await ctx.db.get(item.skuId);
        const variantOptions = sku
          ? await Promise.all(
              sku.options.map(async (optId) => {
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

    return {
      ...order,
      customer,
      address: address
        ? {
            ...address,
            wilaya,
          }
        : null,
      order: orderItems,
    };
  },
});

export const confirmOrder = authedMutation({
  resource: "orders",
  action: "update",
  args: { orderId: v.id("orders") },
  handler: async (ctx, { orderId }) => {
    const order = await ctx.db.get(orderId);
    if (!order) return { ok: false, error: "order not found" };

    const insufficientStockItems: Array<{
      skuId: string;
      requested: number;
      available: number;
    }> = [];

    for (const item of order.order) {
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

    for (const item of order.order) {
      const sku = await ctx.db.get(item.skuId);
      if (sku) {
        const newQuantity = Math.max(0, sku.quantity - item.quantity);
        await ctx.db.patch(item.skuId, { quantity: newQuantity });
      }
    }

    await ctx.db.patch(orderId, { status: "confirmed" });
    return { ok: true, message: "success" };
  },
});

export const denyOrder = authedMutation({
  resource: "orders",
  action: "update",
  args: { orderId: v.id("orders") },
  handler: async (ctx, { orderId }) => {
    await ctx.db.patch(orderId, { status: "denied" });
    return "success";
  },
});

export const deleteOrder = authedMutation({
  resource: "orders",
  action: "delete",
  args: { orderId: v.id("orders") },
  handler: async (ctx, { orderId }) => {
    await ctx.db.delete(orderId);
    return "success";
  },
});
