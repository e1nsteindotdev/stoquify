import { convex } from "@/lib/convex-client";
import { queryCollectionOptions } from "@tanstack/query-db-collection";
import { api } from "api/convex";
import { createCollection } from "@tanstack/db";
import { useQuery } from "@tanstack/react-query";
import { queryClient } from "@/lib/ts-query-client";
import { idbGet, idbRefresh } from "@/lib/idb";

export const usersCollection = createCollection(
  queryCollectionOptions({
    queryKey: ["users"],
    queryFn: async (): Promise<any[]> => {
      try {
        const user = await convex.query(api.users.get);
        const normalizedUsers = user ? [user] : [];
        idbRefresh("users", normalizedUsers);
        idbRefresh("user", user ?? null);
        return normalizedUsers;
      } catch (e) {
        const cachedUsers = await idbGet("users");
        if (Array.isArray(cachedUsers)) {
          return cachedUsers;
        }
        const cachedUser = await idbGet("user");
        return cachedUser && !Array.isArray(cachedUser) ? [cachedUser] : [];
      }
    },
    queryClient,
    getKey: (item: any) => item._id ?? item.subject,
    syncMode: "eager",
  }),
);

export const useGetCurrentUser = () => {
  return useQuery({
    queryKey: ["user"],
    queryFn: async () => {
      try {
        const user = await convex.query(api.users.get);
        idbRefresh("user", user ?? null);
        return user ?? null;
      } catch (e) {
        const cachedUser = await idbGet("user");
        return cachedUser && !Array.isArray(cachedUser) ? cachedUser : null;
      }
    },
  });
};
