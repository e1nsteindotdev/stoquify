import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "api/convex";
import { convex } from "@/lib/convex-client";

// ============= Products =============
export function useInitiateProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (args: any) => {
      return await convex.mutation(api.products.initiateProduct, args);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });
}

export function useRemoveProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (args: any) => {
      return await convex.mutation(api.products.removeProduct, args);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });
}

export function useUpdateProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (args: any) => {
      return await convex.mutation(api.products.updateProduct, args);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });
}

// ============= Categories =============
export function useCreateCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (args: any) => {
      return await convex.mutation(api.categories.createCategory, args);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
    },
  });
}

// ============= Collections =============
export function useCreateCollection() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (args: any) => {
      return await convex.mutation(api.collections.createCollection, args);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["collections"] });
    },
  });
}

// ============= Orders =============
export function useConfirmOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (args: any) => {
      return await convex.mutation(api.order.confirmOrder, args);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["sales"] }); // Confirming potentially affects sales
    },
  });
}

export function useDenyOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (args: any) => {
      return await convex.mutation(api.order.denyOrder, args);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
    },
  });
}

// ============= Sales =============
export function useCreateSale() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (args: any) => {
      return await convex.mutation(api.sales.createSale, args);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sales"] });
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["products"] }); // Stock changes
    },
  });
}

// ============= Settings =============
export function useUpdateSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (args: any) => {
      return await convex.mutation(api.settings.updateSettings, args);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settings"] });
    },
  });
}

export function useCreateFAQ() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (args: any) => {
      return await convex.mutation(api.settings.createFAQ, args);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["faqs"] });
    },
  });
}

export function useUpdateFAQ() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (args: any) => {
      return await convex.mutation(api.settings.updateFAQ, args);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["faqs"] });
    },
  });
}

export function useDeleteFAQ() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (args: any) => {
      return await convex.mutation(api.settings.deleteFAQ, args);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["faqs"] });
    },
  });
}

// ============= Images =============
export function useGetImageUrl() {
  return useMutation({
    mutationFn: async (args: any) => {
      return await convex.mutation(api.images.getUrl, args);
    },
  });
}

export function useGenerateUploadUrl() {
  return useMutation({
    mutationFn: async (args: any) => {
      return await convex.mutation(api.images.generateUploadUrl, args);
    },
  });
}

export function useSendImage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (args: any) => {
      return await convex.mutation(api.products.sendImage, args);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });
}
