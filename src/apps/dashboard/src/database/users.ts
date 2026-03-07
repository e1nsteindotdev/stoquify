import { convex } from "@/lib/convex-client";
import { queryCollectionOptions } from "@tanstack/query-db-collection";
import { api } from "api/convex";
import { createCollection } from "@tanstack/db";
import { queryClient } from "@/lib/ts-query-client";
import { idbGet, idbRefresh, idbGetCursor, idbSetCursor } from "@/lib/idb";
import { computeNewCursor, mergeRows } from "@/lib/cursor-utils";

export const usersCollection = createCollection(
  queryCollectionOptions({
    queryKey: ["users"],
    queryFn: async (): Promise<any[]> => {
      const cursor = await idbGetCursor("users");

      try {
        const user = await convex.query(api.users.get);
        const normalizedUsers = user ? [user] : [];

        const cachedUsers = await idbGet<any[]>("users");
        const mergedUsers = mergeRows(normalizedUsers, cachedUsers || []);

        await idbRefresh("users", mergedUsers);
        await idbRefresh("user", user ?? null);

        if (normalizedUsers.length > 0) {
          const newCursor = computeNewCursor(normalizedUsers);
          await idbSetCursor("users", newCursor);
        }

        return mergedUsers;
      } catch (e) {
        const cachedUsers = await idbGet<any[]>("users");
        if (cachedUsers) {
          return cachedUsers;
        }
        const cachedUser = await idbGet<any>("user");
        return cachedUser && !Array.isArray(cachedUser) ? [cachedUser] : [];
      }
    },
    queryClient,
    getKey: (item: any) => item._id ?? item.subject,
    syncMode: "eager",
    staleTime: 24 * 60 * 60 * 1000,
  }),
);
