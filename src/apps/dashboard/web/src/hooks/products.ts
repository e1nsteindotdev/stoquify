import { useRouter } from "@tanstack/react-router";
import { useMutation } from "convex/react";
import { api } from "api/convex";
import type { Id } from "api/data-model";

export function useInitiateProduct() {
  const mutation = useMutation(api.products.initiateProduct);
  return async function initiateProduct() {
    return await mutation();
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
  const mutation = useMutation(api.images.getUrl);
  return async function getImageUrl(storageId: Id<"_storage">) {
    return await mutation({ storageId });
  };
}
