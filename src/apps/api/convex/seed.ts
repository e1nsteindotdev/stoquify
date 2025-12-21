import { mutation } from "./_generated/server";
import { v } from "convex/values";

export const seedDemoData = mutation({
  args: {
    countPerYear: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const products = await ctx.db.query("products").collect();
    if (products.length === 0) return { error: "No products found to seed data." };

    const wilayat = await ctx.db.query("wilayat").collect();
    const wilaya = wilayat[0] || { _id: "dummy" as any, deliveryCost: 400 };

    const countPerYear = args.countPerYear ?? 1500;
    const years = [2023, 2024, 2025];
    const now = Date.now();

    // Create a few dummy customers and addresses
    const customerIds = [];
    const addressIds = [];

    for (let i = 0; i < 50; i++) {
      const addrId = await ctx.db.insert("addresses", {
        wilayaId: wilaya._id,
        address: `Adresse Seed ${i}`,
      });
      addressIds.push(addrId);

      const custId = await ctx.db.insert("customers", {
        firstName: `Prénom${i}`,
        lastName: `Nom${i}`,
        phoneNumber: 500000000 + i,
        lastestAdressId: addrId,
      });
      customerIds.push(custId);
    }

    let entriesCreated = 0;

    for (const year of years) {
      for (let i = 0; i < countPerYear; i++) {
        const month = Math.floor(Math.random() * 12);
        const day = Math.floor(Math.random() * 28) + 1;
        const hour = Math.floor(Math.random() * 24);
        const timestamp = new Date(year, month, day, hour).getTime();

        if (timestamp > now) continue;

        // Randomly choose POS sale or Online order
        const isPOS = Math.random() > 0.4;
        const numItems = Math.floor(Math.random() * 3) + 1;
        const orderItems = [];
        let subTotalCost = 0;

        for (let j = 0; j < numItems; j++) {
          const product = products[Math.floor(Math.random() * products.length)];
          const quantity = Math.floor(Math.random() * 2) + 1;
          const price = product.price ?? 5000;
          const cost = product.cost ?? (price * 0.7);

          orderItems.push({
            productId: product._id,
            quantity,
            price,
            cost,
            selection: [], // Keeping it simple for seed
          });
          subTotalCost += price * quantity;
        }

        if (isPOS) {
          await ctx.db.insert("sales", {
            order: orderItems,
            subTotalCost,
            createdAt: timestamp,
          });
        } else {
          await ctx.db.insert("orders", {
            customerId: customerIds[Math.floor(Math.random() * customerIds.length)],
            addressId: addressIds[Math.floor(Math.random() * addressIds.length)],
            order: orderItems,
            deliveryCost: wilaya.deliveryCost ?? 400,
            subTotalCost,
            status: "confirmed",
            createdAt: timestamp,
          });
        }
        entriesCreated++;
      }
    }

    return { entriesCreated };
  },
});

export const seedCurrentWeek = mutation({
  args: {
    entriesPerDay: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const products = await ctx.db.query("products").collect();
    if (products.length === 0) return { error: "No products found to seed data." };

    const wilayat = await ctx.db.query("wilayat").collect();
    const wilaya = wilayat[0] || { _id: "dummy" as any, deliveryCost: 400 };

    const entriesPerDay = args.entriesPerDay ?? 30;
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay() + (now.getDay() === 0 ? -6 : 1)); // Set to Monday
    startOfWeek.setHours(0, 0, 0, 0);

    // Create a few dummy customers and addresses if they don't exist
    const customerIds = [];
    const addressIds = [];

    for (let i = 0; i < 20; i++) {
      const addrId = await ctx.db.insert("addresses", {
        wilayaId: wilaya._id,
        address: `Adresse Daily Seed ${i}`,
      });
      addressIds.push(addrId);

      const custId = await ctx.db.insert("customers", {
        firstName: `User${i}`,
        lastName: `Daily${i}`,
        phoneNumber: 700000000 + i,
        lastestAdressId: addrId,
      });
      customerIds.push(custId);
    }

    let entriesCreated = 0;

    for (let d = 0; d < 7; d++) {
      const currentDay = new Date(startOfWeek);
      currentDay.setDate(startOfWeek.getDate() + d);
      
      if (currentDay > now) break;

      for (let i = 0; i < entriesPerDay; i++) {
        // Random hour within the day
        const hour = Math.floor(Math.random() * 24);
        const minute = Math.floor(Math.random() * 60);
        const timestamp = new Date(currentDay);
        timestamp.setHours(hour, minute);

        if (timestamp > now) continue;

        // Randomly choose POS sale or Online order
        const isPOS = Math.random() > 0.4;
        const numItems = Math.floor(Math.random() * 3) + 1;
        const orderItems = [];
        let subTotalCost = 0;

        for (let j = 0; j < numItems; j++) {
          const product = products[Math.floor(Math.random() * products.length)];
          const quantity = Math.floor(Math.random() * 2) + 1;
          const price = product.price ?? 5000;
          const cost = product.cost ?? (price * 0.7);

          orderItems.push({
            productId: product._id,
            quantity,
            price,
            cost,
            selection: [],
          });
          subTotalCost += price * quantity;
        }

        if (isPOS) {
          await ctx.db.insert("sales", {
            order: orderItems,
            subTotalCost,
            createdAt: timestamp.getTime(),
          });
        } else {
          await ctx.db.insert("orders", {
            customerId: customerIds[Math.floor(Math.random() * customerIds.length)],
            addressId: addressIds[Math.floor(Math.random() * addressIds.length)],
            order: orderItems,
            deliveryCost: wilaya.deliveryCost ?? 400,
            subTotalCost,
            status: "confirmed",
            createdAt: timestamp.getTime(),
          });
        }
        entriesCreated++;
      }
    }

    return { entriesCreated, startOfWeek: startOfWeek.toISOString() };
  },
});

export const cleanupCurrentWeek = mutation({
  args: {},
  handler: async (ctx) => {
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay() + (now.getDay() === 0 ? -6 : 1)); // Set to Monday
    startOfWeek.setHours(0, 0, 0, 0);
    const startTime = startOfWeek.getTime();

    // Convex has limits on reads/writes per transaction.
    // We'll process in small batches or just delete a fixed amount recursively if called multiple times.
    // For simplicity, let's try to delete up to 500 at a time.
    
    const sales = await ctx.db
      .query("sales")
      .withIndex("by_createdAt", (q) => q.gte("createdAt", startTime))
      .take(500);

    const orders = await ctx.db
      .query("orders")
      .withIndex("by_createdAt", (q) => q.gte("createdAt", startTime))
      .take(500);

    let deletedSales = 0;
    for (const sale of sales) {
      await ctx.db.delete(sale._id);
      deletedSales++;
    }

    let deletedOrders = 0;
    for (const order of orders) {
      await ctx.db.delete(order._id);
      deletedOrders++;
    }

    return { 
      deletedSales, 
      deletedOrders, 
      remainingPotential: (sales.length === 500 || orders.length === 500) 
    };
  },
});
