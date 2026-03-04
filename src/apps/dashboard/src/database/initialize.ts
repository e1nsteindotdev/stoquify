import { categoriesCollection } from "./categories";
import { collectionsCollection } from "./collections";
import { productsCollection } from "./products";
import { ordersCollection } from "./orders";
import { customersCollection } from "./customers";
import { salesCollection } from "./sales";
import { queryClient } from "@/lib/ts-query-client";

export function preloadAllCollections() {
  productsCollection.preload();
  categoriesCollection.preload();
  collectionsCollection.preload();
  ordersCollection.preload();
  customersCollection.preload();
  salesCollection.preload();
}

export function setCollectionsData({
  analytics,
  categories,
  collections,
  customers,
  expenses,
  faqs,
  orders,
  products,
  sales,
  settings,
  user,
  users,
  stores,
  selectedStoreId,
}) {
  const storeScopedKeys = selectedStoreId
    ? [
        ["products", selectedStoreId],
        ["categories", selectedStoreId],
        ["collections", selectedStoreId],
        ["sales", selectedStoreId],
        ["expenses", selectedStoreId],
      ]
    : [];

  queryClient.setQueryData(["analytics"], analytics);
  queryClient.setQueryData(["categories"], categories);
  queryClient.setQueryData(["collections"], collections);
  queryClient.setQueryData(["customers"], customers);
  queryClient.setQueryData(["expenses"], expenses);
  queryClient.setQueryData(["faqs"], faqs);
  queryClient.setQueryData(["orders"], orders);
  queryClient.setQueryData(["products"], products);
  queryClient.setQueryData(["sales"], sales);
  queryClient.setQueryData(["settings"], settings);
  queryClient.setQueryData(["user"], user);
  queryClient.setQueryData(["users"], users);
  queryClient.setQueryData(["stores"], stores);

  for (const queryKey of storeScopedKeys) {
    const [collectionName] = queryKey;
    if (collectionName === "products")
      queryClient.setQueryData(queryKey, products);
    if (collectionName === "categories")
      queryClient.setQueryData(queryKey, categories);
    if (collectionName === "collections")
      queryClient.setQueryData(queryKey, collections);
    if (collectionName === "sales") queryClient.setQueryData(queryKey, sales);
    if (collectionName === "expenses")
      queryClient.setQueryData(queryKey, expenses);
  }
}
