import { useQuery } from "@tanstack/react-query";
import { api } from "api/convex";
import { convex } from "@/lib/convex-client";
import type { Id } from "api/data-model";

export const useGetProducts = () => {
    return useQuery({
        queryKey: ["products", "list"],
        queryFn: async () => {
            return await convex.query(api.products.listProducts);
        },
        staleTime: Infinity,
        gcTime: 1000 * 60 * 60 * 24, // 24 hours
    });
};

export const useGetAllProducts = () => {
    return useQuery({
        queryKey: ["products", "listAll"],
        queryFn: async () => {
            return await convex.query(api.products.listAllProduts);
        },
        staleTime: Infinity,
        gcTime: 1000 * 60 * 60 * 24, // 24 hours
    });
};

export const useGetProductById = (id: Id<"products"> | undefined) => {
    return useQuery({
        queryKey: ["products", "detail", id],
        queryFn: async () => {
            if (!id) return null;
            return await convex.query(api.products.getProductById, { id });
        },
        enabled: !!id,
        staleTime: Infinity,
        gcTime: 1000 * 60 * 60 * 24, // 24 hours
    });
};
