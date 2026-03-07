import { convex } from "@/lib/convex-client";
import { queryCollectionOptions } from "@tanstack/query-db-collection";
import { api } from "api/convex";
import { createCollection } from "@tanstack/db";
import { useLiveQuery } from "@tanstack/react-db";
import { queryClient } from "@/lib/ts-query-client";
import { useAppStore } from "@/lib/store";
import { idbGet, idbRefresh, idbGetCursor, idbSetCursor } from "@/lib/idb";
import { computeNewCursor, mergeRowsWithStoreScope } from "@/lib/cursor-utils";
import { useQuery } from "@tanstack/react-query";
import type { Id } from "api/data-model";

export const salesCollection = createCollection(
  queryCollectionOptions({
    queryKey: () => {
      const storeId = useAppStore.getState().selectedStore?._id;
      return ["sales", storeId];
    },
    queryFn: async (): Promise<any[]> => {
      const storeId = useAppStore.getState().selectedStore?._id;
      if (!storeId) return [];

      const cursor = await idbGetCursor("sales", storeId);

      try {
        const sales = await convex.query(api.sales.list, {
          storeId,
          cursor: cursor ?? undefined,
        });

        const cachedSales = await idbGet<any[]>("sales", storeId);
        const mergedSales = mergeRowsWithStoreScope(
          sales,
          cachedSales || [],
          storeId,
        );

        await idbRefresh("sales", mergedSales, storeId);

        if (sales.length > 0) {
          const newCursor = computeNewCursor(sales);
          await idbSetCursor("sales", newCursor, storeId);
        }

        return mergedSales;
      } catch (e) {
        const cachedSales = await idbGet<any[]>("sales", storeId);
        return cachedSales || [];
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

export const useGetSalesBySource = (source: "online" | "in_store") => {
  const result = useGetSales();
  return {
    ...result,
    data: (result.data ?? []).filter((sale: any) => sale.source === source),
  };
};

export const useGetSaleById = (saleId: Id<"sales"> | undefined) => {
  return useQuery({
    queryKey: ["sale", saleId],
    queryFn: async () => {
      if (!saleId) return null;
      try {
        return await convex.query(api.sales.get, { saleId });
      } catch (e) {
        const storeId = useAppStore.getState().selectedStore?._id;
        const cachedSales = await idbGet<any[]>("sales", storeId);
        if (!cachedSales) return null;
        return (
          cachedSales.find((sale) => String(sale._id) === String(saleId)) ??
          null
        );
      }
    },
    enabled: !!saleId,
  });
};
