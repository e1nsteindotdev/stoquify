import { useRouter } from "@tanstack/react-router";
import { Duration, Effect } from "effect";
import { useEffect, useMemo, useRef } from "react";
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
import type { ProductImage, SKU } from "@/livestore/schema/products/types";
import type { NewVariantInput } from "@/livestore/schema/products/types";
import { Images } from "@/lib/services/images-service";
import { runtime } from "@/lib/effect-runtime";
import {
  compareVariants,
  compareSkus,
  extractExistingVariants,
  extractExistingSkus,
  type VariantInput,
  type QueryVariant,
  type SkuInput,
  type ExistingSku,
} from "@/lib/variants-helper";

export function ProductForm({ slug }: { slug?: string }) {
  const router = useRouter();
  const isNew = !slug || slug === "new";

  const { store } = useStore();

  const product = isNew ? undefined : store.query(products$(slug))?.[0];

  // Generate productId once and keep it stable for new products
  const newProductIdRef = useRef<string | null>(null);
  if (isNew && newProductIdRef.current === null) {
    newProductIdRef.current = crypto.randomUUID();
  }

  const productId = useMemo(() => {
    if (product?.id) return product.id;
    if (!isNew && slug) return slug;
    return newProductIdRef.current ?? crypto.randomUUID();
  }, [product, isNew, slug]);

  const variantKey = (name: string, options: string[]) =>
    `${name}|${[...options].sort().join("|")}`;

  const defaultValues = useMemo(() => {
    if (!product) {
      return {
        title: "",
        desc: "",
        categoryId: "",
        price: 0,
        cost: 0,
        discount: undefined,
        status: "incomplete" as const,
        quantity: 0,
        oldPrice: undefined,
        stockingStrategy: "by_variants" as const,
        images: [] as ProductImage[],
        variants: [] as NewVariantInput[],
        skus: [] as SKU[],
        collections: new Set<string>(),
      };
    }

    const collections = new Set((product.collections ?? []).map((c) => c.id));
    const images: ProductImage[] = (product.images ?? []).map((img) => ({
      id: img.id,
      shop_id: product.shop_id,
      product_id: product.id,
      url: img.url,
      indexedDBId: (img as any).indexedDBId || null,
      displayOrder: img.displayOrder,
      hidden: img.hidden ? 1 : 0,
      createdAt: img.createdAt ? new Date(img.createdAt) : new Date(),
      deletedAt: null,
    }));

    // Extract SKUs from all variants (SKUs are stored on each variant in the query)
    const skus: SKU[] = [];
    product.variants?.forEach((variant) => {
      if (variant.skus && Array.isArray(variant.skus)) {
        variant.skus.forEach((sku) => {
          // Only add unique SKUs
          if (!skus.find((s) => s.id === sku.id)) {
            skus.push({
              id: sku.id,
              shop_id: product.shop_id,
              product_id: product.id,
              quantity: sku.quantity ?? 0,
              options: sku.options || {},
              createdAt: sku.createdAt ? new Date(sku.createdAt) : new Date(),
              deletedAt: null,
            });
          }
        });
      }
    });

    // Transform variants to NewVariantInput format
    const variants: NewVariantInput[] = (product.variants ?? []).map((v) => ({
      name: v.name,
      options: [...(v.options || [])],
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
      variants,
      skus,
      collections,
    };
  }, [product]);

  const form = useAppForm({
    defaultValues,
    onSubmit: ({ value }) => {
      const program = Effect.gen(function* () {
        const { skus, images, variants, collections, ...productValues } = value;

        const createdAt = new Date();
        const deletedAt = new Date();

        const shopId = store.query(shopId$);
        yield* Effect.annotateCurrentSpan({
          "event.type": isNew ? "create" : "update",
          "shop.id": shopId,
          timestamp: Date.now(),
        });
        // extract out the attributes for the products table.
        const productValuesToInsert = {
          title: productValues.title,
          desc: productValues.desc || null,
          category_id: productValues.categoryId,
          price: Number(productValues.price),
          cost:
            productValues.cost === null || productValues.cost === undefined
              ? null
              : String(productValues.cost).trim() === ""
                ? null
                : Number(productValues.cost),
          status: productValues.status,
          discount: productValues.discount ?? null,
          oldPrice: productValues.oldPrice ?? null,
          stockingStrategy: productValues.stockingStrategy,
          quantity: productValues.quantity ?? null,
          createdAt,
          deletedAt: null,
        };

        // handle only the product table
        if (isNew) {
          yield* Effect.try({
            try: () => {
              store.commit(
                events.productInserted({
                  id: productId,
                  shop_id: shopId,
                  ...productValuesToInsert,
                } as any),
              );
            },
            catch: (e) =>
              Effect.gen(function* () {
                yield* Effect.annotateCurrentSpan({
                  productInsertion: {
                    "form.status": "failed",
                    error: String(e),
                  },
                });
                return yield* Effect.fail(
                  new Error("Failed to insert the new product"),
                );
              }),
          });
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

        yield* Effect.sleep(10);

        // Track all image processing contexts for final summary
        const imageContexts: { id: string; ctx: any }[] = [];

        const imageService = yield* Images;
        // handle images
        yield* Effect.forEach(
          images,
          (image) => {
            let ctx: any | null = null;
            let imageStartTime = 0;

            return Effect.gen(function* () {
              const isNewImage = !product?.images.some(
                (oldImage) => oldImage.id === image.id,
              );

              if (!isNewImage) {
                // Handle existing image updates
                yield* Effect.sync(() =>
                  store.commit(
                    events.productImagePartialUpdated({
                      id: image.id,
                      product_id: productId,
                      url: image.url,
                      indexedDBId: image.indexedDBId,
                      displayOrder: image.displayOrder,
                      hidden: image.hidden,
                      createdAt: image.createdAt,
                      deletedAt: image.deletedAt,
                    }),
                  ),
                );

                // Delete from local storage if image is marked as deleted
                if (image.deletedAt !== null && image.indexedDBId) {
                  yield* imageService
                    .deleteLocalImage(image.indexedDBId)
                    .pipe(
                      Effect.catchAll((error) =>
                        Effect.sync(() =>
                          console.error("Failed to delete local image:", error),
                        ),
                      ),
                    );
                }

                return;
              }

              if (image.deletedAt !== null) {
                return;
              }

              ctx = {
                imageType: "unknown",
                originalSize: 0,
                compressedSize: 0,
                totalDurationMs: 0,
                status: "success",
                localCompression: {
                  status: "success",
                  durationMs: 0,
                  error: null,
                },
                localSave: { status: "success", durationMs: 0, error: null },
                cloudUpload: { status: "success", durationMs: 0, error: null },
                livestore: { status: "success", durationMs: 0, error: null },
              };

              imageContexts.push({ id: image.id, ctx });
              imageStartTime = Date.now();

              // Step 1: Compression (blocking - fail stops this image)
              const compressionStart = Date.now();
              const compressionResult = yield* imageService
                .compressImageLocally(image.url)
                .pipe(
                  Effect.tap(({ originalSizeKb, compressedSizeKb }) => {
                    ctx.imageType = "avif";
                    ctx.originalSize = originalSizeKb;
                    ctx.compressedSize = compressedSizeKb;
                    ctx.localCompression = {
                      status: "success",
                      durationMs: Date.now() - compressionStart,
                      error: null,
                    };
                  }),
                  Effect.catchAll((error) => {
                    ctx.localCompression = {
                      status: "failed",
                      durationMs: Date.now() - compressionStart,
                      error: String(error),
                    };
                    ctx.status = "failed";
                    return Effect.fail(error);
                  }),
                );

              // Step 2: Local Save (non-blocking - continue even if fails)
              const localSaveStart = Date.now();
              const indexedDBId = yield* imageService
                .saveImageLocally(compressionResult.base64)
                .pipe(
                  Effect.tap(() => {
                    ctx.localSave = {
                      status: "success",
                      durationMs: Date.now() - localSaveStart,
                      error: null,
                    };
                  }),
                  Effect.catchAll((error) => {
                    ctx.localSave = {
                      status: "failed",
                      durationMs: Date.now() - localSaveStart,
                      error: String(error),
                    };
                    return Effect.succeed(null as number | null);
                  }),
                );

              // Step 3: Cloud Upload (blocking - fail stops this image)
              const cloudUploadStart = Date.now();
              const imageCloudUrl = yield* imageService
                .uploadImageToCloud(compressionResult.file)
                .pipe(
                  Effect.tap(() => {
                    ctx.cloudUpload = {
                      status: "success",
                      durationMs: Date.now() - cloudUploadStart,
                      error: null,
                    };
                  }),
                  Effect.catchAll((error) => {
                    ctx.cloudUpload = {
                      status: "failed",
                      durationMs: Date.now() - cloudUploadStart,
                      error: String(error),
                    };
                    ctx.status = "failed";
                    return Effect.fail(error);
                  }),
                );

              // Step 4: Livestore (blocking - fail stops this image)
              const livestoreStart = Date.now();
              yield* Effect.sync(() =>
                store.commit(
                  events.productImageInserted({
                    id: image.id,
                    shop_id: shopId,
                    product_id: productId,
                    url: imageCloudUrl,
                    indexedDBId: indexedDBId,
                    displayOrder: image.displayOrder,
                    hidden: image.hidden,
                    createdAt: image.createdAt,
                    deletedAt: null,
                  }),
                ),
              ).pipe(
                Effect.tap(() => {
                  ctx.livestore = {
                    status: "success",
                    durationMs: Date.now() - livestoreStart,
                    error: null,
                  };
                }),
                Effect.catchAll((error) => {
                  ctx.livestore = {
                    status: "failed",
                    durationMs: Date.now() - livestoreStart,
                    error: String(error),
                  };
                  ctx.status = "failed";
                  return Effect.fail(error);
                }),
              );

              yield* Effect.sleep(5);
            }).pipe(
              Effect.catchAll(() => {
                if (ctx) {
                  ctx.status = "failed";
                }
                return Effect.void;
              }),
              Effect.ensuring(
                Effect.sync(() => {
                  if (ctx) {
                    ctx.totalDurationMs = Date.now() - imageStartTime;
                  }
                }),
              ),
            );
          },
          { concurrency: 1 },
        ).pipe(
          Effect.timed,
          Effect.andThen(([duration]) =>
            Effect.gen(function* () {
              const msDuration = Duration.toMillis(duration);
              const successCount = imageContexts.filter(
                (item) => item.ctx.status === "success",
              ).length;
              const failedCount = imageContexts.filter(
                (item) => item.ctx.status === "failed",
              ).length;

              yield* Effect.annotateCurrentSpan({
                "images.summary.total": images.length,
                "images.summary.success": successCount,
                "images.summary.failed": failedCount,
                "images.summary.totalDurationMs": msDuration,
                "images.summary.averageDurationMs":
                  images.length > 0 ? msDuration / images.length : 0,
                images: imageContexts.map((ic) => ({
                  id: ic.id,
                  ...ic.ctx,
                })),
              });
            }),
          ),
        );

        yield* Effect.sleep(10);

        // Build a mapping of old option IDs to new option IDs for new products
        const variantOptionIdMapping = new Map<string, string>();

        // handle variants
        if (isNew) {
          // For new products, insert all variants and build ID mappings
          for (
            let variantIndex = 0;
            variantIndex < variants.length;
            variantIndex++
          ) {
            const variant = variants[variantIndex];
            const variantId = crypto.randomUUID();
            const options: Array<{
              id: string;
              value: string;
              createdAt: Date;
            }> = [];

            // Generate new option IDs and map old form IDs to new ones
            for (const option of variant.options) {
              const newOptionId = crypto.randomUUID();
              // Map the old option value/index to the new ID
              // We'll use a composite key: "variantName:optionValue"
              const oldOptionKey = `${variant.name}:${option}`;
              variantOptionIdMapping.set(oldOptionKey, newOptionId);
              options.push({
                id: newOptionId,
                value: option,
                createdAt,
              });
            }

            // Insert variant with options and empty skus array
            yield* Effect.try({
              try: () =>
                store.commit(
                  events.variantInserted({
                    id: variantId,
                    shop_id: shopId,
                    product_id: productId,
                    name: variant.name,
                    createdAt,
                    options,
                    skus: [],
                  }),
                ),
              catch: (e) => new Error(`Failed to insert variant: ${e}`),
            });

            // Set variant order
            yield* Effect.try({
              try: () =>
                store.commit(
                  (events as any).variantOrderUpdated({
                    id: variantId,
                    displayOrder: variantIndex + 1,
                  }),
                ),
              catch: (e) => new Error(`Failed to update variant order: ${e}`),
            });
          }
        } else {
          // For existing products, always compare and determine what to add/remove
          const existingVariants = extractExistingVariants(
            product as { variants?: QueryVariant[] } | undefined,
          );
          const variantIdByKey = new Map<string, string>();
          for (const existing of existingVariants) {
            variantIdByKey.set(
              variantKey(existing.name, existing.options),
              existing.id,
            );
          }
          const { toRemove, toAdd } = compareVariants(
            existingVariants,
            variants as unknown as VariantInput[],
          );

          // Delete variants that no longer exist
          for (const variantId of toRemove) {
            yield* Effect.try({
              try: () =>
                store.commit(
                  events.variantDeleted({
                    id: variantId,
                    deletedAt,
                  }),
                ),
              catch: (e) => new Error(`Failed to delete variant: ${e}`),
            });
          }

          // Insert new variants and build ID mappings
          for (
            let variantIndex = 0;
            variantIndex < toAdd.length;
            variantIndex++
          ) {
            const variant = toAdd[variantIndex];
            const variantId = crypto.randomUUID();
            variantIdByKey.set(
              variantKey(variant.name, variant.options),
              variantId,
            );
            const options: Array<{
              id: string;
              value: string;
              createdAt: Date;
            }> = [];

            // Generate new option IDs and map old form values to new IDs
            for (const option of variant.options) {
              const newOptionId = crypto.randomUUID();
              const oldOptionKey = `${variant.name}:${option}`;
              variantOptionIdMapping.set(oldOptionKey, newOptionId);
              options.push({
                id: newOptionId,
                value: option,
                createdAt,
              });
            }

            // Insert variant with options and empty skus array
            yield* Effect.try({
              try: () =>
                store.commit(
                  events.variantInserted({
                    id: variantId,
                    shop_id: shopId,
                    product_id: productId,
                    name: variant.name,
                    createdAt,
                    options,
                    skus: [],
                  }),
                ),
              catch: (e) => new Error(`Failed to insert variant: ${e}`),
            });
          }

          // Set variant order for all current variants (existing + new)
          for (let index = 0; index < variants.length; index++) {
            const variant = variants[index];
            const id = variantIdByKey.get(
              variantKey(variant.name, variant.options),
            );
            if (!id) continue;
            yield* Effect.try({
              try: () =>
                store.commit(
                  (events as any).variantOrderUpdated({
                    id,
                    displayOrder: index + 1,
                  }),
                ),
              catch: (e) => new Error(`Failed to update variant order: ${e}`),
            });
          }
        }

        // handle SKUs
        if (isNew) {
          // For new products, map old option IDs to new ones before inserting SKUs
          for (const sku of skus) {
            const mappedOptions: Record<string, { id: string; value: string }> =
              {};

            // Map each option in the SKU to use the newly generated IDs
            for (const [variantName, optionData] of Object.entries(
              sku.options,
            )) {
              const optionKey = `${variantName}:${optionData.value}`;
              const newOptionId = variantOptionIdMapping.get(optionKey);

              if (newOptionId) {
                mappedOptions[variantName] = {
                  id: newOptionId,
                  value: optionData.value,
                };
              } else {
                // Fallback: use original if mapping not found (shouldn't happen)
                mappedOptions[variantName] = optionData;
              }
            }

            yield* Effect.try({
              try: () =>
                store.commit(
                  events.skuInserted({
                    id: crypto.randomUUID(),
                    shop_id: shopId,
                    product_id: productId,
                    quantity: sku.quantity,
                    options: mappedOptions,
                    createdAt,
                    deletedAt: null,
                  }),
                ),
              catch: (e) => new Error(`Failed to insert SKU: ${e}`),
            });
          }
        } else {
          // For existing products, compare and determine what to add/remove/update
          const existingSkus = extractExistingSkus(
            product as
              | { variants?: Array<{ skus?: ExistingSku[] }> }
              | undefined,
          );

          const { toRemove, toUpdate, toInsert } = compareSkus(
            existingSkus,
            skus as SkuInput[],
          );

          // Delete SKUs that no longer exist
          for (const skuId of toRemove) {
            yield* Effect.try({
              try: () =>
                store.commit(
                  events.skuDeleted({
                    id: skuId,
                    deletedAt,
                  }),
                ),
              catch: (e) => new Error(`Failed to delete SKU: ${e}`),
            });
          }

          // Update SKUs with changed quantities
          for (const { id, quantity } of toUpdate) {
            yield* Effect.try({
              try: () =>
                store.commit(
                  events.skuPartialUpdated({
                    id,
                    quantity,
                  }),
                ),
              catch: (e) => new Error(`Failed to update SKU: ${e}`),
            });
          }

          // Insert new SKUs with mapped option IDs
          for (const sku of toInsert) {
            const mappedOptions: Record<string, { id: string; value: string }> =
              {};

            for (const [variantName, optionData] of Object.entries(
              sku.options,
            )) {
              const optionKey = `${variantName}:${optionData.value}`;
              const newOptionId = variantOptionIdMapping.get(optionKey);

              if (newOptionId) {
                mappedOptions[variantName] = {
                  id: newOptionId,
                  value: optionData.value,
                };
              } else {
                mappedOptions[variantName] = optionData;
              }
            }

            yield* Effect.try({
              try: () =>
                store.commit(
                  events.skuInserted({
                    id: crypto.randomUUID(),
                    shop_id: shopId,
                    product_id: productId,
                    quantity: sku.quantity,
                    options: mappedOptions,
                    createdAt,
                    deletedAt: null,
                  }),
                ),
              catch: (e) => new Error(`Failed to insert SKU: ${e}`),
            });
          }
        }

        //   // handle collections
        //   const currentCollectionIds = Array.from(collections);
        //   const previousCollectionIds = (product?.collections ?? []).map(
        //     (c) => c.id,
        //   );
        //   const collectionsChanged =
        //     currentCollectionIds.length !== previousCollectionIds.length ||
        //     !currentCollectionIds.every((id) => previousCollectionIds.includes(id));
        //
        //   if (collectionsChanged) {
        //     const newCollectionIds = currentCollectionIds.filter(
        //       (id) => !previousCollectionIds.includes(id),
        //     );
        //     const deletedCollections: CollectionWithProductId[] = (
        //       product?.collections ?? []
        //     ).filter(
        //       (oldC) => !currentCollectionIds.includes(oldC.id),
        //     ) as CollectionWithProductId[];
        //
        //     if (isNew) {
        //       newCollectionIds.forEach((collectionId) => {
        //         store.commit(
        //           events.collectionProductInserted({
        //             id: crypto.randomUUID(),
        //             shop_id: shopId,
        //             collection_id: collectionId,
        //             product_id: productId,
        //             createdAt,
        //             deletedAt: null,
        //           } as any),
        //         );
        //       });
        //     } else {
        //       deletedCollections.forEach((collection) => {
        //         store.commit(
        //           events.collectionProductDeleted({
        //             id: collection.collection_product_id,
        //             deletedAt: createdAt,
        //           }),
        //         );
        //       });
        //       newCollectionIds.forEach((collectionId) => {
        //         store.commit(
        //           events.collectionProductInserted({
        //             id: crypto.randomUUID(),
        //             shop_id: shopId,
        //             collection_id: collectionId,
        //             product_id: productId,
        //             createdAt,
        //             deletedAt: null,
        //           } as any),
        //         );
        //       });
        //     }
        //   }
        //
        if (isNew) {
          router.navigate({
            to: "/produits/$slug",
            params: { slug: productId },
          });
        }
      }).pipe(
        Effect.catchAll((e) =>
          Effect.annotateCurrentSpan({
            "form.error": e,
            "form.status": "failed",
          }).pipe(Effect.andThen(Effect.fail(e))),
        ),
        Effect.withSpan("ProductFormSubmit"),
      );
      return runtime.runPromise(program).catch((e) => {
        console.error("Form submission error:", e);
      });
    },
    // onSubmit: async ({ value }) => {
    //   console.log("submit in ", productId);
    //   const { images, variants, collections, ...productValues } = value;
    //   const createdAt = new Date();
    //   const deletedAt = new Date();
    //   const shopId = store.query(shopId$);
    //
    //   const productValuesToInsert = {
    //     title: productValues.title,
    //     desc: productValues.desc || null,
    //     category_id: productValues.categoryId,
    //     price: Number(productValues.price),
    //     cost: Number(productValues.cost) || null,
    //     status: productValues.status,
    //     discount: productValues.discount ?? null,
    //     oldPrice: productValues.oldPrice ?? null,
    //     stockingStrategy: productValues.stockingStrategy,
    //     quantity: productValues.quantity ?? null,
    //     createdAt,
    //     deletedAt: null,
    //   };
    //
    //   if (isNew) {
    //     store.commit(
    //       events.productInserted({
    //         id: productId,
    //         shop_id: shopId,
    //         ...productValuesToInsert,
    //       } as any),
    //     );
    //   } else {
    //     const {
    //       createdAt: _,
    //       deletedAt: __,
    //       ...updateValues
    //     } = productValuesToInsert;
    //     store.commit(
    //       events.productPartialUpdated({
    //         id: productId,
    //         ...updateValues,
    //       } as any),
    //     );
    //   }
    //
    //   // handle images - create productImageInserted events for all images
    //   if (images.length > 0) {
    //     images.forEach((image) => {
    //       const oldImage = product?.images.find(img => img.id === image.id)
    //       if (oldImage) {
    //         store.commit(
    //           events.productImagePartialUpdated({
    //             product_id: productId,
    //             url: image.url,
    //             localUrl: image.localUrl,
    //             displayOrder: image.displayOrder,
    //             hidden: image.hidden,
    //             createdAt: image.createdAt,
    //             deletedAt: null,
    //           }),
    //         );
    //       }
    //       store.commit(
    //         events.productImageInserted({
    //           id: image.id,
    //           shop_id: shopId,
    //           product_id: productId,
    //           url: image.url,
    //           localUrl: image.localUrl,
    //           displayOrder: image.displayOrder,
    //           hidden: image.hidden,
    //           createdAt: image.createdAt,
    //           deletedAt: null,
    //         }),
    //       );
    //     });
    //   }
    //
    //   // handle variants
    //   if (!form.getFieldMeta("variants")?.isDefaultValue) {
    //     const newVariants = variants.filter(
    //       (v) => !product?.variants.some((oldV) => oldV.id === v.id),
    //     );
    //     const deletedVariants = product?.variants.filter(
    //       (oldV) => !variants.some((v) => v.id === oldV.id),
    //     );
    //
    //     if (isNew) {
    //       newVariants.forEach((variant, variantIndex) => {
    //         const variantId = variant.id || crypto.randomUUID();
    //         const optionIds: string[] = [];
    //         const skuId = `SKU-${Math.floor(1000 + Math.random() * 9000)}`;
    //
    //         for (let i = 0; i < variant.options.length; i++) {
    //           const optionId = crypto.randomUUID();
    //           optionIds.push(optionId);
    //           store.commit(
    //             events.variantOptionInserted({
    //               id: optionId,
    //               shop_id: shopId,
    //               variant_id: variantId,
    //               value: variant.options[i],
    //               createdAt,
    //               deletedAt: null,
    //             }),
    //           );
    //         }
    //
    //         store.commit(
    //           events.skuInserted({
    //             id: skuId,
    //             shop_id: shopId,
    //             product_id: productId,
    //             quantity: 0,
    //             createdAt,
    //             deletedAt: null,
    //           }),
    //         );
    //
    //         for (const optionId of optionIds) {
    //           store.commit(
    //             events.skuOptionInserted({
    //               id: `${skuId}_${optionId}`,
    //               shop_id: shopId,
    //               sku_id: skuId,
    //               option_id: optionId,
    //               createdAt,
    //               deletedAt: null,
    //             }),
    //           );
    //         }
    //
    //         store.commit(
    //           events.variantInserted({
    //             id: variantId,
    //             shop_id: shopId,
    //             product_id: productId,
    //             name: variant.name,
    //             createdAt,
    //             options: optionIds.map((id, i) => ({
    //               id,
    //               value: variant.options[i],
    //               createdAt,
    //               deletedAt: null,
    //             })),
    //             skus: [
    //               {
    //                 id: skuId,
    //                 quantity: 0,
    //                 createdAt,
    //                 option_ids: optionIds,
    //               },
    //             ],
    //           }),
    //         );
    //
    //         store.commit(
    //           (events as any).variantOrderUpdated({
    //             id: variantId,
    //             displayOrder: variantIndex + 1,
    //           }),
    //         );
    //       });
    //     } else {
    //       deletedVariants?.forEach((variant) => {
    //         store.commit(events.variantDeleted({ id: variant.id, deletedAt }));
    //       });
    //       newVariants.forEach((variant, variantIndex) => {
    //         const variantId = crypto.randomUUID();
    //         const optionIds: string[] = [];
    //         const skuId = `SKU-${Math.floor(1000 + Math.random() * 9000)}`;
    //
    //         for (let i = 0; i < variant.options.length; i++) {
    //           const optionId = crypto.randomUUID();
    //           optionIds.push(optionId);
    //           store.commit(
    //             events.variantOptionInserted({
    //               id: optionId,
    //               shop_id: shopId,
    //               variant_id: variantId,
    //               value: variant.options[i],
    //               createdAt,
    //               deletedAt: null,
    //             }),
    //           );
    //         }
    //
    //         store.commit(
    //           events.skuInserted({
    //             id: skuId,
    //             shop_id: shopId,
    //             product_id: productId,
    //             quantity: 0,
    //             createdAt,
    //             deletedAt: null,
    //           }),
    //         );
    //
    //         for (const optionId of optionIds) {
    //           store.commit(
    //             events.skuOptionInserted({
    //               id: `${skuId}_${optionId}`,
    //               shop_id: shopId,
    //               sku_id: skuId,
    //               option_id: optionId,
    //               createdAt,
    //               deletedAt: null,
    //             }),
    //           );
    //         }
    //
    //         store.commit(
    //           events.variantInserted({
    //             id: variantId,
    //             shop_id: shopId,
    //             product_id: productId,
    //             name: variant.name,
    //             createdAt,
    //             options: optionIds.map((id, i) => ({
    //               id,
    //               value: variant.options[i],
    //               createdAt,
    //             })),
    //             skus: [
    //               {
    //                 id: skuId,
    //                 quantity: 0,
    //                 createdAt,
    //                 option_ids: optionIds,
    //               },
    //             ],
    //           }),
    //         );
    //
    //         store.commit(
    //           (events as any).variantOrderUpdated({
    //             id: variantId,
    //             displayOrder: variantIndex + 1,
    //           }),
    //         );
    //       });
    //     }
    //   }
    //
    //   // handle collections
    //   const currentCollectionIds = Array.from(collections);
    //   const previousCollectionIds = (product?.collections ?? []).map(
    //     (c) => c.id,
    //   );
    //   const collectionsChanged =
    //     currentCollectionIds.length !== previousCollectionIds.length ||
    //     !currentCollectionIds.every((id) => previousCollectionIds.includes(id));
    //
    //   if (collectionsChanged) {
    //     const newCollectionIds = currentCollectionIds.filter(
    //       (id) => !previousCollectionIds.includes(id),
    //     );
    //     const deletedCollections: CollectionWithProductId[] = (
    //       product?.collections ?? []
    //     ).filter(
    //       (oldC) => !currentCollectionIds.includes(oldC.id),
    //     ) as CollectionWithProductId[];
    //
    //     if (isNew) {
    //       newCollectionIds.forEach((collectionId) => {
    //         store.commit(
    //           events.collectionProductInserted({
    //             id: crypto.randomUUID(),
    //             shop_id: shopId,
    //             collection_id: collectionId,
    //             product_id: productId,
    //             createdAt,
    //             deletedAt: null,
    //           } as any),
    //         );
    //       });
    //     } else {
    //       deletedCollections.forEach((collection) => {
    //         store.commit(
    //           events.collectionProductDeleted({
    //             id: collection.collection_product_id,
    //             deletedAt: createdAt,
    //           }),
    //         );
    //       });
    //       newCollectionIds.forEach((collectionId) => {
    //         store.commit(
    //           events.collectionProductInserted({
    //             id: crypto.randomUUID(),
    //             shop_id: shopId,
    //             collection_id: collectionId,
    //             product_id: productId,
    //             createdAt,
    //             deletedAt: null,
    //           } as any),
    //         );
    //       });
    //     }
    //   }
    //
    //   if (isNew) {
    //     router.navigate({ to: "/produits/$slug", params: { slug: productId } });
    //   }
    // },
  });

  // Keep form in sync when product loads
  useEffect(() => {
    if (!product?.id) return;
    if (form.state.isDirty) return;
    form.reset(defaultValues);
  }, [product?.id, defaultValues, form]);

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
                    <field.ImageField
                      oldImages={
                        (product?.images as Array<{ id: string }>) ?? null
                      }
                      productId={productId}
                      label="Photos"
                    />
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
                    skus: state.values.skus,
                  })}
                  children={({ variants, strat, skus }) => {
                    return (
                      <form.AppField
                        name="skus"
                        children={(field) => (
                          <field.StockageField
                            strat={strat}
                            variants={variants}
                            skus={skus}
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
                    selector={(state) => ({
                      categoryId: state.values.categoryId,
                      price: state.values.price,
                      title: state.values.title,
                      images: state.values.images,
                    })}
                    children={({ categoryId, price, title, images }) => {
                      const isCompleted =
                        Boolean(categoryId) &&
                        Boolean(title) &&
                        Number(price) > 0 &&
                        (images?.length ?? 0) > 0;

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
                  disabled={!canSubmit || (!!slug && !isDirty)}
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
