import { DownArrow } from "@/components/icons/down-arrow";
import { Trash } from "@/components/icons/trash";
import { UpArrow } from "@/components/icons/up-arrow";
import { Button } from "@/components/ui/button";
import { ArrowDown, ArrowUp, EyeOff, Loader2, Trash2 } from "lucide-react";
import { useVariantActions } from "@/hooks/useVariantActions";
import type { VariantElement } from "@/hooks/useVariantActions";
import { useFieldContext } from "@/hooks/form-context";

type VariantItemProps = {
  variant: VariantElement;
  index: number;
  isFirst?: boolean;
  isLast?: boolean;
};

export default function VariantItem({
  variant,
  index,
  isFirst = false,
  isLast = false,
}: VariantItemProps) {
  const field = useFieldContext<VariantElement[]>();
  const { deleteVariant, moveVariantUp, moveVariantDown } =
    useVariantActions(field);
  return (
    <div className="bg-neutral-200 rounded-2xl border border-input-border  p-4">
      <div className="flex  items-center gap-4">
        {/* <DragIcon /> */}
        <span className="rounded-md bg-[#C5C5C5]/50 px-2 py-1 text-[12px] font-semibold text-neutral-600"> {index + 1} </span>
        <div className="h-[24px] rounded-md py-0.5 bg-primary/10 w-[2px]" />

        <div className="flex-1 flex flex-col gap-2">
          <div className="text-[16px] font-semibold">{variant.name}</div>
          <div className="flex flex-wrap gap-2">
            {variant.options.map((opt, i) => (
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
            {/* <ArrowDown className="size-5" color="black" /> */}
            <DownArrow />
          </Button>
          <Button
            type="button"
            className={`bg-[#F4F4F4] w-11 h-11 shadow-none hover:bg-black/5 ${isFirst ? " cursor-default" : ""}`}
            aria-label="Move up"
            disabled={isFirst}
            onClick={() => moveVariantUp(index)}
          >
            {/* <ArrowUp className="size-5" color="black" /> */}
            <UpArrow />
          </Button>
          <div className="h-6 w-px bg-black/10" />
          <Button
            type="button"
            className="border-transparent w-11 h-11 bg-[#DADADA] shadow-none hover:bg-black/10"
            aria-label="Delete variant"
            onClick={() => deleteVariant(index)}
          >
            {/* <Trash2 color="red" className="size-5" /> */}
            <Trash2 color="red" className="size-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}

function TrashIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6" />
      <path d="M14 11v6" />
      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
    </svg>
  );
}

function DragIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-muted-foreground"
    >
      <circle cx="9" cy="5" r="1" />
      <circle cx="15" cy="5" r="1" />
      <circle cx="9" cy="12" r="1" />
      <circle cx="15" cy="12" r="1" />
      <circle cx="9" cy="19" r="1" />
      <circle cx="15" cy="19" r="1" />
    </svg>
  );
}
