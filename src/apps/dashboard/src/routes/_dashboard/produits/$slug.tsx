import {
  createFileRoute,
  useParams,
  redirect,
  useNavigate,
} from "@tanstack/react-router";
import { ProductForm } from "@/components/forms/product/products-form";
import type { Id } from "api/data-model";
import { useAppStore } from "@/lib/store";
import { hasStorePermission } from "@/lib/permissions";
import { useEffect } from "react";

export const Route = createFileRoute("/_dashboard/produits/$slug")({
  beforeLoad: () => {
    const state = useAppStore.getState();
    if (!state.isInitialized) return;

    const user = state.user;
    const storeId = state.selectedStore?._id;
    if (!hasStorePermission(user, storeId, "products", "write")) {
      throw redirect({ to: "/produits" });
    }
  },
  component: function RouteComponent() {
    const { slug } = useParams({ from: "/_dashboard/produits/$slug" });
    const user = useAppStore((state) => state.user);
    const storeId = useAppStore((state) => state.selectedStore?._id);
    const isInitialized = useAppStore((state) => state.isInitialized);
    const navigate = useNavigate();

    useEffect(() => {
      if (
        isInitialized &&
        !hasStorePermission(user, storeId, "products", "write")
      ) {
        navigate({ to: "/produits" });
      }
    }, [isInitialized, user, storeId, navigate]);

    if (!isInitialized) return null;

    return <ProductForm slug={slug as Id<"products">} />;
  },
});
