import { useQuery } from "@tanstack/react-query";
import { api } from "api/convex";
import { convex } from "@/lib/convex-client";

export const useGetCategories = () => {
  return useQuery({
    queryKey: ["categories", "list"],
    queryFn: async () => {
      return await convex.query(api.categories.listCategories);
    },
    staleTime: Infinity,
    gcTime: 1000 * 60 * 60 * 24, // 24 hours
  });
};

export const useGetAllCategories = () => {
  return useQuery({
    queryKey: ["categories", "listAll"],
    queryFn: async () => {
      return await convex.query(api.categories.listAllCategories);
    },
    staleTime: Infinity,
    gcTime: 1000 * 60 * 60 * 24, // 24 hours
  });
};
