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

export const collectionsCollection = createCollection(
  queryCollectionOptions({
    queryKey: ['collections'],
    queryFn: async (ctx) => {
      const collections = await convex.query(api.collections.listAllCollections)
      return collections
    },
    queryClient,
    getKey: (item) => item._id,
    syncMode: 'on-demand',
  })
)

export const useGetAllCollections = () => {
  return useLiveQuery(q => q.from({ collections: collectionsCollection }))
}

export const useGetSelectedCollectionIds = (productId: Id<"products"> | undefined) => {
  return useQuery({
    ...convexQuery(api.collections.listSelectedCollectionsIds, productId ? { productId } : "skip"),
    enabled: !!productId,
  })
}
