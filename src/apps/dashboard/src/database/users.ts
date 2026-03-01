import { convex } from "@/lib/convex-client";
import { queryCollectionOptions } from "@tanstack/query-db-collection";
import { api } from "api/convex";
import { createCollection } from "@tanstack/db";
import { convexQuery } from "@convex-dev/react-query";
import { useQuery } from "@tanstack/react-query";
import { queryClient } from "@/lib/ts-query-client";

export const usersCollection = createCollection(
  queryCollectionOptions({
    queryKey: ["users"],
    queryFn: async (ctx) => {
      const user = await convex.query(api.users.get);
      return user ? [user] : [];
    },
    queryClient,
    getKey: (item: any) => item._id ?? item.subject,
    syncMode: "eager",
  }),
);

export const useGetCurrentUser = () => {
  return useQuery(convexQuery(api.users.get, {}));
};
