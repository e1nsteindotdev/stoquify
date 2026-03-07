import { internalMutation } from "./_generated/server";
import { Id } from "./_generated/dataModel";

const STORE_ID = "k978gcdre5nxz6tndjvm3t6rx98210gz" as Id<"stores">;

async function deleteAllPaginated(
  db: any,
  tableName: string,
  batchSize: number = 128,
): Promise<number> {
  let deleted = 0;
  while (true) {
    const items = await db.query(tableName).take(batchSize);
    if (items.length === 0) break;
    for (const item of items) {
      await db.delete(item._id);
    }
    deleted += items.length;
  }
  return deleted;
}

const productNames = [
  "Classic Cotton T-Shirt",
  "Slim Fit Jeans",
  "Casual Hoodie",
  "Leather Belt",
  "Running Sneakers",
  "Wool Sweater",
  "Denim Jacket",
  "Canvas Backpack",
  "Leather Wallet",
  "Baseball Cap",
  "Silk Scarf",
  "Cotton Socks Pack",
  "Winter Gloves",
  "Sports Shorts",
  "Linen Shirt",
  "Chino Pants",
  "Fleece Vest",
  "Dress Shoes",
  "Ankle Boots",
  "Bamboo Watch",
  "Sunglasses",
  "Messenger Bag",
  "Polo Shirt",
  "Joggers",
  "Trench Coat",
  "Silk Tie",
  "Leather Gloves",
  "Canvas Belt",
  "Slip-On Shoes",
  "Graphic Tee",
  "Cargo Pants",
  "Puffer Jacket",
  "Oxford Shirt",
  "Leather Loafers",
  "Sports Cap",
  "Thermal Underwear",
  "Cashmere Sweater",
  "Corduroy Pants",
  "Rain Jacket",
  "Knit Beanie",
  "Dress Socks",
  "Platform Sneakers",
  "Bomber Jacket",
  "Stretch Jeans",
  "V-Neck Sweater",
  "Weekend Bag",
  "Leather Bracelet",
  "Cotton Tank Top",
  "Drawstring Shorts",
  "Wool Scarf",
  "Driving Moccasins",
  "Denim Shorts",
  "Henley Shirt",
  "Parka Coat",
  "Leather Card Holder",
  "Linen Trousers",
  "Track Jacket",
  "Wool Hat",
  "Casual Loafers",
  "Striped Shirt",
  "Workout Pants",
  "Shearling Jacket",
  "Cotton Pocket Square",
  "Suede Boots",
  "Button-Down Shirt",
  "Sweatpants",
  "Peacoat",
  "Nylon Belt",
  "High-Top Sneakers",
  "Long Sleeve Tee",
  "Cargo Shorts",
  "Quilted Vest",
  "Leather Key Holder",
  "Flannel Shirt",
  "Running Shorts",
  "Down Jacket",
  "Knit Scarf",
  "Suede Loafers",
  "Pima Cotton Polo",
  "Jogger Pants",
  "Wool Coat",
  "Fabric Wallet",
];

const categories = [
  "Tops",
  "Bottoms",
  "Outerwear",
  "Footwear",
  "Accessories",
  "Activewear",
];

const adjectives = [
  "Premium",
  "Essential",
  "Classic",
  "Modern",
  "Urban",
  "Comfort",
  "Stylish",
  "Relaxed",
  "Elegant",
  "Vintage",
];

const sizeOptions = ["S", "M", "L", "XL"];

