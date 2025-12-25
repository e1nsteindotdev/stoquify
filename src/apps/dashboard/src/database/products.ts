import { convex } from "@/lib/convex-client"
import { queryCollectionOptions } from '@tanstack/query-db-collection'
import { api } from 'api/convex'
import { QueryClient } from "@tanstack/query-core"
import { createCollection } from "@tanstack/db"


const queryClient = new QueryClient()

export const productsCollection = createCollection(
  queryCollectionOptions({
    queryKey: ['products'],
    queryFn: async (ctx) => {
      const products = await convex.query(api.products.listProducts)
      return products
    },
    queryClient,
    getKey: (item) => item._id,
    syncMode: 'on-demand', // ← Enable query-driven sync
  })
)

