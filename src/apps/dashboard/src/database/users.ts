import { useQuery } from "@tanstack/react-query";
import { api } from "api/convex";
import { convex } from "@/lib/convex-client";

export const useGetUser = () => {
    return useQuery({
        queryKey: ["users", "get"],
        queryFn: async () => {
            return await convex.query(api.users.get);
        },
        staleTime: Infinity,
        gcTime: 1000 * 60 * 60 * 24, // 24 hours
    });
};