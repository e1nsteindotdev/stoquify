import { categoriesCollection } from "./categories";
import { collectionsCollection } from "./collections";
import { productsCollection } from "./products";
import { ordersCollection } from "./orders";
import { customersCollection } from "./customers";
import { salesCollection } from "./sales";
import { queryClient } from "@/lib/ts-query-client";
import { expensesCollection } from "./expenses";
import { storesCollection } from "./stores";
import { settingsCollection } from "./settings";
import { expenseCategoriesCollection } from "./expense-categories";
import { faqsCollection } from "./faqs";
import { usersCollection } from "./users";

export function preloadAllCollections(selectedStoreId?: string) {
  console.log("preloading all collections");

  if (selectedStoreId) {
    [
      "products",
      "categories",
      "collections",
      "sales",
      "expenses",
      "expenseCategories",
    ].forEach((key) => {
      queryClient.invalidateQueries({ queryKey: [key, selectedStoreId] });
    });
  }

  ["customers", "orders", "stores", "settings", "faqs", "users"].forEach(
    (key) => {
      queryClient.invalidateQueries({ queryKey: [key] });
    },
  );

  productsCollection.preload();
  categoriesCollection.preload();
  collectionsCollection.preload();
  ordersCollection.preload();
  customersCollection.preload();
  salesCollection.preload();
  expensesCollection.preload();
  storesCollection.preload();
  settingsCollection.preload();
  expenseCategoriesCollection.preload();
  faqsCollection.preload();
  usersCollection.preload();
}

export function setCollectionsData({
  analytics,
  categories,
  collections,
  customers,
  expenses,
  expenseCategories,
  faqs,
  orders,
  products,
  sales,
  settings,
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
        ["expenseCategories", selectedStoreId],
      ]
    : [];

  queryClient.setQueryData(["analytics"], analytics);
  queryClient.setQueryData(
    ["categories"],
    Array.isArray(categories) ? categories : [],
  );
  queryClient.setQueryData(
    ["collections"],
    Array.isArray(collections) ? collections : [],
  );
  queryClient.setQueryData(
    ["customers"],
    Array.isArray(customers) ? customers : [],
  );
  queryClient.setQueryData(
    ["expenses"],
    Array.isArray(expenses) ? expenses : [],
  );
  queryClient.setQueryData(
    ["expenseCategories"],
    Array.isArray(expenseCategories) ? expenseCategories : [],
  );
  queryClient.setQueryData(["faqs"], Array.isArray(faqs) ? faqs : []);
  queryClient.setQueryData(["orders"], Array.isArray(orders) ? orders : []);
  queryClient.setQueryData(
    ["products"],
    Array.isArray(products) ? products : [],
  );
  queryClient.setQueryData(["sales"], Array.isArray(sales) ? sales : []);
  queryClient.setQueryData(
    ["settings"],
    Array.isArray(settings) ? settings : settings ? [settings] : [],
  );
  queryClient.setQueryData(["users"], Array.isArray(users) ? users : []);
  queryClient.setQueryData(["stores"], Array.isArray(stores) ? stores : []);

  for (const queryKey of storeScopedKeys) {
    const [collectionName] = queryKey;
    if (collectionName === "products")
      queryClient.setQueryData(
        queryKey,
        Array.isArray(products) ? products : [],
      );
    if (collectionName === "categories")
      queryClient.setQueryData(
        queryKey,
        Array.isArray(categories) ? categories : [],
      );
    if (collectionName === "collections")
      queryClient.setQueryData(
        queryKey,
        Array.isArray(collections) ? collections : [],
      );
    if (collectionName === "sales")
      queryClient.setQueryData(queryKey, Array.isArray(sales) ? sales : []);
    if (collectionName === "expenses")
      queryClient.setQueryData(
        queryKey,
        Array.isArray(expenses) ? expenses : [],
      );
    if (collectionName === "expenseCategories")
      queryClient.setQueryData(
        queryKey,
        Array.isArray(expenseCategories) ? expenseCategories : [],
      );
  }
}
