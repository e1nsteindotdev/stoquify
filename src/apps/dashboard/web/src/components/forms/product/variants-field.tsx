import { useFieldContext } from "@/hooks/form-context.tsx";
import VariantItem from "./variant-item";
import { NewVariantForm } from "./new-variant-form";
import { cn } from "@/lib/utils";
import { type VariantElement } from "@/hooks/useVariantActions";

type TVariant = VariantElement;

export default function VariantsField() {
  const field = useFieldContext<TVariant[]>();

  function addNewVariant(name: string, options: string[]) {
    field.setValue((prev) => {
      let order = 1;
      for (let i of field.state.value) {
        if (order <= i.order) order += 1;
      }
      const newVariant: TVariant = {
        name,
        order,
        options: options.filter(o => o !== "").map((o) => ({ name: o })),
      };
      return [...prev, newVariant];
    });
  }
  const variants = field.state.value;
  return (
    <div className={cn("grid gap-3")}>
      <div className="">
        <p className="text-[20px] font-semibold">Exisiting Variants</p>
        <p className="text-[16px] text-neutral-500">Know the order of the variants matter because it how you can manage your inventory</p>
      </div>
      {variants?.length ? (
        <div className="grid gap-2">
          {variants?.map((v, i) => (
            <VariantItem
              key={i}
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
            No variants exist for this product yet.
          </p>
        </div>
      )}
      <div className="h-[1px] w-[98%] bg-black/5 justify-self-center mt-1" />
      <NewVariantForm addNewVariant={addNewVariant} />
    </div>
  );
}
