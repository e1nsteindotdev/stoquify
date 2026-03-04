import { convex } from "@/lib/convex-client";
import { queryCollectionOptions } from "@tanstack/query-db-collection";
import { api } from "api/convex";
import { createCollection, eq } from "@tanstack/db";
import { useLiveQuery } from "@tanstack/react-db";
import { queryClient } from "@/lib/ts-query-client";
import { useAppStore } from "@/lib/store";
import { idbGet, idbRefresh } from "@/lib/idb";

export const categoriesCollection = createCollection(
  queryCollectionOptions({
    queryKey: () => {
      const storeId = useAppStore.getState().selectedStore?._id;
      return ["categories", storeId];
    },
    queryFn: async (): Promise<any[]> => {
      try {
        const categories = await convex.query(api.categories.listCategories);
        idbRefresh("categories", categories);
        return categories;
      } catch (e) {
        const cachedCategories = await idbGet("categories");
        return Array.isArray(cachedCategories) ? cachedCategories : [];
      }
    },
    queryClient,
    getKey: (item) => item._id,
    syncMode: "eager",
  }),
);

export const useGetCategories = (storeId?: string) => {
  const currentStoreId = useAppStore((state) => state.selectedStore?._id);
  const effectiveStoreId = storeId ?? currentStoreId;
  return useLiveQuery((q) =>
    q
      .from({ categories: categoriesCollection })
      .where(({ categories }) => eq(categories.storeId, effectiveStoreId)),
  );
};
