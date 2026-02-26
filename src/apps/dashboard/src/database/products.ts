import { convex } from "@/lib/convex-client"
import { queryCollectionOptions } from '@tanstack/query-db-collection'
import { api } from 'api/convex'
import { createCollection, eq } from "@tanstack/db"
import { useLiveQuery } from '@tanstack/react-db'
import type { Id } from "api/data-model"
import { idbRefresh } from "@/lib/idb"
import { queryClient } from "@/lib/ts-query-client"
import { useAppStore } from "@/lib/store"

export const productsCollection = createCollection(
  queryCollectionOptions({
    queryKey: ['products'],
    queryFn: async () => {
      const storeId = useAppStore.getState().selectedStore?._id
      if (!storeId) return []
      const products = await convex.query(api.products.listProducts, { storeId })
      idbRefresh('products', products)
      return products
    },
    queryClient,
    getKey: (item) => item._id,
    syncMode: 'on-demand',
  })
)

export const useGetProducts = () => {
  return useLiveQuery(q => q.from({ products: productsCollection }))
}

export const useGetProductById = (id: Id<"products">) => {
  const { data: product } = useLiveQuery(q => q.
    from({ products: productsCollection })
    .where(({ products }) => eq(products._id, id))
    .findOne()
  )
  return product
}

