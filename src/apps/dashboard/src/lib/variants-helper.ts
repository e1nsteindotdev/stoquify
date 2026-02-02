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

// SKU Types
export type SkuInput = {
  id?: string;
  quantity: number;
  options: Record<string, { id: string; value: string }>;
};

export type ExistingSku = {
  id: string;
  quantity: number;
  options: Record<string, { id: string; value: string }>;
};

/**
 * Normalizes SKU options for comparison
 * Creates a consistent string key from option combinations
 */
function normalizeSkuOptions(
  options: Record<string, { id: string; value: string }>,
): string {
  // Sort by variant ID to ensure consistent ordering
  const sortedEntries = Object.entries(options).sort(([a], [b]) =>
    a.localeCompare(b),
  );
  // Create key: "variantId:optionId|variantId:optionId"
  return sortedEntries.map(([vId, opt]) => `${vId}:${opt.id}`).join("|");
}

/**
 * Compares two lists of SKUs and determines which to remove, update, or add.
 *
 * SKUs are identified by their option combination (variantId -> optionId mapping).
 * - Same option combo + different quantity → UPDATE
 * - Same option combo + same quantity → NO CHANGE
 * - New option combo → INSERT
 * - Missing option combo → REMOVE
 *
 * @param existingSkus - SKUs from the database (with IDs)
 * @param newSkus - SKUs from the form (may or may not have IDs)
 * @returns Object with ids to remove, skus to update, and skus to insert
 */
export function compareSkus(
  existingSkus: ExistingSku[],
  newSkus: SkuInput[],
): {
  toRemove: string[];
  toUpdate: Array<{ id: string; quantity: number }>;
  toInsert: SkuInput[];
} {
  const toRemove: string[] = [];
  const toUpdate: Array<{ id: string; quantity: number }> = [];
  const toInsert: SkuInput[] = [];

  // Build lookup maps by normalized option key
  const existingMap = new Map<string, ExistingSku>();
  for (const sku of existingSkus) {
    const key = normalizeSkuOptions(sku.options);
    existingMap.set(key, sku);
  }

  const newMap = new Map<string, SkuInput>();
  for (const sku of newSkus) {
    const key = normalizeSkuOptions(sku.options);
    newMap.set(key, sku);
  }

  // Find SKUs to remove (exist in DB but not in new list)
  for (const [key, existing] of existingMap) {
    if (!newMap.has(key)) {
      toRemove.push(existing.id);
    }
  }

  // Process new SKUs
  for (const [key, newSku] of newMap) {
    const existing = existingMap.get(key);

    if (!existing) {
      // New SKU - insert it
      toInsert.push(newSku);
    } else if (existing.quantity !== newSku.quantity) {
      // Same SKU but quantity changed - update it
      toUpdate.push({ id: existing.id, quantity: newSku.quantity });
    }
    // If same quantity, no action needed
  }

  return { toRemove, toUpdate, toInsert };
}

/**
 * Extracts SKUs from product query result for comparison
 */
export function extractExistingSkus(
  product:
    | {
        variants?: Array<{
          skus?: Array<{
            id: string;
            quantity: number;
            options: Record<string, { id: string; value: string }>;
          }>;
        }>;
      }
    | undefined,
): ExistingSku[] {
  if (!product?.variants) return [];

  const skus: ExistingSku[] = [];
  const seenIds = new Set<string>();

  for (const variant of product.variants) {
    if (variant.skus && Array.isArray(variant.skus)) {
      for (const sku of variant.skus) {
        // Deduplicate - a SKU might appear in multiple variants
        if (!seenIds.has(sku.id)) {
          seenIds.add(sku.id);
          skus.push({
            id: sku.id,
            quantity: sku.quantity,
            options: sku.options,
          });
        }
      }
    }
  }

  return skus;
}
