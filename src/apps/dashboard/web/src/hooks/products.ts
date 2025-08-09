import { useRouter } from "@tanstack/react-router";
import { useMutation } from "convex/react";
import { api } from "api/convex";

export function useInitiateProduct() {
  const createProduct = useMutation(api.products.createProduct);
  return async function initiateProduct() {
    const id = await createProduct({
      title: "",
      desc: "",
      stockingStrategy: "on_demand" as const,
      status: "inactive" as const,
      images: [],
    } as any);
    return String(id);
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
