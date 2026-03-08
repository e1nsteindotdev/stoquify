import { convex } from "@/lib/convex-client";
import { queryCollectionOptions } from "@tanstack/query-db-collection";
import { api } from "api/convex";
import { createCollection } from "@tanstack/db";
import { useLiveQuery } from "@tanstack/react-db";
import { queryClient } from "@/lib/ts-query-client";
import { useAppStore } from "@/lib/store";
import { idbGet, idbRefresh } from "@/lib/idb";
import { useQuery } from "@tanstack/react-query";
import type { Id } from "api/data-model";
import { useMemo } from "react";
import { customersCollection } from "./customers";
import { saleItemsCollection } from "./sale-items";

export const salesCollection = createCollection(
  queryCollectionOptions({
    queryKey: () => {
      const storeId = useAppStore.getState().selectedStore?._id;
      return ["sales", storeId];
    },
    queryFn: async () => {
      const storeId = useAppStore.getState().selectedStore?._id;
      console.log("[sales] queryFn running, ");
      if (!storeId) return [];

      try {
        const sales = await convex.query(api.sales.list, {
          storeId,
        });

        console.log("[sales] queryFn result :", sales);
        await idbRefresh("sales", sales, storeId);
        return sales;
      } catch (e) {
        const cachedSales = await idbGet<any[]>("sales", storeId);
        return cachedSales || [];
      }
    },
    queryClient: queryClient,
    getKey: (item: any) => item._id,
    syncMode: "eager",
    staleTime: 0,
  }),
);

export const useGetSales = () => {
  const salesResult = useLiveQuery((q) => q.from({ sales: salesCollection }));
  const customersResult = useLiveQuery((q) =>
    q.from({ customers: customersCollection }),
  );
  const saleItemsResult = useLiveQuery((q) =>
    q.from({ saleItems: saleItemsCollection }),
  );

  const data = useMemo(() => {
    const sales = salesResult.data || [];
    const customers = customersResult.data || [];
    const saleItems = saleItemsResult.data || [];

    const customerMap = new Map(customers.map((c: any) => [String(c._id), c]));
    const saleItemsMap = new Map<string, any[]>();
    for (const item of saleItems) {
      const items = saleItemsMap.get(String(item.saleId)) || [];
      items.push(item);
      saleItemsMap.set(String(item.saleId), items);
    }

    // Pre-calculate customer order counts based on all sales in current store
    const customerOrderCounts = new Map<string, number>();
    for (const sale of sales) {
      if (sale.customerId) {
        const id = String(sale.customerId);
        customerOrderCounts.set(id, (customerOrderCounts.get(id) || 0) + 1);
      }
    }

    return sales.map((sale: any) => {
      const customer = sale.customerId
        ? customerMap.get(String(sale.customerId))
        : null;
      const items = saleItemsMap.get(String(sale._id)) || [];

      const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
      const profit = items.reduce((sum, item) => {
        const itemCost = item.cost || 0;
        return sum + (item.price - itemCost) * item.quantity;
      }, 0);

      return {
        ...sale,
        customer,
        items,
        itemCount,
        profit,
        customerOrderCount: sale.customerId
          ? customerOrderCounts.get(String(sale.customerId)) || 0
          : 0,
      };
    });
  }, [salesResult.data, customersResult.data, saleItemsResult.data]);

  return {
    ...salesResult,
    isLoading:
      salesResult.isLoading ||
      customersResult.isLoading ||
      saleItemsResult.isLoading,
    isEnabled:
      salesResult.isEnabled &&
      customersResult.isEnabled &&
      saleItemsResult.isEnabled,
    data,
  };
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