const algeriaWilayas = [
  { name: "Alger", htmlName: "Alger", deliveryCost: 2 },
  { name: "Oran", htmlName: "Oran", deliveryCost: 3 },
  { name: "Constantine", htmlName: "Constantine", deliveryCost: 4 },
  { name: "Annaba", htmlName: "Annaba", deliveryCost: 3 },
  { name: "Blida", htmlName: "Blida", deliveryCost: 2 },
  { name: "Batna", htmlName: "Batna", deliveryCost: 4 },
  { name: "Djelfa", htmlName: "Djelfa", deliveryCost: 5 },
  { name: "Sétif", htmlName: "Sétif", deliveryCost: 4 },
  { name: "Béjaïa", htmlName: "Béjaïa", deliveryCost: 4 },
  { name: "Tlemcen", htmlName: "Tlemcen", deliveryCost: 5 },
  { name: "Tiaret", htmlName: "Tiaret", deliveryCost: 4 },
  { name: "Rabigh", htmlName: "Rabigh", deliveryCost: 5 },
  { name: "Mostaganem", htmlName: "Mostaganem", deliveryCost: 3 },
  { name: "Biskra", htmlName: "Biskra", deliveryCost: 5 },
  { name: "Béchar", htmlName: "Béchar", deliveryCost: 6 },
  { name: "Tizi Ouzou", htmlName: "Tizi Ouzou", deliveryCost: 4 },
  { name: "Sidi Bel Abbès", htmlName: "Sidi Bel Abbès", deliveryCost: 4 },
  { name: "Guelma", htmlName: "Guelma", deliveryCost: 3 },
  { name: "Relizane", htmlName: "Relizane", deliveryCost: 3 },
  { name: "Mascara", htmlName: "Mascara", deliveryCost: 3 },
];

const firstNames = [
  "Mohamed",
  "Ahmed",
  "Ali",
  "Youssef",
  "Ibrahim",
  "Omar",
  "Khalid",
  "Rachid",
  "Yassine",
  "Karim",
  "Amine",
  "Hamza",
  "Sofiane",
  "Nabil",
  "Bilal",
  "Abdelkader",
  "Malik",
  "Riyad",
  "Anas",
  "Mehdi",
  "Fares",
  "Ismail",
  "Zakaria",
  "Adel",
  "Nasser",
  "Tarek",
  "Walid",
  "Hichem",
  "Rami",
  "Abdelhak",
  "Saad",
  "Mounir",
  "Fouad",
  "Samir",
  "Kamel",
  "Mourad",
  "Abdallah",
  "Khaled",
  "Bachir",
  "Mansour",
  "Lamine",
  "Hakim",
  "Moustapha",
  "Mahdi",
  "Habib",
  "Jamel",
  "Arslane",
  "Farid",
  "Nadir",
  "Djamal",
  "Hassen",
  "Salah",
  "Fodil",
  "Redouane",
  "Toufik",
  "Larbi",
  "Hocine",
  "Mokhtar",
  "Brahim",
  "Abderrahmane",
  "Chakib",
  "Madjid",
  "Abdelkrim",
  "Fatima",
  "Aicha",
  "Nadia",
  "Amina",
  "Leila",
  "Samia",
  "Hakima",
  "Naima",
  "Zohra",
  "Rachida",
  "Djamila",
  "Malika",
  "Nawel",
  "Rima",
  "Asma",
  "Hanane",
  "Wafa",
  "Sonia",
  "Sarah",
  "Salima",
  "Khadidja",
  "Nassima",
  "Yasmina",
  "Souad",
  "Meriem",
  "Hafsa",
  "Linda",
  "Ikram",
  "Insaf",
  "Sabrina",
  "Rania",
  "Lina",
  "Mona",
  "Fadila",
  "Hassiba",
  "Djohar",
  "Kaouther",
  "Zineb",
];

