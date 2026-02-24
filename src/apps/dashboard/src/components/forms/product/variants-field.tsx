import { useFieldContext } from "@/hooks/form-context.tsx";
import { NewVariantForm } from "./new-variant-form";
import { cn } from "@/lib/utils";
import { type TypeDecodedVariant as TVariant } from "../types";
import { DownArrow } from "@/components/icons/down-arrow";
import { UpArrow } from "@/components/icons/up-arrow";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { useCallback } from "react";

function reindexSequential(variants: TVariant[]): TVariant[] {
  return variants
    .sort((a, b) => a.order - b.order)
    .map((variant, index) => ({ ...variant, order: index + 1 }));
}

function VariantItem({
  variant,
  index,
  isFirst = false,
  isLast = false,
}: {
  variant: TVariant;
  index: number;
  isFirst?: boolean;
  isLast?: boolean;
}) {
  const field = useFieldContext<TVariant[]>();

  const deleteVariant = useCallback(
    (idx: number) => {
      field.setValue((prev) => {
        const newVariants = prev.filter((_, i) => i !== idx);
        return reindexSequential(newVariants);
      });
    },
    [field],
  );

  const moveVariantUp = useCallback(
    (idx: number) => {
      field.setValue((prev) => {
        if (idx <= 0) return prev;

        const newVariants = [...prev];
        const currentVariant = newVariants[idx];
        const previousVariant = newVariants[idx - 1];

        newVariants[idx] = {
          ...previousVariant,
          order: currentVariant.order,
        };
        newVariants[idx - 1] = {
          ...currentVariant,
          order: previousVariant.order,
        };

        return reindexSequential(newVariants);
      });
    },
    [field],
  );

  const moveVariantDown = useCallback(
    (idx: number) => {
      field.setValue((prev) => {
        if (idx >= prev.length - 1) return prev;

        const newVariants = [...prev];
        const currentVariant = newVariants[idx];
        const nextVariant = newVariants[idx + 1];

        newVariants[idx] = { ...nextVariant, order: currentVariant.order };
        newVariants[idx + 1] = {
          ...currentVariant,
          order: nextVariant.order,
        };

        return reindexSequential(newVariants);
      });
    },
    [field],
  );

  return (
    <div className="bg-neutral-200 rounded-2xl border border-input-border  p-4">
      <div className="flex  items-center gap-4">
        <span className="rounded-md bg-[#C5C5C5]/50 px-2 py-1 text-[12px] font-semibold text-neutral-600">
          {" "}
          {index + 1}{" "}
        </span>
        <div className="h-[24px] rounded-md py-0.5 bg-primary/10 w-[2px]" />

        <div className="flex-1 flex flex-col gap-2">
          <div className="text-[16px] font-semibold">{variant.name}</div>
          <div className="flex flex-wrap gap-2">
            {variant.options?.map((opt, i) => (
              <span
                key={`${opt.name}-${i}`}
                className="rounded-[6px] bg-primary/10 px-3 py-1 text-primary text-sm"
              >
                {opt.name}
              </span>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button
            type="button"
            className={`bg-[#F4F4F4] w-11 h-11 shadow-none hover:bg-black/5 ${isLast ? "cursor-default" : ""}`}
            aria-label="Move down"
            disabled={isLast}
            onClick={() => moveVariantDown(index)}
          >
            <DownArrow />
          </Button>
          <Button
            type="button"
            className={`bg-[#F4F4F4] w-11 h-11 shadow-none hover:bg-black/5 ${isFirst ? " cursor-default" : ""}`}
            aria-label="Move up"
            disabled={isFirst}
            onClick={() => moveVariantUp(index)}
          >
            <UpArrow />
          </Button>
          <div className="h-6 w-px bg-black/10" />
          <Button
            type="button"
            className="border-transparent w-11 h-11 bg-[#DADADA] shadow-none hover:bg-black/10"
            aria-label="Delete variant"
            onClick={() => deleteVariant(index)}
          >
            <Trash2 color="red" className="size-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function VariantsField() {
  const field = useFieldContext<TVariant[]>();

  function addNewVariant(name: string, options: string[]) {
    field.setValue((prev) => {
      let order = 1;
      for (let i of field.state.value) {
        if (order <= Number(i.order)) order += 1;
      }
      const newVariant: TVariant = {
        tempId: crypto.randomUUID(),
        name,
        order: order,
        options: options
          .filter((o) => o !== "")
          .map((name, i) => ({
            tempId: crypto.randomUUID(),
            order: i + 1,
            name,
          })),
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
          L'ordre des variantes est important car c'est ainsi que vous pouvez
          gérer votre inventaire
        </p>
      </div>
      {variants?.length ? (
        <div className="grid gap-2">
          {variants?.map((v, i) => (
            <VariantItem
              key={`${v.order}-${v.name}`}
              variant={v}
              index={i}
              isFirst={i === 0}
              isLast={i === field.state.value.length - 1}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-input-border p-4">
          <p className="italic text-[14px] text-neutral-500">
            Aucune variante n'existe encore pour ce produit.
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
