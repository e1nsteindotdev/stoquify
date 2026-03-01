import { categoriesCollection } from "./categories";
import { collectionsCollection } from "./collections";
import { productsCollection } from "./products";
import { ordersCollection } from "./orders";
import { customersCollection } from "./customers";
import { salesCollection } from "./sales";

export function initializeCollections() {
  productsCollection.preload();
  categoriesCollection.preload();
  collectionsCollection.preload();
  ordersCollection.preload();
  customersCollection.preload();
  salesCollection.preload();
}
