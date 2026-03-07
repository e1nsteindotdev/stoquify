import { convex } from "@/lib/convex-client";
import { idbGet, idbRefresh } from "@/lib/idb";
import { useQuery } from "@tanstack/react-query";
import { api } from "api/convex";

export function useGetUser() {
  const queryResult = useQuery({
    queryKey: ["user"],
    queryFn: async () => {
      try {
        const user = await convex.query(api.users.me);
        await idbRefresh("user", user);
        return user;
      } catch (e) {
        const cachedUser = await idbGet("user");
        if (!cachedUser || Array.isArray(cachedUser)) {
          return {};
        }
        return cachedUser;
      }
    },
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  return queryResult;
}
