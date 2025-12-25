import { convex } from "@/lib/convex-client"
import { queryCollectionOptions } from '@tanstack/query-db-collection'
import { api } from 'api/convex'
import { QueryClient } from "@tanstack/query-core"
import { createCollection } from "@tanstack/db"


const queryClient = new QueryClient()

export const ordersCollection = createCollection(
  queryCollectionOptions({
    queryKey: ['orders'],
    queryFn: async (ctx) => {
      const orders = await convex.query(api.order.listOrders)
      return orders
    },
    queryClient,
    getKey: (item) => item._id,
    syncMode: 'on-demand', // ← Enable query-driven sync
  })
)
