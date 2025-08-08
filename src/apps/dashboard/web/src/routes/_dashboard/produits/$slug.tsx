import { createFileRoute, useParams } from "@tanstack/react-router";
import { type AnyFieldApi } from "@tanstack/react-form";
import { ProductForm } from "@/components/forms/products-form";

export const Route = createFileRoute("/_dashboard/produits/$slug")({
  component: function RouteComponent() {
    const { slug } = useParams({ from: "/_dashboard/produits/$slug" });
    return <ProductForm slug={slug} />;
  },
});
