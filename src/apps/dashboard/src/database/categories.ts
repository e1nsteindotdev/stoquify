import { convex } from "@/lib/convex-client"
import { queryCollectionOptions } from '@tanstack/query-db-collection'
import { api } from 'api/convex'
import { QueryClient } from "@tanstack/query-core"
import { createCollection } from "@tanstack/db"
import { useLiveQuery } from '@tanstack/react-db'


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
    syncMode: 'on-demand',
  })
)

export const allCategoriesCollection = createCollection(
  queryCollectionOptions({
    queryKey: ['allCategories'],
    queryFn: async (ctx) => {
      const categories = await convex.query(api.categories.listAllCategories)
      return categories
    },
    queryClient,
    getKey: (item) => item._id,
    syncMode: 'on-demand',
  })
)

export const useGetCategories = () => {
  return useLiveQuery(q => q.from({ categories: categoriesCollection }))
}

export const useGetAllCategories = () => {
  return useLiveQuery(q => q.from({ categories: allCategoriesCollection }))
}
