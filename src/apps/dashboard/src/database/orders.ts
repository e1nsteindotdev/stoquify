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

export const ordersCollection = createCollection(
  queryCollectionOptions({
    queryKey: ['orders'],
    queryFn: async (ctx) => {
      const orders = await convex.query(api.order.listOrders)
      return orders
    },
    queryClient,
    getKey: (item) => item._id,
    syncMode: 'eager',
  })
)

export const useGetOrders = () => {
  return useLiveQuery(q => q.from({ orders: ordersCollection }))
}

export const useGetOrderById = (orderId: Id<"orders"> | undefined) => {
  return useQuery({
    ...convexQuery(api.order.getOrder, orderId ? { orderId } : "skip"),
    enabled: !!orderId,
  })
}
