import { internalMutation } from "./_generated/server";
import { Id } from "./_generated/dataModel";

const wilayatData = [
  { name: "Muscat", htmlName: "Muscat", deliveryCost: 2 },
  { name: "Al Batinah", htmlName: "Al Batinah", deliveryCost: 3 },
  { name: "Dakhiliyah", htmlName: "Dakhiliyah", deliveryCost: 4 },
  { name: "Sharqiyah", htmlName: "Sharqiyah", deliveryCost: 5 },
];

const customersData = [
  { firstName: "Ahmed", lastName: "Alawi", phoneNumber: 96812345678 },
  { firstName: "Khalid", lastName: "Al Said", phoneNumber: 96823456789 },
  { firstName: "Omar", lastName: "Al Harthy", phoneNumber: 96834567890 },
  { firstName: "Fatima", lastName: "Al Maashani", phoneNumber: 96845678901 },
  { firstName: "Sarah", lastName: "Al Ghaffari", phoneNumber: 96856789012 },
];

const addressesData = [
  { address: "123 Muscat Road, Al Khuwair" },
  { address: "456 Sultan Qaboos Street, Seeb" },
  { address: "789 Batinah Coast, Sohar" },
  { address: "321 Dakhliya Street, Nizwa" },
  { address: "654 Sharqiyah Avenue, Sur" },
  { address: "987 CBD Tower, Muscat" },
  { address: "147 Marina Boulevard, Muscat" },
];

const orderStatuses = ["pending", "confirmed", "denied"] as const;