const lastNames = [
  "Bensalah",
  "Bouzid",
  "Amrani",
  "Belhadj",
  "Bensalem",
  "Bougherara",
  "Boulahia",
  "Bourouba",
  "Bouzidi",
  "Brahimi",
  "Chaabane",
  "Chabane",
  "Chaouch",
  "Chellali",
  "Cherif",
  "Dali",
  "Djebbar",
  "Djebbari",
  "Djelloul",
  "Ghanem",
  "Guerfi",
  "Haddad",
  "Haddadi",
  "Haddou",
  "Hadj",
  "Hadjadj",
  "Hadjeb",
  "Hadjem",
  "Hadjidj",
  "Hadjoudj",
  "Hakem",
  "Kaci",
  "Kadri",
  "Kessouri",
  "Khaldi",
  "Khellaf",
  "Khelifi",
  "Khelil",
  "Kherbouche",
  "Lamri",
  "Latrache",
  "Maamar",
  "Maarouf",
  "Madi",
  "Mahdi",
  "Mahfoud",
  "Mansouri",
  "Maoui",
  "Maouche",
  "Mebarkia",
  "Mebarki",
  "Mekki",
  "Merad",
  "Merabet",
  "Meraghni",
  "Meziane",
  "Mokrani",
  "Mokhtari",
  "Moulai",
  "Mouloud",
  "Moussaoui",
  "Nacer",
  "Nasri",
  "Nedjar",
  "Nekkal",
  "Ouali",
  "Ould",
  "Rahal",
  "Rahali",
  "Rahmani",
  "Rezgui",
  "Saad",
  "Saadi",
  "Said",
  "Saker",
  "Salhi",
  "Sellami",
  "Slimane",
  "Slimani",
  "Talbi",
  "Taleb",
  "Tebboune",
  "Touati",
  "Yahi",
  "Yahia",
  "Yahiaoui",
  "Yousfi",
  "Zerrouki",
  "Ziani",
  "Zidane",
  "Zitouni",
  "Zoubir",
  "Zouiri",
  "Zerrouk",
  "Zaidi",
];

const addressesData = [
  "123 Rue Didouche Mourad, Alger",
  "456 Avenue des Fêtes, Oran",
  "789 Boulevard de la Soukaina, Constantine",
  "321 Rue de la Liberté, Annaba",
  "654 Avenue de la Victoire, Blida",
  "987 Rue du 1er Novembre, Batna",
  "147 Rue Pasteur, Djelfa",
  "258 Boulevard Aïn Allah, Sétif",
  "369 Rue des Frères Bouadou, Béjaïa",
  "741 Avenue Mohamed V, Tlemcen",
  "852 Rue Mustapha Benboulaid, Tiaret",
  "963 Rue Khemisti, Rabigh",
  "159 Rue Leroux, Mostaganem",
  "357 Avenue Colonel Lotfi, Biskra",
  "753 Rue du Marché, Béchar",
  "159 Rue de la Palme, Tizi Ouzou",
  "951 Rue de la Gare, Sidi Bel Abbès",
  "246 Rue de la Santé, Guelma",
  "357 Boulevard 8 Mai 1945, Relizane",
  "468 Rue de la Résistance, Mascara",
];

const orderStatuses = ["pending", "confirmed", "denied"] as const;

const generatePhoneNumber = () => {
  const prefix = Math.floor(Math.random() * 5) + 213;
  const suffix = Math.floor(Math.random() * 100000000);
  return prefix * 100000000 + suffix;
};

const generateDescription = (name: string) => {
  return `High-quality ${name.toLowerCase()} made with premium materials. Perfect for everyday wear with exceptional comfort and durability.`;
};

