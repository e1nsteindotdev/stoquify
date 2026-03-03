import { convex } from "@/lib/convex-client";
import { queryCollectionOptions } from "@tanstack/query-db-collection";
import { api } from "api/convex";
import { createCollection } from "@tanstack/db";
import { useLiveQuery } from "@tanstack/react-db";
import { convexQuery } from "@convex-dev/react-query";
import { useQuery } from "@tanstack/react-query";
import { queryClient } from "@/lib/ts-query-client";
import type { Id } from "api/data-model";

export const customersCollection = createCollection(
  queryCollectionOptions({
    queryKey: ["customers"],
    queryFn: async (ctx) => {
      const customers = await convex.query(api.customers.listCustomers);
      return customers;
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
      return await convex.query(api.customers.getCustomer, { customerId });
    },
    enabled: !!customerId,
  });
};
