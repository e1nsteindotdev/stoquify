import { useConvexMutation } from "@convex-dev/react-query";
import { useMutation } from "@tanstack/react-query";
import { api } from "api/convex";

// ============= Products =============
export function useInitiateProduct() {
  return useMutation({
    mutationFn: useConvexMutation(api.products.createProduct as any),
  });
}

export function useRemoveProduct() {
  return useMutation({
    mutationFn: useConvexMutation(api.products.deleteProduct as any),
  });
}

export function useUpdateProduct() {
  return useMutation({
    mutationFn: useConvexMutation(api.products.updateProductMetaData as any),
  });
}

// ============= Categories =============
export function useCreateCategory() {
  return useMutation({
    mutationFn: useConvexMutation(api.categories.createCategory as any),
  });
}

// ============= Collections =============
export function useCreateCollection() {
  return useMutation({
    mutationFn: useConvexMutation(api.collections.createCollection),
  });
}

// ============= Orders =============
export function useConfirmOrder() {
  return useMutation({
    mutationFn: useConvexMutation(api.order.confirmOrder),
  });
}

export function useDenyOrder() {
  return useMutation({
    mutationFn: useConvexMutation(api.order.denyOrder),
  });
}

export function useDeleteOrder() {
  return useMutation({
    mutationFn: useConvexMutation(api.order.deleteOrder),
  });
}

// ============= Sales =============
export function useCreateSale() {
  return useMutation({
    mutationFn: useConvexMutation(api.sales.createSale),
  });
}

// ============= Settings =============
export function useUpdateSettings() {
  return useMutation({
    mutationFn: useConvexMutation(api.settings.updateSettings),
  });
}

export function useCreateFAQ() {
  return useMutation({
    mutationFn: useConvexMutation(api.settings.createFAQ),
  });
}

export function useUpdateFAQ() {
  return useMutation({
    mutationFn: useConvexMutation(api.settings.updateFAQ),
  });
}

export function useDeleteFAQ() {
  return useMutation({
    mutationFn: useConvexMutation(api.settings.deleteFAQ),
  });
}

// ============= Images =============
export function useGetImageUrl() {
  return useMutation({
    mutationFn: useConvexMutation(api.images.getUrl as any),
  });
}

export function useGenerateUploadUrl() {
  return useMutation({
    mutationFn: useConvexMutation(api.images.generateUploadUrl),
  });
}

export function useSendImage() {
  return useMutation({
    mutationFn: useConvexMutation(api.products.sendImage),
  });
}
