import { convex } from "@/lib/convex-client";
import { queryCollectionOptions } from "@tanstack/query-db-collection";
import { api } from "api/convex";
import { createCollection } from "@tanstack/db";
import { useLiveQuery } from "@tanstack/react-db";
import { useQuery } from "@tanstack/react-query";
import { queryClient } from "@/lib/ts-query-client";
import type { Id } from "api/data-model";
import { idbGet, idbRefresh } from "@/lib/idb";

export const ordersCollection = createCollection(
  queryCollectionOptions({
    queryKey: ["orders"],
    queryFn: async (): Promise<any[]> => {
      try {
        const orders = await convex.query(api.order.listOrders);
        idbRefresh("orders", orders);
        return orders;
      } catch (e) {
        const cachedOrders = await idbGet("orders");
        return Array.isArray(cachedOrders) ? cachedOrders : [];
      }
    },
    queryClient,
    getKey: (item) => item._id,
    syncMode: "eager",
  }),
);

export const useGetOrders = () => {
  return useLiveQuery((q) => q.from({ orders: ordersCollection }));
};

export const useGetOrderById = (orderId: Id<"orders"> | undefined) => {
  return useQuery({
    queryKey: ["order", orderId],
    queryFn: async () => {
      if (!orderId) return null;
      try {
        return await convex.query(api.order.getOrder, { orderId });
      } catch (e) {
        const cachedOrders = await idbGet("orders");
        if (!Array.isArray(cachedOrders)) return null;
        return (
          cachedOrders.find(
            (order: any) => String(order._id) === String(orderId),
          ) ?? null
        );
      }
    },
    enabled: !!orderId,
  });
};
