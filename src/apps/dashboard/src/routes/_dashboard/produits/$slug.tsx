import { createFileRoute, useParams } from "@tanstack/react-router";
import { ProductForm } from "@/components/forms/products/products-form";

export const Route = createFileRoute("/_dashboard/produits/$slug")({
  component: function RouteComponent() {
    const { slug } = useParams({ from: "/_dashboard/produits/$slug" });
    return <ProductForm slug={slug as string} />;
  },
});
