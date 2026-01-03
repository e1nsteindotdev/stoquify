import { useQuery } from "@tanstack/react-query";
import { api } from "api/convex";
import { convex } from "@/lib/convex-client";
import type { Id } from "api/data-model";

export const useGetCustomers = () => {
  return useQuery({
    queryKey: ["customers", "list"],
    queryFn: async () => {
      return await convex.query(api.customers.listCustomers, {});
    },
    staleTime: Infinity, // Keep data fresh to show "Instant Paint" from cache
    gcTime: 1000 * 60 * 60 * 24, // Keep in cache/storage for 24 hours
  });
};

export const useGetCustomerById = (id: Id<"customers">) => {
  return useQuery({
    queryKey: ["customers", "detail", id],
    queryFn: async () => {
      return await convex.query(api.customers.getCustomer, { customerId: id });
    },
    enabled: !!id,
    staleTime: Infinity,
    gcTime: 1000 * 60 * 60 * 24,
  });
};
