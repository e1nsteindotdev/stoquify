import { convex } from "@/lib/convex-client";
import { queryCollectionOptions } from "@tanstack/query-db-collection";
import { api } from "api/convex";
import { createCollection } from "@tanstack/db";
import { useLiveQuery } from "@tanstack/react-db";
import type { Id } from "api/data-model";
import { idbGet, idbRefresh } from "@/lib/idb";
import { queryClient } from "@/lib/ts-query-client";

export const storesCollection = createCollection(
  queryCollectionOptions({
    queryKey: ["stores"],
    queryFn: async (): Promise<any[]> => {
      console.log("[stores] queryFn running");
      try {
        const stores = await convex.query(api.stores.list);
        idbRefresh("stores", stores);
        return stores;
      } catch (e) {
        const cachedStores = await idbGet("stores");
        return Array.isArray(cachedStores) ? cachedStores : [];
      }
    },
    queryClient,
    getKey: (item) => item._id,
    syncMode: "eager",
    staleTime: 24 * 60 * 60 * 1000,
  }),
);

export const useGetStores = () => {
  return useLiveQuery((q) => q.from({ stores: storesCollection }));
};

export const useGetStoreById = (id: Id<"stores">) => {
  const { data: store } = useLiveQuery((q) =>
    q.from({ stores: storesCollection }).findOne(),
  );
  return store;
};
