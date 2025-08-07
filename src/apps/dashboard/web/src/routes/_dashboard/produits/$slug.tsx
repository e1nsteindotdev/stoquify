import { createFileRoute, useParams, useRouter } from "@tanstack/react-router";
import { useEffect, useMemo } from "react";
import { useForm, type AnyFieldApi } from "@tanstack/react-form";
import { useMutation, useQuery } from "convex/react";
import { api } from "api/convex";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

function FieldInfo({ field }: { field: AnyFieldApi }) {
  return (
    <>
      {field.state.meta.isTouched && !field.state.meta.isValid ? (
        <em>{field.state.meta.errors.join(", ")}</em>
      ) : null}
      {field.state.meta.isValidating ? "Validating..." : null}
    </>
  );
}

export const Route = createFileRoute("/_dashboard/produits/$slug")({
  component: function RouteComponent() {
    const { slug } = useParams({ from: "/_dashboard/produits/$slug" });
    return <ProductUpsertPage slug={slug} />;
  },
});

export function ProductUpsertPage({ slug }: { slug?: string }) {
  const router = useRouter();
  const isNew = !slug || slug === "new";

  const product = useQuery(
    api.products.getProductById,
    isNew ? ("skip" as any) : { id: slug as any }
  );
  const productsList = useQuery(api.products.listProducts) ?? [];
  const tenantStores = useQuery(api.products.listTenantStores) ?? [];
  const categories = useQuery(api.products.listCategories) ?? [];

  const createProduct = useMutation(api.products.createProduct);
  const updateProduct = useMutation(api.products.updateProduct);

  const defaultValues = useMemo(
    () => ({
      tenantStoreId: product?.tenantStoreId ?? "",
      categoryId: product?.categoryId ?? "",
      title: product?.title ?? "",
      desc: product?.desc ?? "",
      price: product?.price ?? 0,
      discount: product?.discount ?? undefined,
      oldPrice: product?.oldPrice ?? undefined,
      stockingStrategy: product?.stockingStrategy ?? "on_demand",
    }),
    [product]
  );

  const form = useForm({
    defaultValues,
    onSubmit: async ({ value }) => {
      if (isNew) {
        const id = await createProduct({
          tenantStoreId: value.tenantStoreId as any,
          title: value.title,
          desc: value.desc,
          price: Number(value.price),
          discount: value.discount ?? undefined,
          oldPrice: value.oldPrice ?? undefined,
          categoryId: value.categoryId as any,
          stockingStrategy: value.stockingStrategy as any,
        });
        router.navigate({ to: "/produits/$slug", params: { slug: id as any } });
      } else {
        await updateProduct({
          id: slug as any,
          title: value.title,
          desc: value.desc,
          price: Number(value.price),
          discount: value.discount ?? undefined,
          oldPrice: value.oldPrice ?? undefined,
          categoryId: value.categoryId as any,
          stockingStrategy: value.stockingStrategy as any,
        });
      }
    },
  });

  // Keep form in sync when product loads
  useEffect(() => {
    form.reset(defaultValues);
  }, [defaultValues]);

  return (
    <div className="h-screen w-full flex items-start justify-center p-6">
      <div className="w-full max-w-xl space-y-8">
        <h1 className="text-xl font-semibold">
          {isNew ? "Create Product" : "Edit Product"}
        </h1>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            form.handleSubmit();
          }}
          className="space-y-6"
        >
          <form.Field
            name="tenantStoreId"
            validators={{
              onChange: ({ value }) =>
                !value ? "Tenant store is required" : undefined,
            }}
            children={(field) => (
              <div className="grid gap-2">
                <Label htmlFor={field.name}>Tenant Store</Label>
                <Select
                  value={field.state.value}
                  onValueChange={(v) => field.handleChange(v)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a store" />
                  </SelectTrigger>
                  <SelectContent>
                    {tenantStores.map((s: any) => (
                      <SelectItem key={s._id} value={s._id}>
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FieldInfo field={field} />
              </div>
            )}
          />

          <form.Field
            name="categoryId"
            validators={{
              onChange: ({ value }) =>
                !value ? "Category is required" : undefined,
            }}
            children={(field) => (
              <div className="grid gap-2">
                <Label htmlFor={field.name}>Category</Label>
                <Select
                  value={field.state.value}
                  onValueChange={(v) => field.handleChange(v)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((c: any) => (
                      <SelectItem key={c._id} value={c._id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FieldInfo field={field} />
              </div>
            )}
          />

          <form.Field
            name="title"
            validators={{
              onChange: ({ value }) =>
                !value
                  ? "Title is required"
                  : value.length < 3
                    ? "Title must be at least 3 characters"
                    : undefined,
            }}
            children={(field) => (
              <div className="grid gap-2">
                <Label htmlFor={field.name}>Title</Label>
                <Input
                  id={field.name}
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                />
                <FieldInfo field={field} />
              </div>
            )}
          />

          <form.Field
            name="desc"
            validators={{
              onChange: ({ value }) =>
                !value
                  ? "Description is required"
                  : value.length < 3
                    ? "Description must be at least 3 characters"
                    : undefined,
            }}
            children={(field) => (
              <div className="grid gap-2">
                <Label htmlFor={field.name}>Description</Label>
                <Textarea
                  id={field.name}
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                />
                <FieldInfo field={field} />
              </div>
            )}
          />

          <form.Field
            name="price"
            validators={{
              onChange: ({ value }) =>
                isNaN(Number(value)) || Number(value) < 0
                  ? "Price must be a positive number"
                  : undefined,
            }}
            children={(field) => (
              <div className="grid gap-2">
                <Label htmlFor={field.name}>Price</Label>
                <Input
                  id={field.name}
                  type="number"
                  value={String(field.state.value)}
                  onChange={(e) =>
                    field.handleChange(
                      e.target.value === "" ? 0 : Number(e.target.value)
                    )
                  }
                />
                <FieldInfo field={field} />
              </div>
            )}
          />

          <form.Field
            name="discount"
            children={(field) => (
              <div className="grid gap-2">
                <Label htmlFor={field.name}>Discount</Label>
                <Input
                  id={field.name}
                  type="number"
                  value={String(field.state.value ?? "")}
                  onChange={(e) =>
                    field.handleChange(
                      e.target.value === "" ? undefined : Number(e.target.value)
                    )
                  }
                />
              </div>
            )}
          />

          <form.Field
            name="oldPrice"
            children={(field) => (
              <div className="grid gap-2">
                <Label htmlFor={field.name}>Old Price</Label>
                <Input
                  id={field.name}
                  type="number"
                  value={String(field.state.value ?? "")}
                  onChange={(e) =>
                    field.handleChange(
                      e.target.value === "" ? undefined : Number(e.target.value)
                    )
                  }
                />
              </div>
            )}
          />

          <form.Field
            name="stockingStrategy"
            children={(field) => (
              <div className="grid gap-2">
                <Label htmlFor={field.name}>Stocking Strategy</Label>
                <Select
                  value={field.state.value}
                  onValueChange={(v) => field.handleChange(v as any)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a strategy" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="on_demand">On Demand</SelectItem>
                    <SelectItem value="sizes_stock">Sizes Stock</SelectItem>
                    <SelectItem value="number_stock">Number Stock</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          />

          <form.Subscribe
            selector={(state) => [state.canSubmit, state.isSubmitting]}
            children={([canSubmit, isSubmitting]) => (
              <Button
                type="submit"
                className="max-w-40"
                variant="outline"
                disabled={!canSubmit}
              >
                {isSubmitting ? "..." : isNew ? "Create" : "Save"}
              </Button>
            )}
          />
        </form>
      </div>
    </div>
  );
}
