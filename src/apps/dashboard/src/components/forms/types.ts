import type { TypeVariant, TypeSKU, TypeImage } from "api/types";

export type TypeDecodedVariant = {
  tempId: string;
  name: string;
  order: number;
  options: { tempId: string; order: number | undefined; name: string }[];
};

export const decodeVariants = (
  variants: TypeVariant[] | undefined | null,
): TypeDecodedVariant[] => {
  if (!variants) return [];

  return variants
    .sort((a, b) => a.order - b.order)
    .map((variant) => ({
      tempId: variant._id,
      name: variant.name,
      order: variant.order,
      options: variant.options
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
        .map((option) => ({
          tempId: option._id,
          order: option.order,
          name: option.name,
        })),
    }));
};

export type TypeDecodedSKU = {
  tempId: string;
  quantity: number;
  options: { tempId: string; order: number | undefined; optionName: string }[];
};

export const decodeSKUs = (
  skus: TypeSKU[] | undefined | null,
): TypeDecodedSKU[] => {
  if (!skus) return [];
  return skus.map((sku) => ({
    tempId: sku._id,
    quantity: sku.quantity,
    options: sku.options
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
      .map((option) => ({
        tempId: option._id,
        order: option.order,
        optionName: option.name,
      })),
  }));
};

export type TypeDecodedImage = {
  tempId: string;
  indexedDBId?: number | undefined;
  order: number;
  hidden: boolean;
  url: string;
  originalFile: File | undefined | null;
  compressedFile: File | undefined | null;
};
export const decodeImages = (
  images: TypeImage[] | undefined | null,
): TypeDecodedImage[] => {
  if (!images) return [];
  return images.map((image) => ({
    tempId: image._id,
    originalFile: null,
    compressedFile: null,
    indexedDBId: image.indexedDBId,
    order: image.order,
    hidden: image.hidden,
    url: image.url,
  }));
};
