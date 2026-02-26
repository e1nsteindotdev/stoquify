import { convex } from "@/lib/convex-client";
import { queryCollectionOptions } from "@tanstack/query-db-collection";
import { api } from "api/convex";
import { createCollection } from "@tanstack/db";
import { useLiveQuery } from "@tanstack/react-db";
import type { Id } from "api/data-model";
import { idbRefresh } from "@/lib/idb";
import { queryClient } from "@/lib/ts-query-client";

export const storesCollection = createCollection(
  queryCollectionOptions({
    queryKey: ["stores"],
    queryFn: async () => {
      const stores = await convex.query(api.stores.list);
      idbRefresh("stores", stores);
      return stores;
    },
    queryClient,
    getKey: (item) => item._id,
    syncMode: "on-demand",
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