function getRandomQuantity(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export const seed = internalMutation({
  handler: async (ctx): Promise<void> => {
    const db = ctx.db;
    const dayMs = 24 * 60 * 60 * 1000;
    const now = Date.now();

    console.log("Starting unified seed...");

    console.log("Deleting existing data...");
    await deleteAllPaginated(db, "saleItems");
    await deleteAllPaginated(db, "sales");
    await deleteAllPaginated(db, "skus");
    await deleteAllPaginated(db, "variantOptions");
    await deleteAllPaginated(db, "variants");
    await deleteAllPaginated(db, "customers");
    await deleteAllPaginated(db, "addresses");
    await deleteAllPaginated(db, "wilayat");
    await deleteAllPaginated(db, "products");
    await deleteAllPaginated(db, "categories");

    console.log("Creating categories...");
    const categoryIds: Id<"categories">[] = [];
    for (const catName of categories) {
      const catId = await db.insert("categories", {
        name: catName,
        storeId: STORE_ID,
      });
      categoryIds.push(catId);
    }

    console.log("Creating products with inventory...");
    const productIds: Id<"products">[] = [];

    for (let i = 0; i < 80; i++) {
      const title = productNames[i];
      const adjective = adjectives[i % adjectives.length];
      const fullTitle = `${adjective} ${title}`;

      const basePrice = getRandomQuantity(20, 220);
      const cost = Math.floor(basePrice * 0.4);
      const hasDiscount = Math.random() > 0.7;
      const discount = hasDiscount ? getRandomQuantity(10, 40) : undefined;
      const oldPrice = hasDiscount
        ? Math.floor(basePrice * (1 + discount! / 100))
        : undefined;

      const categoryId = categoryIds[i % categoryIds.length];

      const productId = await db.insert("products", {
        storeId: STORE_ID,
        title: fullTitle,
        desc: generateDescription(title),
        categoryId,
        price: basePrice,
        cost,
        status: "active",
        discount,
        oldPrice,
        stockingStrategy: "by_variants",
        collections: [],
      });
      productIds.push(productId);
    }

    console.log("Creating variants, options, and SKUs for all products...");

    const skuIds: Id<"skus">[] = [];
    for (let i = 0; i < 80; i++) {
      const productId = productIds[i];

      const variantId = await db.insert("variants", {
        productId,
        name: "Size",
        order: 0,
      });

      const variantOptionIds: Id<"variantOptions">[] = [];
      for (let j = 0; j < sizeOptions.length; j++) {
        const optionId = await db.insert("variantOptions", {
          variantId,
          order: j,
          name: sizeOptions[j],
        });
        variantOptionIds.push(optionId);
      }

      let quantity: number;
      if (i < 3) {
        quantity = getRandomQuantity(5, 15);
      } else if (i < 8) {
        quantity = getRandomQuantity(50, 100);
      } else {
        quantity = getRandomQuantity(20, 80);
      }

      for (const optionId of variantOptionIds) {
        const skuId = await db.insert("skus", {
          productId,
          quantity,
          options: [optionId],
        });
        skuIds.push(skuId);
      }
    }

    console.log("Creating wilayat...");
    const wilayaIds: Id<"wilayat">[] = [];
    for (const w of algeriaWilayas) {
      const id = await db.insert("wilayat", w);
      wilayaIds.push(id);
    }

    console.log("Creating customers and addresses...");
    const customerIds: Id<"customers">[] = [];
    const addressIds: Id<"addresses">[] = [];

    for (let i = 0; i < 300; i++) {
      const firstName = firstNames[i % firstNames.length];
      const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
      const addressIndex = i % addressesData.length;
      const wilayaIndex = i % wilayaIds.length;

      const addressId = await db.insert("addresses", {
        wilayaId: wilayaIds[wilayaIndex],
        address: addressesData[addressIndex],
      });
      addressIds.push(addressId);

      const customerId = await db.insert("customers", {
        storeId: STORE_ID,
        firstName,
        lastName,
        phoneNumber: generatePhoneNumber(),
        latestAddressId: addressId,
      });
      customerIds.push(customerId);
    }

    const insertSaleWithItems = async ({
      createdAt,
      source,
      status,
      customerId,
      addressId,
      deliveryCost,
      items,
      shippingStatus,
    }: {
      createdAt: number;
      source: "online" | "in_store";
      status: "pending" | "confirmed" | "denied";
      customerId?: Id<"customers">;
      addressId?: Id<"addresses">;
      deliveryCost: number;
      items: {
        quantity: number;
        productId: Id<"products">;
        skuId: Id<"skus">;
        price: number;
        cost?: number;
      }[];
      shippingStatus?:
        | "pending"
        | "prepared"
        | "shipped"
        | "delivered"
        | "returned";
    }) => {
      const subTotalCost = items.reduce(
        (acc, item) => acc + item.price * item.quantity,
        0,
      );

      const saleId = await db.insert("sales", {
        storeId: STORE_ID,
        createdAt,
        source,
        status,
        shippingStatus,
        customerId,
        addressId,
        deliveryCost,
        subTotalCost,
      });

      for (const item of items) {
        await db.insert("saleItems", {
          saleId,
          storeId: STORE_ID,
          createdAt,
          quantity: item.quantity,
          productId: item.productId,
          skuId: item.skuId,
          price: item.price,
          cost: item.cost,
        });
      }
    };

    console.log("Creating online commandes...");
    const monthsIn3Years = 36;
    const ordersPerMonth = 80;
    const monthDistribution = [
      1.0, 0.9, 1.0, 1.0, 1.1, 1.2, 0.8, 0.9, 1.0, 1.3, 1.5, 1.6,
    ];

    const threeYearsAgo = now - 3 * 365 * dayMs;
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

        const numItems = getRandomQuantity(1, 3);
        const orderItems: {
          quantity: number;
          productId: Id<"products">;
          skuId: Id<"skus">;
          price: number;
          cost?: number;
        }[] = [];

        let subTotalCost = 0;
        const usedProductIndices = new Set<number>();

        for (let j = 0; j < numItems; j++) {
          let productIndex: number;
          do {
            productIndex = Math.floor(Math.random() * productIds.length);
          } while (
            usedProductIndices.has(productIndex) &&
            usedProductIndices.size < productIds.length
          );
          usedProductIndices.add(productIndex);

          const productIdx = productIds[productIndex];
          const quantity = getRandomQuantity(1, 3);
          const price = getRandomQuantity(20, 220);
          const cost = Math.floor(price * 0.4);
          const skuId = skuIds[Math.floor(Math.random() * skuIds.length)];

          orderItems.push({
            quantity,
            productId: productIdx,
            skuId,
            price,
            cost,
          });

          subTotalCost += cost * quantity;
        }

        const wilayaIndex = Math.floor(Math.random() * wilayaIds.length);
        const deliveryCost = algeriaWilayas[wilayaIndex].deliveryCost;
        const status =
          orderStatuses[Math.floor(Math.random() * orderStatuses.length)];

        const orderTimeMs = Math.floor(
          monthStart + Math.random() * (monthEnd - monthStart),
        );

        await insertSaleWithItems({
          createdAt: orderTimeMs,
          source: "online",
          status,
          shippingStatus: "pending",
          customerId,
          addressId,
          deliveryCost,
          items: orderItems,
        });

        ordersCreated++;
      }
    }

    console.log(`Seeded ${ordersCreated} online commandes`);

    console.log("Creating sales with dead stock distribution...");
    const numProducts = productIds.length;
    const deadStockProducts30 = Math.floor(numProducts * 0.15);
    const deadStockProducts60 = Math.floor(numProducts * 0.1);
    const deadStockProducts90 = Math.floor(numProducts * 0.05);
    const recentProductsCount =
      numProducts -
      deadStockProducts30 -
      deadStockProducts60 -
      deadStockProducts90;

    const deadStock30Products = productIds.slice(0, deadStockProducts30);
    const deadStock60Products = productIds.slice(
      deadStockProducts30,
      deadStockProducts30 + deadStockProducts60,
    );
    const deadStock90Products = productIds.slice(
      deadStockProducts30 + deadStockProducts60,
      deadStockProducts30 + deadStockProducts60 + deadStockProducts90,
    );
    const recentSalesProducts = productIds.slice(
      deadStockProducts30 + deadStockProducts60 + deadStockProducts90,
    );

    const ninetyDaysAgo = now - 90 * dayMs;
    const sixtyDaysAgo = now - 60 * dayMs;
    const thirtyDaysAgo = now - 30 * dayMs;

    const salesPerMonth = 100;
    let salesCreated = 0;

    for (let month = 0; month < monthsIn3Years; month++) {
      const baseMonth = month % 12;
      const multiplier = monthDistribution[baseMonth];
      const salesThisMonth = Math.floor(salesPerMonth * multiplier);

      const monthStart = threeYearsAgo + month * msPerMonth;
      const monthEnd = monthStart + msPerMonth;

      for (let s = 0; s < salesThisMonth; s++) {
        const numItems = getRandomQuantity(1, 4);
        const saleItems: {
          quantity: number;
          productId: Id<"products">;
          skuId: Id<"skus">;
          price: number;
          cost?: number;
        }[] = [];

        let subTotalCost = 0;
        const usedProductIndices = new Set<number>();

        for (let j = 0; j < numItems; j++) {
          let productIndex: number;
          do {
            productIndex = Math.floor(
              Math.random() * recentSalesProducts.length,
            );
          } while (
            usedProductIndices.has(productIndex) &&
            usedProductIndices.size < recentSalesProducts.length
          );
          usedProductIndices.add(productIndex);

          const productId = recentSalesProducts[productIndex];
          const quantity = getRandomQuantity(1, 3);
          const priceVariation = 0.9 + Math.random() * 0.2;
          const price = Math.floor(getRandomQuantity(20, 220) * priceVariation);
          const cost = Math.floor(price * 0.4);

          saleItems.push({
            quantity,
            productId,
            skuId: skuIds[Math.floor(Math.random() * skuIds.length)],
            price,
            cost,
          });

          subTotalCost += cost * quantity;
        }

        const saleTimeMs = Math.floor(
          monthStart + Math.random() * (monthEnd - monthStart),
        );

        await insertSaleWithItems({
          createdAt: saleTimeMs,
          source: "in_store",
          status: "confirmed",
          deliveryCost: 0,
          items: saleItems,
        });

        salesCreated++;
      }
    }

    for (const productId of deadStock90Products) {
      const lastSaleTime =
        ninetyDaysAgo + Math.floor(Math.random() * 30 * dayMs);
      const price = getRandomQuantity(20, 220);
      const cost = Math.floor(price * 0.4);

      await insertSaleWithItems({
        createdAt: lastSaleTime,
        source: "in_store",
        status: "confirmed",
        deliveryCost: 0,
        items: [
          {
            productId,
            skuId: skuIds[Math.floor(Math.random() * skuIds.length)],
            quantity: 1,
            price,
            cost,
          },
        ],
      });
    }

    for (const productId of deadStock60Products) {
      const lastSaleTime =
        sixtyDaysAgo + Math.floor(Math.random() * 30 * dayMs);
      const price = getRandomQuantity(20, 220);
      const cost = Math.floor(price * 0.4);

      await insertSaleWithItems({
        createdAt: lastSaleTime,
        source: "in_store",
        status: "confirmed",
        deliveryCost: 0,
        items: [
          {
            productId,
            skuId: skuIds[Math.floor(Math.random() * skuIds.length)],
            quantity: 1,
            price,
            cost,
          },
        ],
      });
    }

    for (const productId of deadStock30Products) {
      const lastSaleTime =
        thirtyDaysAgo + Math.floor(Math.random() * 30 * dayMs);
      const price = getRandomQuantity(20, 220);
      const cost = Math.floor(price * 0.4);

      await insertSaleWithItems({
        createdAt: lastSaleTime,
        source: "in_store",
        status: "confirmed",
        deliveryCost: 0,
        items: [
          {
            productId,
            skuId: skuIds[Math.floor(Math.random() * skuIds.length)],
            quantity: 1,
            price,
            cost,
          },
        ],
      });
    }

    console.log(
      "Adding recent sales for critical/warning products (last 30 days)...",
    );
    const criticalProducts = productIds.slice(0, 3);
    const warningProducts = productIds.slice(3, 8);

    for (let dayOffset = 0; dayOffset < 30; dayOffset++) {
      const saleDate = thirtyDaysAgo + dayOffset * dayMs;

      for (const productId of [...criticalProducts, ...warningProducts]) {
        const isCritical = criticalProducts.includes(productId);
        const dailyQty = isCritical
          ? getRandomQuantity(2, 4)
          : getRandomQuantity(1, 2);

        const randomHour = Math.floor(Math.random() * 24);
        const saleTime = saleDate + randomHour * 60 * 60 * 1000;
        const price = getRandomQuantity(20, 220);
        const cost = Math.floor(price * 0.4);

        await insertSaleWithItems({
          createdAt: saleTime,
          source: "in_store",
          status: "confirmed",
          deliveryCost: 0,
          items: [
            {
              productId,
              skuId: skuIds[Math.floor(Math.random() * skuIds.length)],
              quantity: dailyQty,
              price,
              cost,
            },
          ],
        });
      }
    }

    console.log(`Seeded ${salesCreated} sales across 3 years`);
    console.log(
      `Dead stock distribution: 30+=${deadStock30Products.length}, 60+=${deadStock60Products.length}, 90+=${deadStock90Products.length}`,
    );

    console.log("Seed complete!");
  },
});
