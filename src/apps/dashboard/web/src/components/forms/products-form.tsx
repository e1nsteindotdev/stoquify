import { useRouter } from "@tanstack/react-router";
import { useEffect, useMemo } from "react";
import {
  type AnyFieldApi,
} from "@tanstack/react-form";
import { useMutation, useQuery, useConvex } from "convex/react";
import { api } from "api/convex";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { InputsContainer, InputsTitle } from "../ui/inputs-container";
import { useAppForm } from "@/hooks/form";

export function ProductForm({ slug }: { slug?: string }) {
  const router = useRouter();
  const isNew = !slug || slug === "new";
  const productId = slug ?? ""

  const product = useQuery(
    api.products.getProductById,
    isNew ? ("skip" as any) : { id: slug as any }
  );

  const categories = useQuery(api.products.listCategories) ?? [];
  const createProduct = useMutation(api.products.createProduct);
  const updateProduct = useMutation(api.products.updateProduct);

  const defaultValues = useMemo(
    () => ({
      categoryId: product?.categoryId ?? "",
      title: product?.title ?? "",
      desc: product?.desc ?? "",
      price: product?.price ?? 0,
      discount: product?.discount ?? undefined,
      oldPrice: product?.oldPrice ?? undefined,
      stockingStrategy: product?.stockingStrategy ?? "on_demand",
      status: product?.status ?? "active",
      images: (product as any)?.images ?? [],
    }),
    [product]
  );

  const form = useAppForm({
    defaultValues,
    onSubmit: async ({ value }) => {
      if (isNew) {
        const id = await createProduct({
          title: value.title,
          desc: value.desc,
          price: Number(value.price),
          discount: value.discount ?? undefined,
          oldPrice: value.oldPrice ?? undefined,
          categoryId: value.categoryId as any,
          status: value.status as any,
          images: value.images as any,
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
          status: value.status as any,
          images: value.images as any,
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
      <div className="w-full max-w-6xl space-y-6">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            form.handleSubmit();
          }}
          className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6"
        >
          {/* Left column: main product info */}
          <div className="space-y-6">
            <div className="flex flex-col gap-3">
              <InputsTitle>Produtis</InputsTitle>
              <InputsContainer>
                <form.AppField
                  name="title"
                  children={(field) => <field.TextField placeholder="Hoodie noire oversize" label="Title" />}
                />
                <form.AppField
                  name="desc"
                  children={(field) =>
                    <field.TextAreaField placeholder="this is ltrly the best product in the entire world..." label="Desc" />}
                />

                <form.AppField
                  name="images"
                  children={(field) =>
                    <field.ImageField productId={productId} label="Photos" />}
                />

              </InputsContainer>
            </div>
          </div>

          {/* Right column: meta */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-2">
                  <form.Field
                    name="status"
                    children={(field) => (
                      <Select
                        value={field.state.value}
                        onValueChange={(v) => field.handleChange(v as any)}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="inactive">Inactive</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Produit Statistics</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground space-y-1">
                <div>
                  Ventes : <span className="text-foreground">—</span>
                </div>
                <div>
                  Money generated : <span className="text-foreground">—</span>
                </div>
                <div>
                  Classement : <span className="text-foreground">—</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Submit button aligned to bottom right like the screenshot */}
          <div className="lg:col-span-2 flex justify-end">
            <form.Subscribe
              selector={(state) => [state.canSubmit, state.isSubmitting]}
              children={([canSubmit, isSubmitting]) => (
                <Button type="submit" disabled={!canSubmit}>
                  {isSubmitting ? "..." : "Enregistrer"}
                </Button>
              )}
            />
          </div>
        </form>
      </div>
    </div>
  );
}

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
