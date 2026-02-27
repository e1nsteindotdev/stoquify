import { convex } from "@/lib/convex-client";
import { queryCollectionOptions } from "@tanstack/query-db-collection";
import { api } from "api/convex";
import { queryClient } from "@/lib/ts-query-client";
import { createCollection, inArray } from "@tanstack/db";
import { useLiveQuery } from "@tanstack/react-db";
import type { Id } from "api/data-model";
import { idbRefresh } from "@/lib/idb";
import { useAppStore } from "@/lib/store";

export const collectionsCollection = createCollection(
  queryCollectionOptions({
    queryKey: ["collections"],
    queryFn: async () => {
      const storeId = useAppStore.getState().selectedStore?._id;
      if (!storeId) return [];
      const collections = await convex.query(api.collections.listAllCollections, { storeId });
      idbRefresh("collections", collections);
      return collections;
    },
    queryClient,
    getKey: (item) => item._id,
    syncMode: "eager",
  }),
);

export const useGetCollections = () => {
  return useLiveQuery((q) => q.from({ collections: collectionsCollection }));
};

export const useGetSelectedCollections = (id: Id<"products">) => {
  const { data: product } = useLiveQuery((q) =>
    q
      .from({ collections: collectionsCollection })
      .where(({ collections }) => inArray(id, collections.productIds)),
  );
  return product;
};
