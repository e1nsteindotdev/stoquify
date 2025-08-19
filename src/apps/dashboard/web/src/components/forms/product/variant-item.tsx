

import { Button } from "@/components/ui/button";
import { ArrowDown, ArrowUp, EyeOff, Loader2, Trash2 } from "lucide-react";
export type VariantOption = {
  id?: string;
  name: string;
};

export type VariantElement = {
  id: string;
  name: string;
  order: number;
  parentVariantId?: string;
  options: VariantOption[];
};

type VariantItemProps = {
  variant: VariantElement;
  isFirst?: boolean;
  isLast?: boolean;
};

export default function VariantItem({
  variant,
  isFirst = false,
  isLast = false,
}: VariantItemProps) {
  return (
    <div className="rounded-2xl border border-input-border  p-4">
      <div className="flex  items-center gap-5">
        <DragIcon />
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
            className={`er-transparent w-11 h-11 bg-[#E7E7E7] shadow-none hover:bg-black/15 ${isLast ? "opacity-40 cursor-default" : ""}`}
            aria-label="Move down"
            disabled={isLast}
          >
            <ArrowDown className="size-5" color="black" />
          </Button>
          <Button
            type="button"
            className={`er-transparent w-11 h-11 bg-[#E7E7E7] shadow-none hover:bg-black/15 ${isFirst ? "opacity-40 cursor-default" : ""}`}
            aria-label="Move up"
            disabled={isFirst}
          >
            <ArrowUp className="size-5" color="black" />
          </Button>
          <div className="h-6 w-px bg-black/10" />
          <Button
            type="button"
            className="border-transparent w-11 h-11 bg-[#E7E7E7] shadow-none hover:bg-black/10"
            aria-label="Delete variant"
          >
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

function UpIcon() {
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
      <path d="M12 19V5" />
      <polyline points="5 12 12 5 19 12" />
    </svg>
  );
}

function DownIcon() {
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
      <path d="M12 5v14" />
      <polyline points="19 12 12 19 5 12" />
    </svg>
  );
}
