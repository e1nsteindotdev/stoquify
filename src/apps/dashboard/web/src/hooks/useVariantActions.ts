import { useCallback } from "react";

export type VariantOption = {
  id?: string;
  name: string;
};

export type VariantElement = {
  id?: string;
  name: string;
  order: number;
  parentVariantId?: string;
  options: VariantOption[];
};

type FieldLike = {
  state: { value: VariantElement[] };
  setValue: (updater: (prev: VariantElement[]) => VariantElement[]) => void;
};

function reindexSequential(variants: VariantElement[]): VariantElement[] {
  return variants
    .sort((a, b) => a.order - b.order)
    .map((variant, index) => ({ ...variant, order: index + 1 }));
}

export function useVariantActions(field: FieldLike) {
  const deleteVariant = useCallback(
    (index: number) => {
      field.setValue((prev) => {
        const newVariants = prev.filter((_, i) => i !== index);
        return reindexSequential(newVariants);
      });
    },
    [field]
  );

  const moveVariantUp = useCallback(
    (index: number) => {
      field.setValue((prev) => {
        if (index <= 0) return prev;

        const newVariants = [...prev];
        const currentVariant = newVariants[index];
        const previousVariant = newVariants[index - 1];

        // Swap the variants
        newVariants[index] = {
          ...previousVariant,
          order: currentVariant.order,
        };
        newVariants[index - 1] = {
          ...currentVariant,
          order: previousVariant.order,
        };

        return reindexSequential(newVariants);
      });
    },
    [field]
  );

  const moveVariantDown = useCallback(
    (index: number) => {
      field.setValue((prev) => {
        if (index >= prev.length - 1) return prev;

        const newVariants = [...prev];
        const currentVariant = newVariants[index];
        const nextVariant = newVariants[index + 1];

        // Swap the variants
        newVariants[index] = { ...nextVariant, order: currentVariant.order };
        newVariants[index + 1] = {
          ...currentVariant,
          order: nextVariant.order,
        };

        return reindexSequential(newVariants);
      });
    },
    [field]
  );

  return { deleteVariant, moveVariantUp, moveVariantDown } as const;
}
