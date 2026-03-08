import { idbGet } from "@/lib/idb";
import { useAppStore } from "@/lib/store";
import { useAuthActions } from "@convex-dev/auth/react";
import { useEffect, useState } from "react";
import { categoriesCollection } from "@/database/categories";
import { productsCollection } from "@/database/products";
import { customersCollection } from "@/database/customers";
import { salesCollection } from "@/database/sales";
import { saleItemsCollection } from "@/database/sale-items";
import { storesCollection } from "@/database/stores";
import { queryClient } from "@/lib/ts-query-client";

let hasBootstrapped = false;

export const useInitApp = () => {
  const [initLoading, setInitLoading] = useState(!hasBootstrapped);
  const [authResolved, setAuthResolved] = useState(false);
  const { signOut } = useAuthActions();
  const user = useAppStore(state => state.user)
  const setInitialized = useAppStore(state => state.setInitialized)

  useEffect(() => {
    if (hasBootstrapped) return;
    let mounted = true;

    async function init() {
      setCollectionsData()
      preloadAllCollections();

      if (!mounted) return;
      hasBootstrapped = true;
      setInitLoading(false);
    }

    init();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!user) signOut();
    if (user) {
      setAuthResolved(true);
      return;
    }
    setInitialized(true);
    setAuthResolved(true);
  }, []);

  return {
    isLoading: initLoading || !authResolved,
    user,
  };
};


export function preloadAllCollections() {
  console.log("preloading all collections");
  productsCollection.preload();
  categoriesCollection.preload();
  customersCollection.preload();
  salesCollection.preload();
  saleItemsCollection.preload();
  storesCollection.preload();
  //usersCollection.preload();
  //collectionsCollection.preload();
  //expensesCollection.preload();
  //settingsCollection.preload();
  //expenseCategoriesCollection.preload();
  //faqsCollection.preload();
}

async function setCollectionsData() {
  const storeId = useAppStore.getState().selectedStore?._id;
  const [
    categories,
    collections,
    customers,
    expenses,
    expenseCategories,
    faqs,
    products,
    sales,
    settings,
    users,
  ] = await Promise.all([
    idbGet("categories"),
    idbGet("collections"),
    idbGet("customers"),
    idbGet("expenses"),
    idbGet("expenseCategories"),
    idbGet("faqs"),
    idbGet("products"),
    idbGet("sales"),
    idbGet("settings"),
    idbGet("users"),
  ]);

  queryClient.setQueryData(["categories", storeId], categories);
  queryClient.setQueryData(["collections", storeId], collections);
  queryClient.setQueryData(["customers", storeId], customers);
  queryClient.setQueryData(["expenses", storeId], expenses);
  queryClient.setQueryData(["expenseCategories", storeId], expenseCategories);
  queryClient.setQueryData(["faqs", storeId], faqs);
  queryClient.setQueryData(["products", storeId], products);
  queryClient.setQueryData(["sales", storeId], sales);
  queryClient.setQueryData(["settings", storeId], settings);
  queryClient.setQueryData(["users", storeId], users);
}
