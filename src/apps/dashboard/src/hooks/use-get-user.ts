import { convex } from "@/lib/convex-client";
import { idbGet } from "@/lib/idb";
import { useQuery } from "@tanstack/react-query";
import { api } from "api/convex";

export function useGetUser() {
  const queryResult = useQuery({
    queryKey: ["user"],
    queryFn: async () => {
      try {
        return await convex.query(api.users.getUserData);
      } catch (e) {
        const cachedUser = await idbGet("user");
        if (!cachedUser || Array.isArray(cachedUser)) {
          return null;
        }
        return cachedUser;
      }
    },
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  return queryResult;
}
