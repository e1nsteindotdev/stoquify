import { useRouter } from "@tanstack/react-router";
import { useInitiateProduct as useInitiateProductBase, useGetImageUrl as useGetImageUrlBase } from "@/hooks/use-convex-queries";
import type { Id } from "api/data-model";

export function useInitiateProduct() {
  const mutation = useInitiateProductBase();
  return async function initiateProduct() {
    return await mutation.mutateAsync({});
  };
}

export function useNavigateToProduct() {
  const router = useRouter();
  return function navigateToProduct(productId: string) {
    router.navigate({
      to: "/produits/$slug",
      params: { slug: productId },
    });
  };
}

export function useGetImageUrl() {
  const mutation = useGetImageUrlBase();
  return async function getImageUrl(storageId: Id<"_storage">) {
    return await mutation.mutateAsync({ storageId });
  };
}

