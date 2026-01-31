export type VariantInput = {
  id?: string;
  name: string;
  options: string[];
};

export type ExistingVariant = {
  id: string;
  name: string;
  options: string[];
};

// Type for the variant structure returned by the products$ query
export type QueryVariant = {
  id: string;
  shop_id: string;
  product_id: string;
  name: string;
  displayOrder: number;
  createdAt: Date;
  options: string[];
};

/**
 * Compares two lists of variants and determines which to remove and which to add.
 *
 * Two variants are considered equal if:
 * - They have the same name (case-sensitive)
 * - They have the same options (as a set, order doesn't matter)
 *
 * @param existingVariants - Variants from the database (with IDs)
 * @param newVariants - Variants from the form (may or may not have IDs)
 * @returns Object with ids to remove and variants to add
 */
export function compareVariants(
  existingVariants: ExistingVariant[],
  newVariants: VariantInput[],
): {
  toRemove: string[];
  toAdd: VariantInput[];
} {
  const toRemove: string[] = [];
  const toAdd: VariantInput[] = [];

  // Helper to normalize options for comparison (sorted array for consistent comparison)
  const normalizeOptions = (options: string[]): string => {
    return [...options].sort().join("|");
  };

  // Helper to check if two variants are equal
  const areVariantsEqual = (
    v1: { name: string; options: string[] },
    v2: { name: string; options: string[] },
  ): boolean => {
    if (v1.name !== v2.name) return false;
    return normalizeOptions(v1.options) === normalizeOptions(v2.options);
  };

  // Find variants to remove (exist in DB but not in new list)
  for (const existing of existingVariants) {
    const hasMatch = newVariants.some((newV) =>
      areVariantsEqual(existing, newV),
    );
    if (!hasMatch) {
      toRemove.push(existing.id);
    }
  }

  // Find variants to add (exist in new list but not in DB)
  for (const newVariant of newVariants) {
    const hasMatch = existingVariants.some((existing) =>
      areVariantsEqual(existing, newVariant),
    );
    if (!hasMatch) {
      toAdd.push(newVariant);
    }
  }

  return { toRemove, toAdd };
}

/**
 * Converts query result variants to ExistingVariant format for comparison
 */
export function extractExistingVariants(
  product: { variants?: QueryVariant[] } | undefined,
): ExistingVariant[] {
  if (!product?.variants) return [];

  return product.variants.map((variant) => ({
    id: variant.id,
    name: variant.name,
    options: variant.options,
  }));
}
