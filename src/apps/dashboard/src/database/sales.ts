import { convex } from "@/lib/convex-client";
import { queryCollectionOptions } from "@tanstack/query-db-collection";
import { api } from "api/convex";
import { createCollection } from "@tanstack/db";
import { useLiveQuery } from "@tanstack/react-db";
import { queryClient } from "@/lib/ts-query-client";
import { useAppStore } from "@/lib/store";
import { idbGet, idbRefresh } from "@/lib/idb";

export const salesCollection = createCollection(
  queryCollectionOptions({
    queryKey: () => {
      const storeId = useAppStore.getState().selectedStore?._id;
      return ["sales", storeId];
    },
    queryFn: async (): Promise<any[]> => {
      console.log("[sales] queryFn running");
      const storeId = useAppStore.getState().selectedStore?._id;
      if (!storeId) return [];
      try {
        const sales = await convex.query((api.sales as any).listSales);
        idbRefresh("sales", sales);
        return sales;
      } catch (e) {
        const cachedSales = await idbGet("sales");
        return Array.isArray(cachedSales) ? cachedSales : [];
      }
    },
    queryClient: queryClient,
    getKey: (item: any) => item._id,
    syncMode: "eager",
    staleTime: 24 * 60 * 60 * 1000,
  }),
);

export const useGetSales = () => {
  return useLiveQuery((q) => q.from({ sales: salesCollection }));
};
