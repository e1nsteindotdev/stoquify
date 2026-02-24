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
import StockageField from "./stockage-field";
import { type Id } from "api/data-model";
import { useGetProductById } from "@/database/products";
import { decodeVariants, decodeSKUs, decodeImages } from "../types";
import {
  getImageChanges,
  getProductChanges,
  getVariantChanges,
} from "../actions";

import { convex } from "@/lib/convex-client";
import { api } from "api/convex";
import { Effect } from "effect";
import { Images } from "@/lib/services/image-service";
import { effectRuntime } from "@/lib/effect-runtime";

export function ProductForm({ slug }: { slug?: Id<"products"> | "new" }) {
  const isNew = !slug || slug === "new";
  const productId: Id<"products"> | null = isNew ? null : slug;
  const product = productId != null ? useGetProductById(productId) : undefined;
  const router = useRouter();

  const defaultImages = decodeImages(product?.images);
  const defaultVariants = decodeVariants(product?.variants);
  const defaultSKUs = decodeSKUs(product?.skus);

  const defaultValues = useMemo(
    () => ({
      categoryId: product?.categoryId ?? undefined,
      title: product?.title ?? "",
      desc: product?.desc ?? "",
      price: product?.price ?? 0,
      cost: product?.cost ?? 0,
      discount: product?.discount ?? 0,
      oldPrice: product?.oldPrice ?? 0,
      stockingStrategy: product?.stockingStrategy ?? "by_variants",
      status: product?.status ?? "incomplete",
      images: defaultImages,
      variants: defaultVariants,
      skus: defaultSKUs,
      collections: new Set(product?.collections ?? []),
    }),
    [product],
  );

  const form = useAppForm({
    defaultValues,
    onSubmit: async ({ value }) => {
      const { images, skus, variants, ...newProduct } = value;

      const imageChanges = getImageChanges(defaultImages, images);
      const variantChanges = getVariantChanges(defaultVariants, variants);

      const program = Effect.gen(function*() {
        // upload new images to the cloud
        const imageService = yield* Images;
        let ensuredProductId = productId;

        if (!ensuredProductId) {
          const { productId: newProductId } = yield* Effect.promise(() =>
            convex.mutation(api.products.createProduct, {
              ...newProduct,
              collections: [...newProduct.collections],
            }),
          );
          if (newProductId) {
            ensuredProductId = newProductId;
          }
        }
        if (!ensuredProductId) return;

        const updateProductMetaData = Effect.gen(function*() {
          if (!isNew) {
            const productChanges = getProductChanges(product, {
              categoryId: newProduct.categoryId,
              title: newProduct.title,
              desc: newProduct.desc,
              price: newProduct.price,
              cost: newProduct.cost,
              discount: newProduct.discount,
              oldPrice: newProduct.oldPrice,
              stockingStrategy: newProduct.stockingStrategy,
              status: newProduct.status,
            });
            if (productChanges) {
              return yield* Effect.promise(() =>
                convex.mutation(api.products.updateProductMetaData, {
                  productId: ensuredProductId,
                  ...productChanges,
                }),
              );
            }
          } else return yield* Effect.succeed(null);
        });

        const uploadImages = Effect.gen(function*() {
          const imageChanges = getImageChanges(defaultImages, images);
          const result = { ok: false };
          imageChanges.toCreate = yield* Effect.forEach(
            imageChanges.toCreate,
            (image) =>
              Effect.gen(function*() {
                let compressedfile = image.compressedFile;
                if (!compressedfile) {
                  const { file } = yield* imageService.compressImageWithWorker(
                    image.originalFile!,
                    image.tempId,
                  );
                  compressedfile = file;
                }
                const url =
                  yield* imageService.uploadImageToCloud(compressedfile);
                result.ok = true;
                return { ...image, url };
              }),
            { concurrency: "unbounded" },
          );
          return result;
        });

        const writeImages = yield* Effect.promise(() =>
          convex.mutation(api.images.handleImageChanges, {
            productId: ensuredProductId as Id<"products">,
            toCreate: imageChanges.toCreate.map((img) => ({
              url: img.url,
              order: img.order,
              hidden: img.hidden,
              indexedDBId: img.indexedDBId,
            })),
            toUpdate: imageChanges.toCreate.map((img) => ({
              imageId: img.tempId as Id<"images">,
              url: img.url,
              order: img.order,
              hidden: img.hidden,
              indexedDBId: img.indexedDBId,
            })),
            toDelete: imageChanges.toDelete.map(
              (img) => img.tempId as Id<"images">,
            ),
          }),
        );

        const writeVariants = Effect.gen(function*() {
          if (!variantChanges) return yield* Effect.succeed({ ok: false });
          return yield* Effect.promise(() =>
            convex.mutation(api.variants.handleVariantChanges, {
              productId: ensuredProductId as Id<"products">,
              toDelete: variantChanges.toDelete.map(
                (v) => v.tempId as Id<"variants">,
              ),
              toUpdate: variantChanges.toUpdate.map((v) => ({
                variantId: v.tempId as Id<"variants">,
                name: v.name,
                order: v.order,
                options: v.options.map((o) => ({
                  order: o.order,
                  name: o.name,
                })),
              })),
              toCreate: variantChanges.toCreate.map((v) => ({
                name: v.name,
                order: v.order,
                options: v.options.map((o) => ({
                  order: o.order,
                  name: o.name,
                })),
              })),
            }),
          );
        });

        const writeSKUs = Effect.gen(function*() {
          const optionToVariantMap = new Map<string, string>();
          for (const v of variants) {
            for (const opt of v.options) {
              optionToVariantMap.set(opt.tempId, v.name);
            }
          }

          Effect.promise(() =>
            convex.mutation(api.skus.replaceSKUs, {
              productId: ensuredProductId as Id<"products">,
              skus: skus.map((sku) => ({
                quantity: sku.quantity,
                options: sku.options.map((opt) => {
                  const variantName = optionToVariantMap.get(opt.tempId) || "";
                  return {
                    variantName,
                    optionName: opt.optionName,
                  };
                }),
              })),
            }),
          );
        });

        yield* Effect.all(
          [
            updateProductMetaData,
            uploadImages.pipe(
              Effect.andThen(({ ok }) => {
                if (ok) return writeImages;
              }),
            ),
            writeVariants.pipe(
              Effect.andThen(({ ok }) => {
                if (ok) return writeSKUs;
              }),
            ),
          ],
          { concurrency: "unbounded" },
        );
        return { productId: ensuredProductId };
      });

      const submitResult = await effectRuntime.runPromise(program);
      if (submitResult?.productId && isNew) {
        router.navigate({
          to: "/produits/$slug",
          params: { slug: submitResult.productId },
        });
      }

    },
  });

  // Keep form in sync when product loads
  useEffect(() => {
    form.reset(defaultValues);
  }, [defaultValues]);

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
                  children={(field) => <field.VariantsField />}
                />
              </InputsContainer>
            </div>

            <div className="flex flex-col gap-3">
              <InputsTitle>Stockage</InputsTitle>
              <InputsContainer>
                <form.AppField
                  name="stockingStrategy"
                  children={(field) => <field.StockageStratField />}
                />

                <form.Subscribe
                  selector={(state) => ({
                    variants: state.values.variants,
                    strat: state.values.stockingStrategy,
                  })}
                  children={({ variants, strat }) => {
                    return (
                      <form.AppField
                        name="skus"
                        children={(field) => (
                          <StockageField
                            field={field}
                            strat={strat}
                            variants={variants}
                          />
                        )}
                      />
                    );
                  }}
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
