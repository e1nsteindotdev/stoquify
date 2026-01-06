import { useCallback } from "react";
import type { NewVariantInput } from "@/livestore/schema/products/types";

type FieldLike = {
  state: { value: NewVariantInput[] };
  setValue: (updater: (prev: NewVariantInput[]) => NewVariantInput[]) => void;
};

function reindexSequential(variants: NewVariantInput[]): NewVariantInput[] {
  return variants
    .map((variant, index) => ({ ...variant }))
    .map((variant, index) => ({ ...variant }));
}

export function useVariantActions(field: FieldLike) {
  const deleteVariant = useCallback(
    (index: number) => {
      field.setValue((prev) => {
        const newVariants = prev.filter((_, i) => i !== index);
        return newVariants;
      });
    },
    [field],
  );

  const moveVariantUp = useCallback(
    (index: number) => {
      field.setValue((prev) => {
        if (index <= 0) return prev;

        const newVariants = [...prev];
        const currentVariant = newVariants[index];
        const previousVariant = newVariants[index - 1];

        newVariants[index] = previousVariant;
        newVariants[index - 1] = currentVariant;

        return newVariants;
      });
    },
    [field],
  );

  const moveVariantDown = useCallback(
    (index: number) => {
      field.setValue((prev) => {
        if (index >= prev.length - 1) return prev;

        const newVariants = [...prev];
        const currentVariant = newVariants[index];
        const nextVariant = newVariants[index + 1];

        newVariants[index] = nextVariant;
        newVariants[index + 1] = currentVariant;

        return newVariants;
      });
    },
    [field],
  );

  return { deleteVariant, moveVariantUp, moveVariantDown } as const;
}

export function generateSkuId(): string {
  const digits = Math.floor(1000 + Math.random() * 9000);
  return `SKU-${digits}`;
}
