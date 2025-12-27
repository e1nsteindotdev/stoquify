import { convex } from "@/lib/convex-client"
import { queryCollectionOptions } from '@tanstack/query-db-collection'
import { api } from 'api/convex'
import { QueryClient } from "@tanstack/query-core"
import { createCollection } from "@tanstack/db"


const queryClient = new QueryClient()

export const salesCollection = createCollection(
  queryCollectionOptions({
    queryKey: ['sales'],
    queryFn: async (ctx) => {
      const sales = await convex.query(api.sales.listSales)
      return sales
    },
    queryClient,
    getKey: (item: any) => item._id,
    syncMode: 'on-demand', // ← Enable query-driven sync
  })
)
