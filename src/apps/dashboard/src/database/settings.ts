import { useQuery } from "@tanstack/react-query";
import { api } from "api/convex";
import { convex } from "@/lib/convex-client";

export const useGetSettings = () => {
    return useQuery({
        queryKey: ["settings", "get"],
        queryFn: async () => {
            const settings = await convex.query(api.settings.getSettings);
            return Array.isArray(settings) ? settings : [settings];
        },
        staleTime: Infinity,
        gcTime: 1000 * 60 * 60 * 24, // 24 hours
    });
};
