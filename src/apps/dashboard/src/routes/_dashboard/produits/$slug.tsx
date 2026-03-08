import {
  createFileRoute,
  useParams,
  redirect,
} from "@tanstack/react-router";
import { ProductForm } from "@/components/forms/product/products-form";
import type { Id } from "api/data-model";
import { useAppStore } from "@/lib/store";
import { hasStorePermission } from "@/lib/permissions";

export const Route = createFileRoute("/_dashboard/produits/$slug")({
  component: function RouteComponent() {
    const { slug } = useParams({ from: "/_dashboard/produits/$slug" });
    const user = useAppStore(state => state.user);
    const storeId = useAppStore(state => state?.selectedStore?._id);;
    if (!hasStorePermission(user, storeId, "products", "write")) {
      console.log("has no write permissoins to products")
      throw redirect({ to: "/" });
    }
    return <ProductForm slug={slug as Id<"products">} />;
  },
});
