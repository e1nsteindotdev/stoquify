import { convex } from "@/lib/convex-client";
import { queryCollectionOptions } from "@tanstack/query-db-collection";
import { api } from "api/convex";
import { createCollection } from "@tanstack/db";
import { queryClient } from "@/lib/ts-query-client";
import { idbGet, idbRefresh } from "@/lib/idb";

export const usersCollection = createCollection(
  queryCollectionOptions({
    queryKey: ["users"],
    queryFn: async (): Promise<any[]> => {
      console.log("[users] queryFn running");

      try {
        const user = await convex.query(api.users.get);
        const normalizedUsers = user ? [user] : [];

        await idbRefresh("users", normalizedUsers);
        await idbRefresh("user", user ?? null);
        return normalizedUsers;
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
    staleTime: 0,
  }),
);
