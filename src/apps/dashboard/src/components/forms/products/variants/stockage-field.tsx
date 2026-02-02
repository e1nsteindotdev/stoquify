import { useFieldContext } from "@/hooks/form-context.tsx";
import { LittleItem } from "@/components/ui/little-item";
import { useMemo, useEffect } from "react";
import { Input } from "@/components/ui/input";
import type { NewVariantInput, SKU } from "@/livestore/schema/products/types";
import { useStore } from "@livestore/react";
import { shopId$ } from "@/livestore/schema";

type Props = {
  variants: NewVariantInput[];
  strat: string;
  skus: SKU[];
};

export default function StockageField({ variants, strat, skus }: Props) {
  // All hooks must be called unconditionally at the top level
  const field = useFieldContext<SKU[]>();
  const { store } = useStore();
  const currentSkus = field.state.value;

  const sortedVariants = useMemo(
    () =>
      [...variants].sort((a, b) => variants.indexOf(a) - variants.indexOf(b)),
    [variants],
  );

  // Generate all SKU combinations based on variants
  const generatedSkus = useMemo(() => {
    if (variants.length === 0) return [];

    const combinations: SKU[] = [];

    function generate(current: string[], depth: number) {
      if (depth === variants.length) {
        // Create options object for this combination
        const options: Record<string, { id: string; value: string }> = {};
        variants.forEach((variant, index) => {
          options[variant.name] = {
            id: `opt-${variant.name}-${current[index]}`,
            value: current[index],
          };
        });

        combinations.push({
          id: `sku-${current.join("-")}-${Date.now()}`,
          shop_id: "",
          product_id: "",
          quantity: 0,
          options,
          createdAt: new Date(),
          deletedAt: null,
        });
        return;
      }

      const variant = variants[depth];
      for (const option of variant.options) {
        generate([...current, option], depth + 1);
      }
    }

    generate([], 0);
    return combinations;
  }, [variants]);

  // Sync generated SKUs with form state whenever variants change
  useEffect(() => {
    if (variants.length === 0 || generatedSkus.length === 0) {
      return;
    }

    // Only sync if current SKUs are empty (initial load) or if the count doesn't match
    if (
      currentSkus.length === 0 ||
      currentSkus.length !== generatedSkus.length
    ) {
      field.setValue(generatedSkus);
    }
  }, [generatedSkus, variants.length, currentSkus.length, field]);

  if (strat === "by_variants") {
    return (
      <ByVariantsForm
        variants={sortedVariants}
        field={field}
        skus={currentSkus}
      />
    );
  } else if (strat === "by_number") {
    return <ByNumberForm field={field} skus={currentSkus} />;
  } else if (strat === "by_demand") {
    return <ByDemandForm field={field} />;
  } else {
    return <p>error</p>;
  }
}

function ByNumberForm({ field, skus }: { field: any; skus: SKU[] }) {
  const totalQuantity = skus.reduce((sum, sku) => sum + (sku.quantity || 0), 0);

  const updateQuantity = (newQuantity: number) => {
    const updatedSkus = skus.map((sku) => ({
      ...sku,
      quantity: newQuantity,
    }));
    field.setValue(updatedSkus);
  };

  return (
    <div className="rounded-2xl border border-input-border p-4 bg-muted/50">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-semibold text-[14px]">Stock global</p>
          <p className="text-[12px] text-neutral-500">
            Définissez une quantité fixe pour ce produit sans distinction de
            variante.
          </p>
        </div>
        <div className="flex gap-2 items-center">
          <p className="text-[14px] text-neutral-700">Quantité</p>
          <Input
            type="number"
            onChange={(e) => updateQuantity(Number(e.target.value))}
            placeholder="eg. 100"
            defaultValue={totalQuantity > 0 ? totalQuantity : 0}
            className="text-[14px] py-1 w-24"
          />
        </div>
      </div>
    </div>
  );
}

function ByDemandForm({ field }: { field: any }) {
  useEffect(() => {
    const currentVal = field.state.value;
    if (
      currentVal.length > 0 &&
      currentVal.some((sku: SKU) => sku.quantity > 0)
    ) {
      const clearedSkus = currentVal.map((sku: SKU) => ({
        ...sku,
        quantity: 0,
      }));
      field.setValue(clearedSkus);
    }
  }, [field]);

  return (
    <div className="rounded-2xl border border-input-border p-4 bg-muted/50 flex flex-col gap-1">
      <p className="font-semibold text-[14px]">Sur commande</p>
      <p className="text-[13px] text-neutral-500 leading-relaxed">
        Ce produit n'a pas de stock limité. Chaque commande sera traitée à la
        demande. Aucun suivi de stock ne sera effectué pour ce produit.
      </p>
    </div>
  );
}

function QuantityInput({
  skuId,
  quantity,
  onChange,
}: {
  skuId: string;
  quantity: number;
  onChange: (skuId: string, quantity: number) => void;
}) {
  return (
    <Input
      type="number"
      value={quantity}
      onChange={(e) => onChange(skuId, Number(e.target.value))}
      placeholder="eg. 4"
      className="text-[14px] py-1 w-24"
    />
  );
}

function ByVariantsForm({
  variants,
  field,
  skus,
}: {
  variants: NewVariantInput[];
  field: any;
  skus: SKU[];
}) {
  const changeQuantity = (skuId: string, newQuantity: number) => {
    // Find the SKU and update it
    const updatedSkus = skus.map((sku) =>
      sku.id === skuId ? { ...sku, quantity: newQuantity } : sku,
    );
    field.setValue(updatedSkus);
  };

  // Generate display combinations - must be called unconditionally
  const generateAllCombinations = useMemo(() => {
    if (variants.length === 0 || skus.length === 0) return [];

    const combinations: Array<{ options: string[]; sku: SKU }> = [];

    function generate(current: string[], depth: number) {
      if (depth === variants.length) {
        // Find the SKU for this combination
        const sku = skus.find((s) => {
          const skuOptionValues = Object.values(s.options).map((o) => o.value);
          return (
            skuOptionValues.length === current.length &&
            skuOptionValues.every((opt, i) => opt === current[i])
          );
        });

        if (sku) {
          combinations.push({
            options: [...current],
            sku,
          });
        }
        return;
      }

      const variant = variants[depth];
      for (const option of variant.options) {
        generate([...current, option], depth + 1);
      }
    }

    generate([], 0);
    return combinations;
  }, [variants, skus]);

  // If no variants exist yet
  if (variants.length === 0) {
    return (
      <div className="rounded-2xl border border-input-border p-4">
        <p className="italic text-[14px] text-neutral-500">
          No variants exist for this product yet.
        </p>
      </div>
    );
  }

  // If no SKUs generated yet
  if (skus.length === 0) {
    return (
      <div className="rounded-2xl border border-input-border p-4">
        <p className="italic text-[14px] text-neutral-500">
          Génération des SKUs en cours...
        </p>
      </div>
    );
  }

  // Display all SKUs in a two-column grid with options joined by " / "
  return (
    <div className="grid grid-cols-2 gap-3">
      {generateAllCombinations.map((combo) => (
        <div
          key={combo.sku.id}
          className="flex items-center justify-between py-3 px-4 border rounded-[16px]"
        >
          <LittleItem>{combo.options.join(" / ")}</LittleItem>
          <QuantityInput
            skuId={combo.sku.id}
            quantity={combo.sku.quantity || 0}
            onChange={changeQuantity}
          />
        </div>
      ))}
    </div>
  );
}
