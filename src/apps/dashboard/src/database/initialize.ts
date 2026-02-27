import { categoriesCollection } from "./categories";
import { collectionsCollection } from "./collections";
import { productsCollection } from "./products";

export function initializeCollections() {
  productsCollection.preload()
  categoriesCollection.preload()
  collectionsCollection.preload()
}
