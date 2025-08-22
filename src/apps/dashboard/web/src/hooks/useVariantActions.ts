import type { Doc } from "api/data-model";
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

export type TVariantsInventory = Map<string, { _id?: string, _creationTime?: number, path: string[], quantity: number }>

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

export function generateVIFingerPrint(path: string[]) {
  let fp = ""
  path.forEach(n => {
    if (n) {
      if (fp != "") fp = fp.concat("-")
      fp = fp.concat(n)
    }
  })
  return fp
}
export function formatVariantsInventory(vis: Doc<'variantsInventory'>[]) {
  const result: TVariantsInventory = new Map()
  vis.forEach(vi => result.set(
    generateVIFingerPrint(vi.path),
    vi
  ))
  console.log('generated variants inventory :', vis)
  return result

}


function deepEqual(a: any, b: any): boolean {
  if (a === b) return true

  // handle null and undefined
  if (a == null || b == null) return a === b

  // handle Map
  if (a instanceof Map && b instanceof Map) {
    if (a.size !== b.size) return false
    for (const [key, valA] of a) {
      if (!b.has(key)) return false
      const valB = b.get(key)
      if (!deepEqual(valA, valB)) return false
    }
    return true
  }

  // handle Array
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false
    for (let i = 0; i < a.length; i++) {
      if (!deepEqual(a[i], b[i])) return false
    }
    return true
  }

  // handle Object
  if (typeof a === "object" && typeof b === "object") {
    const keysA = Object.keys(a)
    const keysB = Object.keys(b)
    if (keysA.length !== keysB.length) return false
    for (const key of keysA) {
      if (!Object.prototype.hasOwnProperty.call(b, key)) return false
      if (!deepEqual(a[key], b[key])) return false
    }
    return true
  }

  // fallback for primitives, functions, symbols, etc.
  return false
}

export function mapsDeepEqual<K, V>(a: Map<K, V>, b: Map<K, V>): boolean {
  return deepEqual(a, b)
}
