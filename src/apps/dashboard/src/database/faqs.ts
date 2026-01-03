import { useQuery } from "@tanstack/react-query";
import { api } from "api/convex";
import { convex } from "@/lib/convex-client";

export const useGetFAQs = () => {
    return useQuery({
        queryKey: ["faqs", "list"],
        queryFn: async () => {
            return await convex.query(api.settings.getFAQs);
        },
        staleTime: Infinity,
        gcTime: 1000 * 60 * 60 * 24, // 24 hours
    });
};
