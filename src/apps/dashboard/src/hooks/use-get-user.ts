import { convex } from "@/lib/convex-client";
import { idbGet, idbRefresh } from "@/lib/idb";
import { useQuery } from "@tanstack/react-query";
import { api } from "api/convex";

export function useGetUser() {
  const queryResult = useQuery({
    queryKey: ["user"],
    queryFn: async () => {
      console.log("useGetUser queryFn")
      try {
        const user = await convex.query(api.users.getUserData);
        await idbRefresh('user', user)
        console.log('[use-get-user] user :', user)
        return user
      } catch (e) {
        console.log('[use-get-user] useGetUser Error: ', e)
        const cachedUser = await idbGet("user");
        if (!cachedUser || Array.isArray(cachedUser)) {
          console.log("returning user as null")
          return {};
        }
        console.log('[use-get-user] returning user')
        return cachedUser;
      }
    },
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  return queryResult;
}
