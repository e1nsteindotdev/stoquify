import { convex } from "@/lib/convex-client";
import { idbGet } from "@/lib/idb";
import { useAppStore } from "@/lib/store";
import { useAuthActions } from "@convex-dev/auth/react";
import { api } from "api/convex";
import { useEffect, useState } from "react";
import { useGetUser } from "./use-get-user";
import {
  preloadAllCollections,
  setCollectionsData,
} from "@/database/initialize";
import { TypeUser } from "api/types";

let hasBootstrapped = false;

const normalizeUser = (rawUser: unknown): TypeUser | null => {
  if (!rawUser || Array.isArray(rawUser) || typeof rawUser !== "object") {
    return null;
  }
  return rawUser as TypeUser;
};

export const useInitApp = () => {
  const [initLoading, setInitLoading] = useState(!hasBootstrapped);
  const [authResolved, setAuthResolved] = useState(false);
  const { signOut } = useAuthActions();
  const setUser = useAppStore((state) => state.setUser);
  const { isPending, data: user } = useGetUser();

  useEffect(() => {
    if (hasBootstrapped) return;

    let mounted = true;

    async function init() {
      const [
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
        localUser,
      ] = await Promise.all([
        idbGet("analytics"),
        idbGet("categories"),
        idbGet("collections"),
        idbGet("customers"),
        idbGet("expenses"),
        idbGet("expenseCategories"),
        idbGet("faqs"),
        idbGet("orders"),
        idbGet("products"),
        idbGet("sales"),
        idbGet("settings"),
        idbGet("users"),
        idbGet("stores"),
        idbGet("user"),
      ]);

      const normalizedStores = Array.isArray(stores) ? stores : [];

      if (normalizedStores.length > 0) {
        useAppStore.getState().setStores(normalizedStores);
        const selectedStore = useAppStore.getState().selectedStore;
        if (!selectedStore) {
          useAppStore.getState().setStore(normalizedStores[0]);
        }
      } else {
        try {
          const remoteStores = await convex.query(api.stores.list);
          useAppStore.getState().setStores(remoteStores);
          if (
            !useAppStore.getState().selectedStore &&
            remoteStores.length > 0
          ) {
            useAppStore.getState().setStore(remoteStores[0]);
          }
        } catch (e) {
          useAppStore.getState().setStores([]);
        }
      }

      setCollectionsData({
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
        stores: useAppStore.getState().stores,
        selectedStoreId: useAppStore.getState().selectedStore?._id,
      });

      const selectedStoreId = useAppStore.getState().selectedStore?._id;
      preloadAllCollections(selectedStoreId);

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
    if (isPending) return;

    const normalizedUser = normalizeUser(user);
    if (!normalizedUser) {
      setUser(null);
      signOut();
      setAuthResolved(true);
      return;
    }

    setUser(normalizedUser);
    setAuthResolved(true);
    useAppStore.getState().setInitialized(true);
  }, [isPending]);

  return {
    isLoading: initLoading || !authResolved,
    user,
  };
};
