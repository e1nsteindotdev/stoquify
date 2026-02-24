import type { TypeVariant, TypeSKU } from "api/types";

export type TypeDecodedVariant = {
  tempId: string,
  name: string;
  order: number;
  options: { tempId: string, order: number; name: string }[];
};

export const decodeVariants = (
  variants: TypeVariant[] | undefined | null,
): TypeDecodedVariant[] => {
  if (!variants) return [];

  return variants.map((variant) => ({
    tempId: variant._id,
    name: variant.name,
    order: variant.order,
    options: variant.options.map((option) => ({
      tempId: option._id,
      order: option.order,
      name: option.name,
    })),
  }));
};

export type TypeDecodedSKU = {
  tempId: string,
  quantity: number;
  options: { tempId: string, order: number; optionName: string }[];
};

export const decodeSKUs = (skus: TypeSKU[] | undefined | null): TypeDecodedSKU[] => {
  if (!skus) return [];
  return skus.map((sku) => ({
    tempId: sku._id,
    quantity: sku.quantity,
    options: sku.options.map((option) => ({
      tempId: option._id,
      order: option.order,
      optionName: option.name,
    })),
  }));
};
