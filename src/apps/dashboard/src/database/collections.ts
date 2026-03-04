import { convex } from "@/lib/convex-client";
import { queryCollectionOptions } from "@tanstack/query-db-collection";
import { api } from "api/convex";
import { queryClient } from "@/lib/ts-query-client";
import { createCollection, inArray } from "@tanstack/db";
import { useLiveQuery } from "@tanstack/react-db";
import type { Id } from "api/data-model";
import { idbGet, idbRefresh } from "@/lib/idb";
import { useAppStore } from "@/lib/store";

type CachedCollection = {
  _id: Id<"collections">;
  productIds?: Id<"products">[];
  storeId: Id<"stores">;
  title: string;
};

export const collectionsCollection = createCollection(
  queryCollectionOptions({
    queryKey: () => {
      const storeId = useAppStore.getState().selectedStore?._id;
      return ["collections", storeId];
    },
    queryFn: async (): Promise<any[]> => {
      const storeId = useAppStore.getState().selectedStore?._id;
      if (!storeId) return [];
      try {
        const collections = await convex.query(
          api.collections.listAllCollections,
          {
            storeId,
          },
        );
        idbRefresh("collections", collections);
        return collections;
      } catch (e) {
        const cachedCollections = await idbGet("collections");
        return Array.isArray(cachedCollections)
          ? (cachedCollections as CachedCollection[])
          : [];
      }
    },
    queryClient,
    getKey: (item) => item._id,
    syncMode: "eager",
  }),
);

export const useGetCollections = () => {
  const result = useLiveQuery((q) =>
    q.from({ collections: collectionsCollection }),
  );
  return result as typeof result & { data: CachedCollection[] };
};

export const useGetSelectedCollections = (id: Id<"products">) => {
  const { data: product } = useLiveQuery((q) =>
    q
      .from({ collections: collectionsCollection })
      .where(({ collections }) => inArray(id, collections.productIds)),
  );
  return product as CachedCollection[];
};
