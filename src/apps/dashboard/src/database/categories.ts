import { convex } from "@/lib/convex-client"
import { queryCollectionOptions } from '@tanstack/query-db-collection'
import { api } from 'api/convex'
import { createCollection, eq } from "@tanstack/db"
import { useLiveQuery } from '@tanstack/react-db'
import { queryClient } from "@/lib/ts-query-client"

export const categoriesCollection = createCollection(
  queryCollectionOptions({
    queryKey: ['categories'],
    queryFn: async () => {
      const categories = await convex.query(api.categories.listCategories)
      return categories
    },
    queryClient,
    getKey: (item) => item._id,
    syncMode: 'eager',
  })
)

export const useGetCategories = (storeId?: string) => {
  return storeId
    ? useLiveQuery(q => q
      .from({ categories: categoriesCollection })
      .where(({ categories }) => eq(categories.storeId, storeId))
    )
    : useLiveQuery(q => q.from({ categories: categoriesCollection }))
}
