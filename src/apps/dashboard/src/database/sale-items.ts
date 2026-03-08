import { convex } from "@/lib/convex-client";
import { queryCollectionOptions } from "@tanstack/query-db-collection";
import { api } from "api/convex";
import { createCollection } from "@tanstack/db";
import { queryClient } from "@/lib/ts-query-client";
import { useAppStore } from "@/lib/store";
import { idbGet, idbRefresh } from "@/lib/idb";

export const saleItemsCollection = createCollection(
  queryCollectionOptions({
    queryKey: () => {
      const storeId = useAppStore.getState().selectedStore?._id;
      return ["saleItems", storeId];
    },
    queryFn: async () => {
      console.log("[saleItems] queryFn running");
      const storeId = useAppStore.getState().selectedStore?._id;
      if (!storeId) return [];

      try {
        const saleItems = await convex.query(api.sales.listSaleItems, {
          storeId,
        });

        await idbRefresh("saleItems", saleItems, storeId);
        return saleItems;
      } catch (e) {
        const cachedSaleItems = await idbGet<any[]>("saleItems", storeId);
        return cachedSaleItems || [];
      }
    },
    queryClient: queryClient,
    getKey: (item: any) => item._id,
    syncMode: "eager",
    staleTime: 0,
  }),
);
