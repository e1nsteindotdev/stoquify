import { createFileRoute, useParams, redirect } from "@tanstack/react-router";
import { ProductForm } from "@/components/forms/product/products-form";
import type { Id } from "api/data-model";
import { useAppStore } from "@/lib/store";
import { hasStorePermission } from "@/lib/permissions";

export const Route = createFileRoute("/_dashboard/produits/$slug")({
  beforeLoad: () => {
    const state = useAppStore.getState();
    const user = state.user;
    const storeId = state.selectedStore?._id;
    if (!hasStorePermission(user, storeId, "products", "write")) {
      throw redirect({ to: "/produits" });
    }
  },
  component: function RouteComponent() {
    const { slug } = useParams({ from: "/_dashboard/produits/$slug" });
    return <ProductForm slug={slug as Id<"products">} />;
  },
});
