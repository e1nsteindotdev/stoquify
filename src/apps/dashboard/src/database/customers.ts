import { convex } from "@/lib/convex-client";
import { queryCollectionOptions } from "@tanstack/query-db-collection";
import { api } from "api/convex";
import { createCollection } from "@tanstack/db";
import { useLiveQuery } from "@tanstack/react-db";
import { useQuery } from "@tanstack/react-query";
import { queryClient } from "@/lib/ts-query-client";
import type { Id } from "api/data-model";
import { idbGet, idbRefresh } from "@/lib/idb";

export const customersCollection = createCollection(
  queryCollectionOptions({
    queryKey: ["customers"],
    queryFn: async (): Promise<any[]> => {
      try {
        const customers = await convex.query(api.customers.listCustomers);
        idbRefresh("customers", customers);
        return customers;
      } catch (e) {
        const cachedCustomers = await idbGet("customers");
        return Array.isArray(cachedCustomers) ? cachedCustomers : [];
      }
    },
    queryClient,
    getKey: (item) => item._id,
    syncMode: "eager",
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
        return await convex.query(api.customers.getCustomer, { customerId });
      } catch (e) {
        const cachedCustomers = await idbGet("customers");
        if (!Array.isArray(cachedCustomers)) return null;
        return (
          cachedCustomers.find(
            (customer: any) => String(customer._id) === String(customerId),
          ) ?? null
        );
      }
    },
    enabled: !!customerId,
  });
};
