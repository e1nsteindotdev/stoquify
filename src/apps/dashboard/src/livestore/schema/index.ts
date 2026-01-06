import { makeSchema, signal, State } from "@livestore/livestore";
import { authEvents, authTables, authMaterializers } from "./auth";
import { ordersEvents, ordersMaterializers, ordersTable } from "./orders";
import * as products from "./products";
import {
  notificationEvents,
  notificationMaterializers,
  notificationsTable,
} from "./notifications";

export const tables = {
  organizations: authTables.organizationsTable,
  users: authTables.usersTable,
  shops: authTables.shopsTable,
  orders: ordersTable,
  products: products.productsTable,
  categories: products.categoriesTable,
  productImages: products.productImagesTable,
  variants: products.variantsTable,
  variantOptions: products.variantOptionsTable,
  skus: products.skusTable,
  skuOptions: products.skuOptionsTable,
  collections: products.collectionsTable,
  collectionProducts: products.collectionProductsTable,
  notifications: notificationsTable,
};

export const events = {
  ...authEvents,
  ...ordersEvents,
  ...products.productEvents,
  ...notificationEvents,
};

export const materializers = {
  ...authMaterializers,
  ...ordersMaterializers,
  ...products.productMaterializers,
  ...notificationMaterializers,
};

export const shopId$ = signal("random-shop-id", { label: "shopId" });

const state = State.SQLite.makeState({ tables, materializers });
export const schema = makeSchema({ events, state });

export const categories$ = products.categories$;
export const collections$ = products.collections$;
export const productImages$ = products.productImages$;
export const products$ = products.products$;
export const variants$ = products.variants$;
