import { internalMutation } from "./_generated/server";
import { Id } from "./_generated/dataModel";

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

const generateDescription = (name: string) => {
  return `High-quality ${name.toLowerCase()} made with premium materials. Perfect for everyday wear with exceptional comfort and durability.`;
};

export const seedProducts = internalMutation({
  handler: async (ctx): Promise<void> => {
    const db = ctx.db;

    const existingProducts = await db.query("products").collect();
    for (const product of existingProducts) {
      await db.delete(product._id);
    }

    const existingCategories = await db.query("categories").collect();
    for (const category of existingCategories) {
      await db.delete(category._id);
    }

    const existingStores = await db.query("stores").collect();
    for (const store of existingStores) {
      await db.delete(store._id);
    }

    const existingOrganizations = await db.query("organizations").collect();
    for (const org of existingOrganizations) {
      await db.delete(org._id);
    }

    const organizationId = await db.insert("organizations", {
      name: "Stoquify Store",
    });

    const storeId = await db.insert("stores", {
      name: "Stoquify Main Store",
      organizationId,
    });

    const categoryIds: Id<"categories">[] = [];
    for (const catName of categories) {
      const catId = await db.insert("categories", {
        name: catName,
        storeId,
      });
      categoryIds.push(catId);
    }

    for (let i = 0; i < 80; i++) {
      const title = productNames[i];
      const adjective = adjectives[i % adjectives.length];
      const fullTitle = `${adjective} ${title}`;

      const basePrice = Math.floor(Math.random() * 200) + 20;
      const cost = Math.floor(basePrice * 0.4);
      const hasDiscount = Math.random() > 0.7;
      const discount = hasDiscount
        ? Math.floor(Math.random() * 30) + 10
        : undefined;
      const oldPrice = hasDiscount
        ? Math.floor(basePrice * (1 + discount! / 100))
        : undefined;

      const categoryId = categoryIds[i % categoryIds.length];

      await db.insert("products", {
        storeId,
        title: fullTitle,
        desc: generateDescription(title),
        categoryId,
        price: basePrice,
        cost,
        status: "active",
        discount,
        oldPrice,
        stockingStrategy: "by_demand",
        quantity: Math.floor(Math.random() * 100) + 10,
        collections: [],
      });
    }

    console.log("Seeded 1 store, 6 categories, and 80 products");
  },
});
