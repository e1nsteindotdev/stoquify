import { internalMutation } from "./_generated/server";
import { Id } from "./_generated/dataModel";

const sizeOptions = ["S", "M", "L", "XL"];

export const seedInventoryDemo = internalMutation({
  handler: async (ctx): Promise<void> => {
    const db = ctx.db;

    const store = await db.query("stores").first();
    if (!store) {
      throw new Error("No store found. Run seedProducts first.");
    }

    const existingProducts = await db
      .query("products")
      .withIndex("by_store", (q) => q.eq("storeId", store._id))
      .take(15);

    if (existingProducts.length === 0) {
      throw new Error("No products found. Run seedProducts first.");
    }

    const criticalProducts = existingProducts.slice(0, 3);
    const warningProducts = existingProducts.slice(3, 8);

    const existingSkus = await db.query("skus").take(100);
    const skuProductIds = new Set(existingSkus.map((s) => String(s.productId)));

    const variantOptionsMap = new Map<
      Id<"variantOptions">,
      { variantId: Id<"variants"> }
    >();

    for (const product of [...criticalProducts, ...warningProducts]) {
      const productSkus = existingSkus.filter(
        (s) => String(s.productId) === String(product._id),
      );

      if (productSkus.length > 0) {
        for (const sku of productSkus) {
          await db.delete(sku._id);
        }
      }

      const variantId = await db.insert("variants", {
        productId: product._id,
        name: "Size",
        order: 0,
      });

      const variantOptionIds: Id<"variantOptions">[] = [];
      for (let i = 0; i < sizeOptions.length; i++) {
        const optionId = await db.insert("variantOptions", {
          variantId,
          order: i,
          name: sizeOptions[i],
        });
        variantOptionIds.push(optionId);
        variantOptionsMap.set(optionId, { variantId });
      }

      const isCritical = criticalProducts.includes(product);
      const quantities = isCritical ? [2, 3, 4, 5] : [15, 20, 25, 30];

      for (let i = 0; i < variantOptionIds.length; i++) {
        await db.insert("skus", {
          productId: product._id,
          quantity: quantities[i],
          options: [variantOptionIds[i]],
        });
      }

      await db.patch(product._id, {
        stockingStrategy: "by_variants",
      });
    }

    const allSkus = await db.query("skus").take(500);
    const skusByProduct = new Map<
      Id<"products">,
      Array<{
        _id: Id<"skus">;
        options: Id<"variantOptions">[];
        quantity: number;
      }>
    >();
    for (const sku of allSkus) {
      const existing = skusByProduct.get(sku.productId) || [];
      existing.push(sku);
      skusByProduct.set(sku.productId, existing);
    }

    const existingSales = await db.query("sales").take(100);
    for (const sale of existingSales) {
      await db.delete(sale._id);
    }

    const customers = await db
      .query("customers")
      .take(1)
      .then((c) => c[0]);
    const addresses = await db
      .query("addresses")
      .take(1)
      .then((a) => a[0]);

    if (!customers || !addresses) {
      throw new Error("Run seedOrders first to have customers and addresses.");
    }

    const customerId = customers._id;
    const addressId = addresses._id;

    const now = Date.now();
    const dayMs = 24 * 60 * 60 * 1000;
    const thirtyDaysAgo = now - 30 * dayMs;

    for (let dayOffset = 0; dayOffset < 30; dayOffset++) {
      const saleDate = thirtyDaysAgo + dayOffset * dayMs;
      const isRecent = dayOffset >= 20;

      for (const product of criticalProducts) {
        const dailyQty = isRecent
          ? Math.floor(Math.random() * 3) + 2
          : Math.floor(Math.random() * 2) + 1;

        const productSkus = skusByProduct.get(product._id);
        if (!productSkus || productSkus.length === 0) continue;

        const sku = productSkus[Math.floor(Math.random() * productSkus.length)];
        const variantInfo = variantOptionsMap.get(sku.options[0]);

        const randomHour = Math.floor(Math.random() * 14) + 8;
        const saleTime = new Date(
          saleDate + randomHour * 60 * 60 * 1000,
        ).toISOString();

        await db.insert("sales", {
          saleTime,
          order: [
            {
              quantity: dailyQty,
              productId: product._id,
              price: product.price || 50,
              cost: product.cost || 20,
              selection: variantInfo
                ? [
                    {
                      variantId: variantInfo.variantId,
                      variantOptionId: sku.options[0],
                    },
                  ]
                : [],
            },
          ],
          subTotalCost: (product.cost || 20) * dailyQty,
        });
      }

      for (const product of warningProducts) {
        const dailyQty = Math.floor(Math.random() * 2) + 1;

        const productSkus = skusByProduct.get(product._id);
        if (!productSkus || productSkus.length === 0) continue;

        const sku = productSkus[Math.floor(Math.random() * productSkus.length)];
        const variantInfo = variantOptionsMap.get(sku.options[0]);

        const randomHour = Math.floor(Math.random() * 14) + 8;
        const saleTime = new Date(
          saleDate + randomHour * 60 * 60 * 1000,
        ).toISOString();

        await db.insert("sales", {
          saleTime,
          order: [
            {
              quantity: dailyQty,
              productId: product._id,
              price: product.price || 50,
              cost: product.cost || 20,
              selection: variantInfo
                ? [
                    {
                      variantId: variantInfo.variantId,
                      variantOptionId: sku.options[0],
                    },
                  ]
                : [],
            },
          ],
          subTotalCost: (product.cost || 20) * dailyQty,
        });
      }
    }

    const oldProducts = existingProducts.slice(10, 15);
    const ninetyDaysAgo = now - 90 * dayMs;

    for (let dayOffset = 0; dayOffset < 10; dayOffset++) {
      const saleDate = ninetyDaysAgo + dayOffset * dayMs;
      const randomHour = Math.floor(Math.random() * 14) + 8;
      const orderTime = new Date(
        saleDate + randomHour * 60 * 60 * 1000,
      ).toISOString();

      for (const product of oldProducts) {
        await db.insert("orders", {
          orderTime,
          customerId,
          order: [
            {
              quantity: 2,
              productId: product._id,
              price: product.price || 50,
              cost: product.cost || 20,
              selection: [],
            },
          ],
          addressId,
          deliveryCost: 5,
          subTotalCost: (product.cost || 20) * 2,
          status: "confirmed",
        });
      }
    }

    console.log(`Seeded inventory demo:`);
    console.log(
      `- ${criticalProducts.length} critical products (low stock, high sales)`,
    );
    console.log(
      `- ${warningProducts.length} warning products (medium stock, moderate sales)`,
    );
    console.log(
      `- ${oldProducts.length} dead stock products (no recent sales)`,
    );
    console.log(`- Created Size variant with S/M/L/XL for each`);
  },
});
