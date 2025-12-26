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

export const productsCollection = createCollection(
  queryCollectionOptions({
    queryKey: ['products'],
    queryFn: async (ctx) => {
      const products = await convex.query(api.products.listProducts)
      return products
    },
    queryClient,
    getKey: (item) => item._id,
    syncMode: 'on-demand',
  })
)

export const allProductsCollection = createCollection(
  queryCollectionOptions({
    queryKey: ['allProducts'],
    queryFn: async (ctx) => {
      const products = await convex.query(api.products.listAllProduts)
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

export const useGetAllProducts = () => {
  return useLiveQuery(q => q.from({ products: allProductsCollection }))
}

export const useGetProductById = (id: Id<"products"> | undefined) => {
  return useQuery({
    ...convexQuery(api.products.getProductById, id ? { id } : "skip"),
    enabled: !!id,
  })
}
