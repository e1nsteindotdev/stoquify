import { convex } from "@/lib/convex-client"
import { queryCollectionOptions } from '@tanstack/query-db-collection'
import { api } from 'api/convex'
import { QueryClient } from "@tanstack/query-core"
import { createCollection } from "@tanstack/db"
import { useLiveQuery } from '@tanstack/react-db'
import { convexQuery } from "@convex-dev/react-query"
import { useQuery } from "@tanstack/react-query"
import type { Id } from "api/data-model"


const queryClient = new QueryClient()

export const customersCollection = createCollection(
  queryCollectionOptions({
    queryKey: ['customers'],
    queryFn: async (ctx) => {
      const customers = await convex.query(api.customers.listCustomers)
      return customers
    },
    queryClient,
    getKey: (item) => item._id,
    syncMode: 'on-demand',
  })
)

export const useGetCustomers = () => {
  return useLiveQuery(q => q.from({ customers: customersCollection }))
}

export const useGetCustomerById = (customerId: Id<"customers"> | undefined) => {
  return useQuery({
    ...convexQuery(api.customers.getCustomer, customerId ? { customerId } : "skip"),
    enabled: !!customerId,
  })
}
