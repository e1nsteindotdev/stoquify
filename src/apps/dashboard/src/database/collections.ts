import { convex } from "@/lib/convex-client"
import { queryCollectionOptions } from '@tanstack/query-db-collection'
import { api } from 'api/convex'
import { queryClient } from "@/lib/ts-query-client"
import { createCollection, inArray } from "@tanstack/db"
import { useLiveQuery } from '@tanstack/react-db'
import type { Id } from "api/data-model"
import { idbRefresh } from "@/lib/idb"


export const collectionsCollection = createCollection(
  queryCollectionOptions({
    queryKey: ['collections'],
    queryFn: async () => {
      const collections = await convex.query(api.collections.listAllCollections)
      idbRefresh('collections', collections)
      return collections
    },
    queryClient,
    getKey: (item) => item._id,
    syncMode: 'on-demand',
  })
)

export const useGetCollections = () => {
  return useLiveQuery(q => q.from({ collections: collectionsCollection }))
}

export const useGetSelectedCollections = (id: Id<"products">) => {
  const { data: product } = useLiveQuery(q => q
    .from({ collections: collectionsCollection })
    .where(({ collections }) => inArray(id, collections.productIds))
  )
  return product
}


