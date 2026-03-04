import { convex } from "@/lib/convex-client";
import { queryCollectionOptions } from "@tanstack/query-db-collection";
import { api } from "api/convex";
import { createCollection, eq } from "@tanstack/db";
import { useLiveQuery } from "@tanstack/react-db";
import type { Id } from "api/data-model";
import { idbGet, idbRefresh } from "@/lib/idb";
import { queryClient } from "@/lib/ts-query-client";
import { useAppStore } from "@/lib/store";
import type { TypeProduct } from "api/types";

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
      const storeId = useAppStore.getState().selectedStore?._id;
      if (!storeId) return [];
      try {
        const products = await convex.query(api.products.listProducts, {
          storeId,
        });
        idbRefresh("products", products);
        return products;
      } catch (e) {
        const cachedProducts = await idbGet("products");
        return Array.isArray(cachedProducts)
          ? (cachedProducts as CachedProduct[])
          : [];
      }
    },
    queryClient,
    getKey: (item) => item._id,
    syncMode: "eager",
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
