import { convex } from "@/lib/convex-client";
import { queryCollectionOptions } from "@tanstack/query-db-collection";
import { api } from "api/convex";
import { queryClient } from "@/lib/ts-query-client";
import { createCollection, inArray } from "@tanstack/db";
import { useLiveQuery } from "@tanstack/react-db";
import type { Id } from "api/data-model";
import { useAppStore } from "@/lib/store";
import { idbGet, idbRefresh, idbGetCursor, idbSetCursor } from "@/lib/idb";
import { computeNewCursor, mergeRowsWithStoreScope } from "@/lib/cursor-utils";

type CachedCollection = {
  _id: Id<"collections">;
  productIds?: Id<"products">[];
  storeId: Id<"stores">;
  title: string;
  lastUpdate?: number;
  deleted?: boolean;
  _creationTime: number;
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

      const cursor = await idbGetCursor("collections", storeId);

      try {
        const collections = await convex.query(api.collections.list, {
          storeId,
          cursor: cursor ?? undefined,
        });

        const cachedCollections = await idbGet<CachedCollection[]>(
          "collections",
          storeId,
        );
        const mergedCollections = mergeRowsWithStoreScope(
          collections,
          cachedCollections || [],
          storeId,
        );

        await idbRefresh("collections", mergedCollections, storeId);

        if (collections.length > 0) {
          const newCursor = computeNewCursor(collections);
          await idbSetCursor("collections", newCursor, storeId);
        }

        return mergedCollections;
      } catch (e) {
        const cachedCollections = await idbGet<CachedCollection[]>(
          "collections",
          storeId,
        );
        return cachedCollections || [];
      }
    },
    queryClient,
    getKey: (item) => item._id,
    syncMode: "eager",
    staleTime: 24 * 60 * 60 * 1000,
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
