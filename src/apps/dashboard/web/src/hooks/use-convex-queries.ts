import { convexQuery, useConvexMutation } from "@convex-dev/react-query";
import { useQuery, useMutation } from "@tanstack/react-query";
import { api } from "api/convex";
import type { Id } from "api/data-model";

// ============= Products =============
export function useProducts() {
  return useQuery(convexQuery(api.products.listProducts, {}));
}

export function useAllProducts() {
  return useQuery(convexQuery(api.products.listAllProduts, {}));
}

export function useProductById(id: Id<"products"> | undefined) {
  return useQuery({
    ...convexQuery(api.products.getProductById, id ? { id } : "skip"),
    enabled: !!id,
  });
}

export function useInitiateProduct() {
  return useMutation({
    mutationFn: useConvexMutation(api.products.initiateProduct),
  });
}

export function useRemoveProduct() {
  return useMutation({
    mutationFn: useConvexMutation(api.products.removeProduct),
  });
}

export function useUpdateProduct() {
  return useMutation({
    mutationFn: useConvexMutation(api.products.updateProduct),
  });
}

// ============= Categories =============
export function useCategories() {
  return useQuery(convexQuery(api.categories.listCategories, {}));
}

export function useAllCategories() {
  return useQuery(convexQuery(api.categories.listAllCategories, {}));
}

export function useCreateCategory() {
  return useMutation({
    mutationFn: useConvexMutation(api.categories.createCategory as any),
  });
}

// ============= Collections =============
export function useAllCollections() {
  return useQuery(convexQuery(api.collections.listAllCollections, {}));
}

export function useSelectedCollectionIds(productId: Id<"products"> | undefined) {
  return useQuery({
    ...convexQuery(api.collections.listSelectedCollectionsIds, productId ? { productId } : "skip"),
    enabled: !!productId,
  });
}

export function useCreateCollection() {
  return useMutation({
    mutationFn: useConvexMutation(api.collections.createCollection),
  });
}

// ============= Orders =============
export function useOrders() {
  return useQuery(convexQuery(api.order.listOrders, {}));
}

export function useOrderById(orderId: Id<"orders"> | undefined) {
  return useQuery({
    ...convexQuery(api.order.getOrder, orderId ? { orderId } : "skip"),
    enabled: !!orderId,
  });
}

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

// ============= Customers =============
export function useCustomers() {
  return useQuery(convexQuery(api.customers.listCustomers, {}));
}

export function useCustomerById(customerId: Id<"customers"> | undefined) {
  return useQuery({
    ...convexQuery(api.customers.getCustomer, customerId ? { customerId } : "skip"),
    enabled: !!customerId,
  });
}

// ============= Sales =============
export function useCreateSale() {
  return useMutation({
    mutationFn: useConvexMutation(api.sales.createSale),
  });
}

// ============= Settings =============
export function useSettings() {
  return useQuery(convexQuery(api.settings.getSettings, {}));
}

export function useFAQs() {
  return useQuery(convexQuery(api.settings.getFAQs, {}));
}

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

// ============= Analytics =============
type TimePeriod = "today" | "week" | "month" | "year" | "all";

export function useSalesData(period: TimePeriod) {
  return useQuery(convexQuery(api.analytics.getSalesData, { period }));
}

export function useSalesByTimePeriod(period: TimePeriod) {
  return useQuery(convexQuery(api.analytics.getSalesByTimePeriod, { period }));
}

export function useProductPerformance(period: TimePeriod) {
  return useQuery(convexQuery(api.analytics.getProductPerformance, { period }));
}

// ============= User =============
export function useCurrentUser() {
  return useQuery(convexQuery(api.users.get, {}));
}

// ============= Images =============
export function useGetImageUrl() {
  return useMutation({
    mutationFn: useConvexMutation(api.images.getUrl),
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
