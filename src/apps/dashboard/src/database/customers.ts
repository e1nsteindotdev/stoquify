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

export const customersCollection = createCollection(
  queryCollectionOptions({
    queryKey: () => {
      const storeId = useAppStore.getState().selectedStore?._id;
      return ["customers", storeId];
    },
    queryFn: async (): Promise<any[]> => {
      console.log("[customers] queryFn running");
      const storeId = useAppStore.getState().selectedStore?._id;
      if (!storeId) return [];

      try {
        const customers = await convex.query(api.customers.list, {
          storeId,
        });

        await idbRefresh("customers", customers, storeId);
        return customers;
      } catch (e) {
        const cachedCustomers = await idbGet<any[]>("customers", storeId);
        return cachedCustomers || [];
      }
    },
    queryClient,
    getKey: (item) => item._id,
    syncMode: "eager",
    staleTime: 0,
  }),
);

export const useGetCustomers = () => {
  return useLiveQuery((q) => q.from({ customers: customersCollection }));
};

export const useGetCustomerById = (customerId: Id<"customers"> | undefined) => {
  return useQuery({
    queryKey: ["customer", customerId],
    queryFn: async () => {
      if (!customerId) return null;
      try {
        return await convex.query(api.customers.get, { customerId });
      } catch (e) {
        const storeId = useAppStore.getState().selectedStore?._id;
        const cachedCustomers = await idbGet<any[]>("customers", storeId);
        if (!cachedCustomers) return null;
        return (
          cachedCustomers.find(
            (customer) => String(customer._id) === String(customerId),
          ) ?? null
        );
      }
    },
    enabled: !!customerId,
  });
};