export const seedOrders = internalMutation({
  handler: async (ctx): Promise<void> => {
    const db = ctx.db;

    const existingOrders = await db.query("orders").collect();
    for (const order of existingOrders) {
      await db.delete(order._id);
    }

    const existingCustomers = await db.query("customers").collect();
    for (const customer of existingCustomers) {
      await db.delete(customer._id);
    }

    const existingAddresses = await db.query("addresses").collect();
    for (const address of existingAddresses) {
      await db.delete(address._id);
    }

    const existingWilayat = await db.query("wilayat").collect();
    for (const wilaya of existingWilayat) {
      await db.delete(wilaya._id);
    }

    const store = await db.query("stores").first();
    if (!store) {
      throw new Error("No store found. Run seedProducts first.");
    }

    const products = await db
      .query("products")
      .withIndex("by_store", (q) => q.eq("storeId", store._id))
      .collect();

    if (products.length === 0) {
      throw new Error("No products found. Run seedProducts first.");
    }

    const wilayaIds: Id<"wilayat">[] = [];
    for (const w of wilayatData) {
      const id = await db.insert("wilayat", w);
      wilayaIds.push(id);
    }

    const customerIds: Id<"customers">[] = [];
    const addressIds: Id<"addresses">[] = [];

    for (let i = 0; i < customersData.length; i++) {
      const customer = customersData[i];
      const addressIndex = i % addressesData.length;
      const wilayaIndex = i % wilayaIds.length;

      const addressId = await db.insert("addresses", {
        wilayaId: wilayaIds[wilayaIndex],
        address: addressesData[addressIndex].address,
      });
      addressIds.push(addressId);

      const customerId = await db.insert("customers", {
        firstName: customer.firstName,
        lastName: customer.lastName,
        phoneNumber: customer.phoneNumber,
        lastestAdressId: addressId,
      });
      customerIds.push(customerId);
    }

    const monthsIn3Years = 36;
    const ordersPerMonth = 80;
    const monthDistribution = [
      1.0, 0.9, 1.0, 1.0, 1.1, 1.2, 0.8, 0.9, 1.0, 1.3, 1.5, 1.6,
    ];

    const now = Date.now();
    const threeYearsAgo = now - 3 * 365 * 24 * 60 * 60 * 1000;
    const msPerMonth = (now - threeYearsAgo) / monthsIn3Years;

    let ordersCreated = 0;
    for (let month = 0; month < monthsIn3Years; month++) {
      const baseMonth = month % 12;
      const multiplier = monthDistribution[baseMonth];
      const ordersThisMonth = Math.floor(ordersPerMonth * multiplier);

      const monthStart = threeYearsAgo + month * msPerMonth;
      const monthEnd = monthStart + msPerMonth;

      for (let i = 0; i < ordersThisMonth; i++) {
        const customerId =
          customerIds[Math.floor(Math.random() * customerIds.length)];
        const addressId =
          addressIds[Math.floor(Math.random() * addressIds.length)];

        const numItems = Math.floor(Math.random() * 3) + 1;
        const orderItems: {
          quantity: number;
          productId: Id<"products">;
          price: number;
          cost?: number;
          selection: {
            variantId: Id<"variants">;
            variantOptionId: Id<"variantOptions">;
          }[];
        }[] = [];

        let subTotalCost = 0;

        const usedProductIndices = new Set<number>();
        for (let j = 0; j < numItems; j++) {
          let productIndex: number;
          do {
            productIndex = Math.floor(Math.random() * products.length);
          } while (
            usedProductIndices.has(productIndex) &&
            usedProductIndices.size < products.length
          );
          usedProductIndices.add(productIndex);

          const product = products[productIndex];
          const quantity = Math.floor(Math.random() * 3) + 1;
          const price = product.price || 50;
          const cost = product.cost || Math.floor(price * 0.4);

          orderItems.push({
            quantity,
            productId: product._id,
            price,
            cost,
            selection: [],
          });

          subTotalCost += cost * quantity;
        }

        const wilayaIndex = Math.floor(Math.random() * wilayaIds.length);
        const deliveryCost = wilayatData[wilayaIndex].deliveryCost;

        const status =
          orderStatuses[Math.floor(Math.random() * orderStatuses.length)];

        const orderTimeMs =
          monthStart + Math.random() * (monthEnd - monthStart);
        const orderTime = new Date(orderTimeMs).toISOString();

        await db.insert("orders", {
          orderTime,
          customerId,
          order: orderItems,
          addressId,
          deliveryCost,
          subTotalCost,
          status,
        });

        ordersCreated++;
      }

      if ((month + 1) % 6 === 0) {
        console.log(`Created ${ordersCreated} orders so far...`);
      }
    }

    console.log(`Seeded ${ordersCreated} orders across 3 years`);

    const existingSales = await db.query("sales").collect();
    for (const sale of existingSales) {
      await db.delete(sale._id);
    }

    const salesPerMonth = 100;

    let salesCreated = 0;
    for (let month = 0; month < monthsIn3Years; month++) {
      const baseMonth = month % 12;
      const multiplier = monthDistribution[baseMonth];
      const salesThisMonth = Math.floor(salesPerMonth * multiplier);

      const monthStart = threeYearsAgo + month * msPerMonth;
      const monthEnd = monthStart + msPerMonth;

      for (let s = 0; s < salesThisMonth; s++) {
        const numItems = Math.floor(Math.random() * 4) + 1;
        const saleItems: {
          quantity: number;
          productId: Id<"products">;
          price: number;
          cost?: number;
          selection: {
            variantId: Id<"variants">;
            variantOptionId: Id<"variantOptions">;
          }[];
        }[] = [];

        let subTotalCost = 0;

        const usedProductIndices = new Set<number>();
        for (let j = 0; j < numItems; j++) {
          let productIndex: number;
          do {
            productIndex = Math.floor(Math.random() * products.length);
          } while (
            usedProductIndices.has(productIndex) &&
            usedProductIndices.size < products.length
          );
          usedProductIndices.add(productIndex);

          const product = products[productIndex];
          const quantity = Math.floor(Math.random() * 3) + 1;
          const priceVariation = 0.9 + Math.random() * 0.2;
          const price = Math.floor((product.price || 50) * priceVariation);
          const cost = product.cost || Math.floor(price * 0.4);

          saleItems.push({
            quantity,
            productId: product._id,
            price,
            cost,
            selection: [],
          });

          subTotalCost += cost * quantity;
        }

        const saleTimeMs = monthStart + Math.random() * (monthEnd - monthStart);
        const saleTime = new Date(saleTimeMs).toISOString();

        await db.insert("sales", {
          saleTime,
          order: saleItems,
          subTotalCost,
        });

        salesCreated++;
      }

      if ((month + 1) % 6 === 0) {
        console.log(`Created ${salesCreated} sales so far...`);
      }
    }

    console.log(`Seeded ${salesCreated} sales across 3 years`);
  },
});
