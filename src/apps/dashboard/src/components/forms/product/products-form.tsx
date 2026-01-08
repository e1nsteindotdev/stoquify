import { useRouter } from "@tanstack/react-router";
import { useEffect, useMemo } from "react";
import { type AnyFieldApi } from "@tanstack/react-form";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
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
import { InputsContainer, InputsTitle } from "../../ui/inputs-container";
import { useAppForm } from "@/hooks/form";
import { useStore } from "@livestore/react";
import { products$ } from "@/livestore/schema/products";
import { events, shopId$ } from "@/livestore/schema";
import type { ProductImage } from "@/livestore/schema/products/types";

export function ProductForm({ slug }: { slug?: string }) {
  const router = useRouter();
  const isNew = !slug || slug === "new";

  type CollectionWithProductId = {
    id: string;
    name: string;
    collection_product_id: string;
  };

  const { store } = useStore();

  const product = store.query(products$(slug))?.[0];
  const productId = useMemo(() => product?.id ?? crypto.randomUUID(), []);

  console.log(productId);

  const defaultValues = useMemo(() => {
    if (!product) {
      return {
        title: "Random Product Title",
        desc: "desc",
        categoryId: "",
        price: 12000,
        cost: 2500,
        discount: undefined,
        status: "incomplete" as const,
        quantity: 0,
        oldPrice: undefined,
        stockingStrategy: "by_variants" as const,
        images: [] as ProductImage[],
        variants: [],
        collections: new Set<string>(),
      };
    }

    const collections = new Set((product.collections ?? []).map((c) => c.id));
    const images: ProductImage[] = (product.images ?? []).map((img) => ({
      id: img.id,
      shop_id: product.shop_id,
      product_id: product.id,
      url: img.url,
      localUrl: (img as any).localUrl || img.url,
      displayOrder: img.displayOrder,
      hidden: img.hidden ? 1 : 0,
      createdAt: new Date(),
      deletedAt: null,
    }));
    return {
      title: product.title ?? "",
      desc: product.desc ?? "",
      categoryId: product.category_id ?? "",
      price: product.price ?? 0,
      cost: product.cost ?? 0,
      discount: product.discount ?? undefined,
      status: product.status ?? "incomplete",
      quantity: product.quantity ?? 0,
      oldPrice: product.oldPrice ?? undefined,
      stockingStrategy: product.stockingStrategy ?? "by_variants",
      images,
      variants: product.variants ?? [],
      collections,
    };
  }, []);

  const form = useAppForm({
    defaultValues,
    onSubmit: async ({ value }) => {
      const { images, variants, collections, ...productValues } = value;
      const createdAt = new Date();
      const deletedAt = new Date();
      const shopId = store.query(shopId$);

      const productValuesToInsert: Record<string, any> = {
        title: productValues.title,
        desc: productValues.desc || null,
        category_id: productValues.categoryId,
        price: Number(productValues.price),
        cost: Number(productValues.cost) || null,
        status: productValues.status,
        discount: productValues.discount ?? null,
        oldPrice: productValues.oldPrice ?? null,
        stockingStrategy: productValues.stockingStrategy,
        quantity: productValues.quantity ?? null,
        createdAt,
        deletedAt: null,
      };

      console.log("values : ", productValuesToInsert);

      if (isNew) {
        store.commit(
          events.productInserted({
            id: productId,
            shop_id: shopId,
            deletedAt: null,
            ...productValuesToInsert,
          } as any),
        );
      } else {
        const {
          createdAt: _,
          deletedAt: __,
          ...updateValues
        } = productValuesToInsert;
        store.commit(
          events.productPartialUpdated({
            id: productId,
            ...updateValues,
          } as any),
        );
      }

      // handle images - create productImageInserted events for all images
      if (images.length > 0) {
        images.forEach((image) => {
          console.log("inserting image into db :", image);
          store.commit(
            events.productImageInserted({
              id: image.id,
              shop_id: shopId,
              product_id: productId,
              url: image.url,
              localUrl: image.localUrl,
              displayOrder: image.displayOrder,
              hidden: image.hidden,
              createdAt: image.createdAt,
              deletedAt: null,
            } as any),
          );
        });
      }

      // handle variants
      if (!form.getFieldMeta("variants")?.isDefaultValue) {
        const newVariants = variants.filter(
          (v) => !product?.variants.some((oldV) => oldV.id === v.id),
        );
        const deletedVariants = product?.variants.filter(
          (oldV) => !variants.some((v) => v.id === oldV.id),
        );

        if (isNew) {
          newVariants.forEach((variant, variantIndex) => {
            const variantId = variant.id || crypto.randomUUID();
            const optionIds: string[] = [];
            const skuId = `SKU-${Math.floor(1000 + Math.random() * 9000)}`;

            for (let i = 0; i < variant.options.length; i++) {
              const optionId = crypto.randomUUID();
              optionIds.push(optionId);
              store.commit(
                events.variantOptionInserted({
                  id: optionId,
                  shop_id: shopId,
                  variant_id: variantId,
                  value: variant.options[i],
                  createdAt,
                  deletedAt: null,
                }),
              );
            }

            store.commit(
              events.skuInserted({
                id: skuId,
                shop_id: shopId,
                product_id: productId,
                quantity: 0,
                createdAt,
                deletedAt: null,
              }),
            );

            for (const optionId of optionIds) {
              store.commit(
                events.skuOptionInserted({
                  id: `${skuId}_${optionId}`,
                  shop_id: shopId,
                  sku_id: skuId,
                  option_id: optionId,
                  createdAt,
                  deletedAt: null,
                }),
              );
            }

            store.commit(
              events.variantInserted({
                id: variantId,
                shop_id: shopId,
                product_id: productId,
                name: variant.name,
                createdAt,
                options: optionIds.map((id, i) => ({
                  id,
                  value: variant.options[i],
                  createdAt,
                  deletedAt: null,
                })),
                skus: [
                  {
                    id: skuId,
                    quantity: 0,
                    createdAt,
                    option_ids: optionIds,
                  },
                ],
              }),
            );

            store.commit(
              (events as any).variantOrderUpdated({
                id: variantId,
                displayOrder: variantIndex + 1,
              }),
            );
          });
        } else {
          deletedVariants?.forEach((variant) => {
            store.commit(events.variantDeleted({ id: variant.id, deletedAt }));
          });
          newVariants.forEach((variant, variantIndex) => {
            const variantId = crypto.randomUUID();
            const optionIds: string[] = [];
            const skuId = `SKU-${Math.floor(1000 + Math.random() * 9000)}`;

            for (let i = 0; i < variant.options.length; i++) {
              const optionId = crypto.randomUUID();
              optionIds.push(optionId);
              store.commit(
                events.variantOptionInserted({
                  id: optionId,
                  shop_id: shopId,
                  variant_id: variantId,
                  value: variant.options[i],
                  createdAt,
                  deletedAt: null,
                }),
              );
            }

            store.commit(
              events.skuInserted({
                id: skuId,
                shop_id: shopId,
                product_id: productId,
                quantity: 0,
                createdAt,
                deletedAt: null,
              }),
            );

            for (const optionId of optionIds) {
              store.commit(
                events.skuOptionInserted({
                  id: `${skuId}_${optionId}`,
                  shop_id: shopId,
                  sku_id: skuId,
                  option_id: optionId,
                  createdAt,
                  deletedAt: null,
                }),
              );
            }

            store.commit(
              events.variantInserted({
                id: variantId,
                shop_id: shopId,
                product_id: productId,
                name: variant.name,
                createdAt,
                options: optionIds.map((id, i) => ({
                  id,
                  value: variant.options[i],
                  createdAt,
                })),
                skus: [
                  {
                    id: skuId,
                    quantity: 0,
                    createdAt,
                    option_ids: optionIds,
                  },
                ],
              }),
            );

            store.commit(
              (events as any).variantOrderUpdated({
                id: variantId,
                displayOrder: variantIndex + 1,
              }),
            );
          });
        }
      }

      // handle collections
      const currentCollectionIds = Array.from(collections);
      const previousCollectionIds = (product?.collections ?? []).map(
        (c) => c.id,
      );
      const collectionsChanged =
        currentCollectionIds.length !== previousCollectionIds.length ||
        !currentCollectionIds.every((id) => previousCollectionIds.includes(id));

      if (collectionsChanged) {
        const newCollectionIds = currentCollectionIds.filter(
          (id) => !previousCollectionIds.includes(id),
        );
        const deletedCollections: CollectionWithProductId[] = (
          product?.collections ?? []
        ).filter(
          (oldC) => !currentCollectionIds.includes(oldC.id),
        ) as CollectionWithProductId[];

        if (isNew) {
          newCollectionIds.forEach((collectionId) => {
            store.commit(
              events.collectionProductInserted({
                id: crypto.randomUUID(),
                shop_id: shopId,
                collection_id: collectionId,
                product_id: productId,
                createdAt,
                deletedAt: null,
              } as any),
            );
          });
        } else {
          deletedCollections.forEach((collection) => {
            store.commit(
              events.collectionProductDeleted({
                id: collection.collection_product_id,
                deletedAt: createdAt,
              }),
            );
          });
          newCollectionIds.forEach((collectionId) => {
            store.commit(
              events.collectionProductInserted({
                id: crypto.randomUUID(),
                shop_id: shopId,
                collection_id: collectionId,
                product_id: productId,
                createdAt,
                deletedAt: null,
              } as any),
            );
          });
        }
      }

      if (isNew) {
        router.navigate({ to: "/produits/$slug", params: { slug: productId } });
      }
    },
  });

  // Keep form in sync when product loads
  useEffect(() => {
    if (product?.id) {
      form.reset(defaultValues);
    }
  }, [product?.id]);

  const isCompleted =
    form.getFieldValue("images") &&
      form.getFieldValue("price") !== 0 &&
      form.getFieldValue("title") &&
      form.getFieldValue("categoryId")
      ? true
      : false;

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
                    children={(field) => <field.PricingField />}
                  />
                  <form.AppField
                    name="cost"
                    children={(field) => (
                      <div className="grid">
                        <Label className="font-semibold pb-[12px]">Coût</Label>
                        <field.TextField type="number" placeholder="2500" />
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
                  children={(field) => (
                    <field.VariantsField productId={productId} />
                  )}
                />
              </InputsContainer>
            </div>
          </div>

          {/* Right column: meta */}
          <div className="flex flex-col justify-between items-between pt-11.5">
            <div className="space-y-4">
              <Card className="gap-2 border-white">
                <CardHeader>
                  <CardTitle>Statut</CardTitle>
                  <CardDescription>
                    Vous devez remplir les champs importants pour pouvoir rendre
                    le produit actif dans la boutique
                  </CardDescription>
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
                        form.setFieldValue("status", "active");
                      }
                      return (
                        <form.Field
                          name="status"
                          children={(field) => (
                            <Select
                              value={field.state.value}
                              onValueChange={(v) =>
                                field.handleChange(v as any)
                              }
                            >
                              <SelectTrigger className="w-full">
                                <SelectValue placeholder="Sélectionner le statut" />
                              </SelectTrigger>
                              <SelectContent className="bg-card">
                                <SelectItem value="incomplete">
                                  incomplet
                                </SelectItem>
                                <SelectItem
                                  value="hidden"
                                  disabled={!isCompleted}
                                >
                                  caché
                                </SelectItem>
                                <SelectItem
                                  value="active"
                                  disabled={!isCompleted}
                                >
                                  actif
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          )}
                        />
                      );
                    }}
                  />
                </CardContent>
              </Card>

              <form.Subscribe
                selector={(state) => [state.values.collections]}
                children={([collections]) => (
                  <form.AppField
                    name="collections"
                    children={(field) => (
                      <field.CollectionsField
                        selectedCollections={collections}
                      />
                    )}
                  />
                )}
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
