import { useRouter } from "@tanstack/react-router";
import { useEffect, useMemo, useState, useTransition } from "react";
import { type AnyFieldApi } from "@tanstack/react-form";
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
import { productsCollection, useGetProductById } from "@/database/products";
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
import { useAppStore } from "@/lib/store";
import { effectRuntime } from "@/lib/effect-runtime";
import { queryClient } from "@/lib/ts-query-client";
import { AnimatedButton } from "@/components/ui/animated-button";
import { CheckIcon } from "lucide-react";
import { ClipLoader } from "react-spinners";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

export function ProductFormSkeleton() {
  return (
    <div className="w-full flex items-start justify-center p-6 pb-20">
      <div className="w-full max-w-6xl space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
          <div className="space-y-6">
            <div className="flex flex-col gap-3">
              <InputsTitle>
                <Skeleton className="h-8 w-64" />
              </InputsTitle>
              <InputsContainer>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-12" />
                  <Skeleton className="h-10 w-full" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-32 w-full" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-12" />
                  <Skeleton className="h-40 w-full" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-10 w-full" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-12" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-12" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                </div>
              </InputsContainer>
            </div>
            <div className="flex flex-col gap-3">
              <InputsTitle>
                <Skeleton className="h-6 w-24" />
              </InputsTitle>
              <InputsContainer>
                <Skeleton className="h-40 w-full" />
              </InputsContainer>
            </div>
            <div className="flex flex-col gap-3">
              <InputsTitle>
                <Skeleton className="h-6 w-24" />
              </InputsTitle>
              <InputsContainer>
                <Skeleton className="h-40 w-full" />
              </InputsContainer>
            </div>
          </div>
          <div className="flex flex-col justify-start gap-y-12 items-between pt-11.5">
            <div className="space-y-4">
              <Card className="gap-2 border-white">
                <CardHeader>
                  <CardTitle>
                    <Skeleton className="h-6 w-16" />
                  </CardTitle>
                  <CardDescription>
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-10 w-full" />
                </CardContent>
              </Card>
              <InputsContainer>
                <Skeleton className="h-10 w-full" />
              </InputsContainer>
            </div>
            <Skeleton className="h-12 w-full" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function ProductForm({ slug }: { slug?: Id<"products"> | "new" }) {
  const isNew = !slug || slug === "new";
  const productId: Id<"products"> | null = isNew ? null : slug;
  const product = productId != null ? useGetProductById(productId) : undefined;
  const router = useRouter();
  const selectedStore = useAppStore((state) => state.selectedStore);

  const [isReady, setIsReady] = useState(false);
  const [, startTransition] = useTransition();

  useEffect(() => {
    startTransition(() => {
      setIsReady(true);
    });
  }, []);

  const defaultImages = useMemo(
    () => decodeImages(product?.images),
    [product?.images],
  );
  const defaultVariants = useMemo(
    () => decodeVariants(product?.variants),
    [product?.variants],
  );
  const defaultSKUs = useMemo(() => decodeSKUs(product?.skus), [product?.skus]);

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
      collections: product?.collections.map((col) => col._id) ?? [],
    }),
    [product, defaultImages, defaultVariants, defaultSKUs],
  );

  const form = useAppForm({
    defaultValues,
    onSubmit: async ({ value }) => {
      const { images, skus, variants, ...newProduct } = value;

      const imageChanges = getImageChanges(defaultImages, images);
      const variantChanges = getVariantChanges(defaultVariants, variants);

      const program = Effect.gen(function* () {
        // upload new images to the cloud
        const imageService = yield* Images;
        let ensuredProductId = productId;
        if (!ensuredProductId) {
          if (!selectedStore?._id) {
            throw new Error("Veuillez sélectionner une boutique");
          }
          const { productId: newProductId } = yield* Effect.promise(() =>
            convex.mutation(api.products.createProduct, {
              ...newProduct,
              collections: [...newProduct.collections],
              storeId: selectedStore._id,
            }),
          );
          if (newProductId) {
            ensuredProductId = newProductId;
          }
        }
        if (!ensuredProductId) return;

        const updateProductMetaData = Effect.gen(function* () {
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
            if (productChanges || newProduct.collections) {
              return yield* Effect.promise(() =>
                convex.mutation(api.products.updateProductMetaData, {
                  productId: ensuredProductId,
                  ...productChanges,
                  collections: [...newProduct.collections],
                }),
              );
            }
          } else return yield* Effect.succeed(null);
        });

        const uploadImages = Effect.gen(function* () {
          const result = { ok: false };
          imageChanges.toCreate = yield* Effect.forEach(
            imageChanges.toCreate,
            (image) =>
              Effect.gen(function* () {
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

        const handleImages = Effect.gen(function* () {
          yield* uploadImages;
          yield* Effect.forEach(imageChanges.toCreate, (img) =>
            Effect.gen(function* () {
              if (!img.compressedFile) return null;
              const indexedDBId = yield* imageService.saveImageLocally(
                img.compressedFile,
              );
              const imageIndex = imageChanges.toCreate.findIndex(
                (img_) => img_.tempId === img.tempId,
              );
              imageChanges.toCreate[imageIndex].indexedDBId = indexedDBId;
            }),
          );

          return yield* Effect.promise(() =>
            convex.mutation(api.images.handleImageChanges, {
              productId: ensuredProductId as Id<"products">,
              toCreate: imageChanges.toCreate.map((img) => ({
                url: img.url,
                order: img.order,
                hidden: img.hidden,
                indexedDBId: img.indexedDBId,
              })),
              toUpdate: imageChanges.toUpdate.map((img) => ({
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
        });

        const handleVariants = Effect.gen(function* () {
          if (!variantChanges)
            return yield* Effect.succeed({
              ok: true,
              options: new Map(
                defaultVariants.flatMap((variant) =>
                  variant.options.map((opt) => [
                    opt.name,
                    opt.tempId as Id<"variantOptions">,
                  ]),
                ),
              ),
            });
          const result = yield* Effect.promise(() =>
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
          return {
            ok: result.ok,
            options: new Map(result.options.map((opt) => [opt.name, opt._id])),
          };
        });

        const handleSKUs = (options: Map<string, Id<"variantOptions">>) =>
          Effect.gen(function* () {
            return yield* Effect.promise(() =>
              convex.mutation(api.skus.replaceSKUs, {
                productId: ensuredProductId as Id<"products">,
                skus: skus.map((sku) => ({
                  quantity: sku.quantity,
                  options: sku.options
                    .map((opt) => options.get(opt.optionName))
                    .filter((v) => v != undefined),
                })),
              }),
            );
          });

        yield* Effect.all(
          [
            updateProductMetaData,
            handleImages,
            handleVariants.pipe(
              Effect.andThen(({ ok, options }) => {
                if (!ok) return;
                return handleSKUs(options);
              }),
            ),
          ],
          { concurrency: "unbounded" },
        );

        return { productId: ensuredProductId };
      }).pipe(
        Effect.ensuring(Effect.promise(() => productsCollection.preload())),
      );

      const submitResult = await effectRuntime.runPromise(program).catch(() => {
        toast.error("Erreur lors de l'enregistrement");
        return null;
      });

      try {
        await productsCollection.preload();
      } catch (e) {
        toast.error(
          "Mode hors-ligne: Les données seront synchronisées plus tard",
        );
      }

      if (submitResult?.productId && isNew) {
        router.navigate({
          to: "/produits/$slug",
          params: { slug: submitResult.productId },
        });
      } else if (submitResult?.productId) {
        form.reset(value);
      }
    },
  });

  // Keep form in sync when product loads
  useEffect(() => {
    form.reset(defaultValues);
  }, [defaultValues]);

  // Auto-activate status when product becomes complete
  useEffect(() => {
    const { categoryId, title, price, images, status } = form.state.values;
    const isComplete = !!(categoryId && title && price && images?.length);
    if (isComplete && status === "incomplete") {
      form.setFieldValue("status", "active");
    }
  }, [
    form.state.values.categoryId,
    form.state.values.title,
    form.state.values.price,
    form.state.values.images,
    form.state.values.status,
  ]);

  if (!isReady || (!isNew && !product)) {
    return <ProductFormSkeleton />;
  }

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
              <InputsTitle className="tracking-tight">
                {isNew
                  ? "Créer un nouveau produit"
                  : "Mettre à jour le produit"}
              </InputsTitle>
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
                        <field.TextField
                          isNumber={true}
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
          <div className="flex flex-col justify-start gap-y-12 items-between pt-11.5">
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
                    children={([categoryId, price, title, images]) => {
                      const isComplete = !!(
                        categoryId &&
                        title &&
                        price &&
                        (images as any)?.length
                      );
                      return (
                        <form.Field
                          name="status"
                          children={(field) => (
                            <Select
                              value={field.state.value as string}
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
                                  disabled={!isComplete}
                                >
                                  caché
                                </SelectItem>
                                <SelectItem
                                  value="active"
                                  disabled={!isComplete}
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
            </div>

            <form.Subscribe
              selector={(state) => [
                state.canSubmit,
                state.isSubmitting,
                state.isDirty,
              ]}
              children={([canSubmit, isSubmitting, isDirty]) => (
                <AnimatedButton
                  type="submit"
                  className="w-full text-[16px] py-2 bg-primary text-white font-semidbold disabled:pointer-events-none disabled:bg-primary/50 font-semibold uppercase"
                  loading={isSubmitting}
                  disabled={!canSubmit || !isDirty}
                  animationComponents={{
                    loading: (
                      <span className="flex items-center gap-2">
                        <ClipLoader size={18} color="currentColor" /> en cours
                      </span>
                    ),
                    done: (
                      <span className="flex items-center gap-2">
                        <CheckIcon className="size-5" /> c'est bon
                      </span>
                    ),
                  }}
                >
                  enregistrer
                </AnimatedButton>
              )}
            />
          </div>

          {/* Submit button aligned to bottom right like the screenshot */}
        </form>
      </div>
    </div>
  );
}
