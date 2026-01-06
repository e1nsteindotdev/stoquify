import { useFieldContext } from "@/hooks/form-context.tsx";
import VariantItem from "./variant-item";
import { NewVariantForm } from "./new-variant-form";
import { cn } from "@/lib/utils";
import type { NewVariantInput } from "@/livestore/schema/products/types";

interface VariantsFieldProps {
  productId?: string;
}

export default function VariantsField({ productId }: VariantsFieldProps) {
  const field = useFieldContext<NewVariantInput[]>();

  function addNewVariant(input: NewVariantInput) {
    field.setValue((prev) => {
      const newVariant: NewVariantInput = {
        name: input.name,
        options: input.options,
      };
      return [...prev, newVariant];
    });
  }

  const variants = field.state.value;

  return (
    <div className={cn("grid gap-3")}>
      <div className="">
        <p className="text-[20px] font-semibold">Variantes existantes</p>
        <p className="text-[16px] text-neutral-500">
          L&apos;ordre des variantes est important car c&apos;est ainsi que vous
          pouvez gérer votre inventaire
        </p>
      </div>
      {variants.length ? (
        <div className="grid gap-2">
          {variants.map((v, i) => (
            <VariantItem
              key={i}
              variant={v}
              index={i}
              isFirst={i === 0}
              isLast={i === variants.length - 1}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-input-border p-4">
          <p className="italic text-[14px] text-neutral-500">
            Aucune variante n&apos;existe encore pour ce produit.
          </p>
        </div>
      )}
      <div className="h-[1px] w-[98%] bg-black/5 justify-self-center mt-1" />
      <NewVariantForm
        addNewVariant={addNewVariant}
        isEmpty={variants.length === 0}
      />
    </div>
  );
}
