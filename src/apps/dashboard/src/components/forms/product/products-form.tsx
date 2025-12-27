import { useRouter } from "@tanstack/react-router";
import { useEffect, useMemo } from "react";
import { type AnyFieldApi } from "@tanstack/react-form";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { InputsContainer, InputsTitle } from "../../ui/inputs-container";
import { useAppForm } from "@/hooks/form";
import { type Id } from "api/data-model";
import { formatVariantsInventory } from "@/hooks/useVariantActions";
import { useInitiateProduct, useUpdateProduct } from "@/hooks/use-convex-queries";
import { productsCollection, useGetProductById } from "@/database/products";
import { useGetSelectedCollectionIds } from "@/database/collections";

export function ProductForm({ slug }: { slug?: Id<"products"> | "new" }) {
  const router = useRouter();
  const isNew = !slug || slug === "new";
  const productId: Id<"products"> | null = isNew ? null : slug;
  const initiateProduct = useInitiateProduct();
  const updateProduct = useUpdateProduct();

  const { data: product } = useGetProductById(isNew ? undefined : slug as Id<"products">);
  const { data: selectedCollectionIds } = useGetSelectedCollectionIds(product?._id);
  const productCollections = new Set(selectedCollectionIds ?? []);

  const defaultValues = useMemo(
    () => ({
      categoryId: product?.categoryId ?? "",
      title: product?.title ?? "",
      desc: product?.desc ?? "",
      price: product?.price ?? 0,
      cost: product?.cost ?? 0,
      discount: product?.discount ?? undefined,
      oldPrice: product?.oldPrice ?? undefined,
      stockingStrategy: product?.stockingStrategy ?? "by_variants",
      status: product?.status ?? "incomplete",
      images: product?.images ?? [],
      variants: product?.variants ?? [],
      variantsInventory: product?.variantsInventory ? formatVariantsInventory(product.variantsInventory) : new Map(),
      collections: productCollections ?? []
    }),
    [product, productCollections]
  );

  const form = useAppForm({
    defaultValues,
    onSubmit: async ({ value }: { value: any }) => {
      // because somehow value.images is an object
      if (value.images) value.images = Object.values(value.images)
      if (value.variantsInventory) {
        value['variantsInventory'] = [...value.variantsInventory.values()].map(v => v) as any
      }
      value.price = Number(value.price) ?? 0
      value.cost = Number(value.cost) ?? 0
      const dirtyValues = Object.fromEntries(
        Object.entries(value).filter(([k]) => {
          const decision = form.getFieldMeta(k as any)?.isDefaultValue
          return !decision
        })
      );
      if (value.collections) {
        dirtyValues['collections'] = Array.from(value.collections)
      }

      if (isNew) {
        const id = await initiateProduct.mutateAsync({});
        await updateProduct.mutateAsync({ ...dirtyValues, productId: id } as any);
        router.navigate({ to: "/produits/$slug", params: { slug: id as any } });
      } else {
        if (productId) {
          dirtyValues["productId"] = productId;
          await updateProduct.mutateAsync(dirtyValues as any);
        }
      }
    },
  });

  // Keep form in sync when product loads
  useEffect(() => {
    form.reset(defaultValues);
  }, [defaultValues]);

  const isCompleted = (form.getFieldValue('images') && form.getFieldValue('price') !== 0 && form.getFieldValue('title') && form.getFieldValue('categoryId')) ? true : false


  return (
    <div className="w-full flex items-start justify-center p-6 pb-20">
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
              <InputsTitle>Produits</InputsTitle>
              <InputsContainer>
                <form.AppField
                  name="title"
                  children={(field) => (
                    <field.TextField
                      placeholder="Hoodie noire oversize"
                      label="Titre"
                    />
                  )}
                />
                <form.AppField
                  name="desc"
                  children={(field) => (
                    <field.TextAreaField
                      placeholder="Ceci est littéralement le meilleur produit au monde..."
                      label="Description"
                    />
                  )}
                />

                <form.AppField
                  name="images"
                  children={(field) => (
                    <field.ImageField productId={productId} label="Photos" />
                  )}
                />

                <form.AppField
                  name="categoryId"
                  children={(field) => (
                    <field.CategoriesField label="Catégorie" />
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <form.AppField
                    name="price"
                    children={(field) => (
                      <field.PricingField />
                    )}
                  />
                  <form.AppField
                    name="cost"
                    children={(field) => (
                      <div className="grid">
                        <Label className="font-semibold pb-[12px]">Coût</Label>
                        <field.TextField
                          type="number"
                          placeholder="2500"
                        />
                      </div>
                    )}
                  />
                </div>
              </InputsContainer>
            </div>


            <div className="flex flex-col gap-3">
              <InputsTitle>Variants</InputsTitle>
              <InputsContainer className="">
                <form.AppField
                  name="variants"
                  children={(field) => <field.VariantsField />}
                />
              </InputsContainer>
            </div>

            <div className="flex flex-col gap-3">
              <InputsTitle>Stockage</InputsTitle>
              <InputsContainer>

                <form.AppField
                  name="stockingStrategy"
                  children={(field) => (
                    <field.StockageStratField />
                  )} />

                <form.Subscribe
                  selector={(state) => ({ variants: state.values.variants, strat: state.values.stockingStrategy })}
                  children={({ variants, strat, }) => {
                    return (
                      <form.AppField
                        name="variantsInventory"
                        children={(field) => (
                          <field.StockageField
                            strat={strat}
                            variants={variants}
                          />
                        )}
                      />
                    )
                  }} />
              </InputsContainer>
            </div>
          </div>

          {/* Right column: meta */}
          <div className="flex flex-col justify-between items-between pt-11.5">
            <div className="space-y-4">
              <Card className="gap-2 border-white">
                <CardHeader>
                  <CardTitle>Statut</CardTitle>
                  <CardDescription>Vous devez remplir les champs importants pour pouvoir rendre le produit actif dans la boutique</CardDescription>
                </CardHeader>
                <CardContent>
                  <form.Subscribe
                    selector={(state) => [
                      state.values.categoryId,
                      state.values.price,
                      state.values.title,
                      state.values.images,
                    ]}
                    children={([categoryId, title, price, images]) => {
                      if (categoryId && title && price && images) {
                        form.setFieldValue("status", "active")
                      }
                      return (
                        <form.Field
                          name="status"
                          children={(field) => (
                            <Select
                              value={field.state.value}
                              onValueChange={(v) => field.handleChange(v as any)}
                            >
                              <SelectTrigger className="w-full">
                                <SelectValue placeholder="Sélectionner le statut" />
                              </SelectTrigger>
                              <SelectContent className="bg-card">
                                <SelectItem value="incomplete">incomplet</SelectItem>
                                <SelectItem value="hidden" disabled={!isCompleted}>caché</SelectItem>
                                <SelectItem value="active" disabled={!isCompleted}>actif</SelectItem>
                              </SelectContent>
                            </Select>
                          )}
                        />)
                    }}
                  />
                </CardContent>
              </Card>



              <form.Subscribe
                selector={(state) => [
                  state.values.collections,
                ]}
                children={([collections]) => <form.AppField
                  name="collections"
                  children={(field) => (
                    <field.CollectionsField selectedCollections={collections} />
                  )}
                />}
              />
              <Card className="gap-2 border-white">
                <CardHeader>
                  <CardTitle>Statistiques du produit</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground space-y-1">
                  <div>
                    Ventes : <span className="text-foreground">—</span>
                  </div>
                  <div>
                    Argent généré : <span className="text-foreground">—</span>
                  </div>
                  <div>
                    Classement : <span className="text-foreground">—</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            <form.Subscribe
              selector={(state) => [
                state.canSubmit,
                state.isSubmitting,
                state.isDirty,
              ]}
              children={([canSubmit, isSubmitting, isDirty]) => (
                <Button
                  type="submit"
                  className="w-full text-[16px] py-5"
                  disabled={!canSubmit || !isDirty}
                >
                  {isSubmitting ? "..." : "Enregistrer"}
                </Button>
              )}
            />
          </div>

          {/* Submit button aligned to bottom right like the screenshot */}
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
      {field.state.meta.isValidating ? "Validation..." : null}
    </>
  );
}
