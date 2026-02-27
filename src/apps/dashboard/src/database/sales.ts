import { convex } from "@/lib/convex-client"
import { queryCollectionOptions } from '@tanstack/query-db-collection'
import { api } from 'api/convex'
import { createCollection } from "@tanstack/db"
import { queryClient } from "@/lib/ts-query-client"

export const salesCollection = createCollection(
  queryCollectionOptions({
    queryKey: ['sales'],
    queryFn: async (ctx) => {
      const sales = await convex.query((api.sales as any).listSales)
      return sales
    },
    queryClient: queryClient,
    getKey: (item: any) => item._id,
    syncMode: 'eager',
  })
)
