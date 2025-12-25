import { convex } from "@/lib/convex-client"
import { queryCollectionOptions } from '@tanstack/query-db-collection'
import { api } from 'api/convex'
import { QueryClient } from "@tanstack/query-core"
import { createCollection } from "@tanstack/db"


const queryClient = new QueryClient()

export const categoriesCollection = createCollection(
  queryCollectionOptions({
    queryKey: ['categories'],
    queryFn: async (ctx) => {
      const categories = await convex.query(api.categories.listCategories)
      return categories
    },
    queryClient,
    getKey: (item) => item._id,
    syncMode: 'on-demand', // ← Enable query-driven sync
  })
)
