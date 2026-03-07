import { convex } from "@/lib/convex-client";
import { queryCollectionOptions } from "@tanstack/query-db-collection";
import { api } from "api/convex";
import { createCollection, eq } from "@tanstack/db";
import { useLiveQuery } from "@tanstack/react-db";
import type { Id } from "api/data-model";
import { idbGet, idbRefresh, idbGetCursor, idbSetCursor } from "@/lib/idb";
import { queryClient } from "@/lib/ts-query-client";
import { useAppStore } from "@/lib/store";
import type { TypeProduct } from "api/types";
import { computeNewCursor, mergeRowsWithStoreScope } from "@/lib/cursor-utils";

type CachedProduct = TypeProduct;
type ProductForForm = Omit<TypeProduct, "collections"> & {
  collections: { _id: Id<"collections"> }[];
};

export const productsCollection = createCollection(
  queryCollectionOptions({
    queryKey: () => {
      const storeId = useAppStore.getState().selectedStore?._id;
      return ["products", storeId];
    },
    queryFn: async (): Promise<any[]> => {
      console.log("[products] queryFn running");
      const storeId = useAppStore.getState().selectedStore?._id;
      if (!storeId) return [];

      const cursor = await idbGetCursor("products", storeId);

      try {
        const products = await convex.query(api.products.list, {
          storeId,
          cursor: cursor ?? undefined,
        });

        const cachedProducts = await idbGet<CachedProduct[]>(
          "products",
          storeId,
        );
        const mergedProducts = mergeRowsWithStoreScope(
          products,
          cachedProducts || [],
          storeId,
        );

        await idbRefresh("products", mergedProducts, storeId);

        if (products.length > 0) {
          const newCursor = computeNewCursor(products);
          await idbSetCursor("products", newCursor, storeId);
        }

        return mergedProducts;
      } catch (e) {
        const cachedProducts = await idbGet<CachedProduct[]>(
          "products",
          storeId,
        );
        return cachedProducts || [];
      }
    },
    queryClient,
    getKey: (item) => item._id,
    syncMode: "eager",
    staleTime: 24 * 60 * 60 * 1000,
  }),
);

export const useGetProducts = () => {
  return useLiveQuery((q) => q.from({ products: productsCollection }));
};

export const useGetProductById = (id: Id<"products">) => {
  const { data: product } = useLiveQuery((q) =>
    q
      .from({ products: productsCollection })
      .where(({ products }) => eq(products._id, id))
      .findOne(),
  );
  return product as ProductForForm | undefined;
};
