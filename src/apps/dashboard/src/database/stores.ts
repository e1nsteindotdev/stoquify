import { convex } from "@/lib/convex-client";
import { queryCollectionOptions } from "@tanstack/query-db-collection";
import { api } from "api/convex";
import { createCollection } from "@tanstack/db";
import { useLiveQuery } from "@tanstack/react-db";
import { idbGet, idbRefresh, idbGetCursor, idbSetCursor } from "@/lib/idb";
import { queryClient } from "@/lib/ts-query-client";
import { computeNewCursor, mergeRows } from "@/lib/cursor-utils";

export const storesCollection = createCollection(
  queryCollectionOptions({
    queryKey: ["stores"],
    queryFn: async (): Promise<any[]> => {
      console.log("[stores] queryFn running");
      const cursor = await idbGetCursor("stores");

      try {
        const stores = await convex.query(api.stores.list, {
          cursor: cursor ?? undefined,
        });

        if (stores.length > 0) {
          const newCursor = computeNewCursor(stores);
          await idbSetCursor("stores", newCursor);
        }

        if (cursor) {
          const cachedStores = await idbGet<any[]>("stores");
          const mergedStores = mergeRows(stores, cachedStores || []);

          await idbRefresh("stores", mergedStores);
          return mergedStores;
        } else {
          await idbRefresh("stores", stores);
          return stores;
        }
      } catch (e) {
        const cachedStores = await idbGet<any[]>("stores");
        return cachedStores || [];
      }
    },
    queryClient,
    getKey: (item) => item._id,
    syncMode: "eager",
    staleTime: 0,
  }),
);

export const useGetStores = () => {
  return useLiveQuery((q) => q.from({ stores: storesCollection }));
};
