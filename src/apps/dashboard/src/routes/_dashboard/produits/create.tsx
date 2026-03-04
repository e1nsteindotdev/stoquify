import { ProductForm } from "@/components/forms/product/products-form";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { useAppStore } from "@/lib/store";
import { hasStorePermission } from "@/lib/permissions";

export const Route = createFileRoute("/_dashboard/produits/create")({
  beforeLoad: () => {
    const state = useAppStore.getState();
    const user = state.user;
    const storeId = state.selectedStore?._id;
    if (!hasStorePermission(user, storeId, "products", "write")) {
      throw redirect({ to: "/produits" });
    }
  },
  component: () => <ProductForm slug="new" />,
});
