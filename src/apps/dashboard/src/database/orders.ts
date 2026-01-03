import { useQuery } from "@tanstack/react-query";
import { api } from "api/convex";
import { convex } from "@/lib/convex-client";

import type { Id } from "api/data-model";

export const useGetOrders = () => {
    return useQuery({
        queryKey: ["orders", "list"],
        queryFn: async () => {
            return await convex.query(api.order.listOrders);
        },
        staleTime: Infinity,
        gcTime: 1000 * 60 * 60 * 24, // 24 hours
    });
};

export const useGetOrderById = (id: Id<"orders">) => {
    return useQuery({
        queryKey: ["orders", "detail", id],
        queryFn: async () => {
            return await convex.query(api.order.getOrder, { orderId: id });
        },
        enabled: !!id,
        staleTime: Infinity,
        gcTime: 1000 * 60 * 60 * 24,
    });
};
