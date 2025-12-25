import { convex } from "@/lib/convex-client"
import { queryCollectionOptions } from '@tanstack/query-db-collection'
import { api } from 'api/convex'
import { QueryClient } from "@tanstack/query-core"
import { createCollection } from "@tanstack/db"


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
    syncMode: 'on-demand', // ← Enable query-driven sync
  })
)
