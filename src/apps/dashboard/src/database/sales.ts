import { useQuery } from "@tanstack/react-query";
import { api } from "api/convex";
import { convex } from "@/lib/convex-client";

export const useGetSales = () => {
    return useQuery({
        queryKey: ["sales", "list"],
        queryFn: async () => {
            return await convex.query(api.sales.listSales);
        },
        staleTime: Infinity,
        gcTime: 1000 * 60 * 60 * 24, // 24 hours
    });
};
