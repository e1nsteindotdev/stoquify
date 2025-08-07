import { ProductForm } from "@/components/forms/products-form";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_dashboard/produits/create")({
  component: () => <ProductForm slug="new" />,
});
