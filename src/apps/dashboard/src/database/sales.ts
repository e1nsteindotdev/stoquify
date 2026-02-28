import { convex } from "@/lib/convex-client";
import { queryCollectionOptions } from "@tanstack/query-db-collection";
import { api } from "api/convex";
import { createCollection } from "@tanstack/db";
import { useLiveQuery } from "@tanstack/react-db";
import { queryClient } from "@/lib/ts-query-client";
import { useAppStore } from "@/lib/store";

export const salesCollection = createCollection(
  queryCollectionOptions({
    queryKey: ["sales"],
    queryFn: async (ctx) => {
      const storeId = useAppStore.getState().selectedStore?._id;
      if (!storeId) return [];
      const sales = await convex.query((api.sales as any).listSales, {
        storeId,
      });
      return sales;
    },
    queryClient: queryClient,
    getKey: (item: any) => item._id,
    syncMode: "eager",
  }),
);

export const useGetSales = () => {
  return useLiveQuery((q) => q.from({ sales: salesCollection }));
};
