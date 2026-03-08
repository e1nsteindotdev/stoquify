import { convex } from "@/lib/convex-client";
import { queryCollectionOptions } from "@tanstack/query-db-collection";
import { api } from "api/convex";
import { createCollection, eq } from "@tanstack/db";
import { useLiveQuery } from "@tanstack/react-db";
import { queryClient } from "@/lib/ts-query-client";
import { useAppStore } from "@/lib/store";
import { idbGet, idbRefresh, idbGetCursor, idbSetCursor } from "@/lib/idb";
import { computeNewCursor, mergeRowsWithStoreScope } from "@/lib/cursor-utils";

export const categoriesCollection = createCollection(
  queryCollectionOptions({
    queryKey: () => {
      const storeId = useAppStore.getState().selectedStore?._id;
      return ["categories", storeId];
    },
    queryFn: async (): Promise<any[]> => {
      console.log("[categories] queryFn running");
      const storeId = useAppStore.getState().selectedStore?._id;
      if (!storeId) return [];

      const cursor = await idbGetCursor("categories", storeId);

      try {
        const categories = await convex.query(api.categories.list, {
          storeId,
          cursor: cursor ?? undefined,
        });

        if (categories.length > 0) {
          const newCursor = computeNewCursor(categories);
          await idbSetCursor("categories", newCursor, storeId);
        }

        if (cursor) {
          const cachedCategories = await idbGet<any[]>("categories", storeId);
          const mergedCategories = mergeRowsWithStoreScope(
            categories,
            cachedCategories || [],
            storeId,
          );

          await idbRefresh("categories", mergedCategories, storeId);
          return mergedCategories;
        } else {
          await idbRefresh("categories", categories, storeId);
          return categories;
        }
      } catch (e) {
        const cachedCategories = await idbGet<any[]>("categories", storeId);
        return cachedCategories || [];
      }
    },
    queryClient,
    getKey: (item) => item._id,
    syncMode: "eager",
    staleTime: 0,
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
