import { DownArrow } from "@/components/icons/down-arrow";
import { UpArrow } from "@/components/icons/up-arrow";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { useVariantActions } from "@/hooks/useVariantActions";
import type { NewVariantInput } from "@/livestore/schema/products/types";
import { useFieldContext } from "@/hooks/form-context";

interface VariantItemProps {
  variant: NewVariantInput;
  index: number;
  isFirst?: boolean;
  isLast?: boolean;
}

export default function VariantItem({
  variant,
  index,
  isFirst = false,
  isLast = false,
}: VariantItemProps) {
  const field = useFieldContext<NewVariantInput[]>();
  const { deleteVariant, moveVariantUp, moveVariantDown } =
    useVariantActions(field);

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
            {variant.options.map((opt, i) => (
              <span
                key={`${opt}-${i}`}
                className="rounded-[6px] bg-primary/10 px-3 py-1 text-primary text-sm"
              >
                {opt}
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
