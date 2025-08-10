import { useEffect, useMemo, useState } from "react";
import { useFieldContext } from "@/hooks/form-context.tsx";
import { Label } from "./label";
import { Button } from "./button";
import { Input } from "./input";

type TVariant = {
  order: number;
  parentVariantId?: string;
  name: string;
  elements: {
    variantId?: string;
    name: string;
  }[];
};

type Props = { label?: string };

export default function VariantsField({ label }: Props) {
  const field = useFieldContext<TVariant[]>();

  const currentVariant: TVariant | undefined = useMemo(() => {
    const value = field.state.value ?? [];
    return Array.isArray(value) && value.length > 0 ? value[0] : undefined;
  }, [field.state.value]);

  const [isModifying, setIsModifying] = useState<boolean>(() => !currentVariant);
  const [variantName, setVariantName] = useState<string>(currentVariant?.name ?? "");
  const [options, setOptions] = useState<string[]>(
    currentVariant ? currentVariant.elements.map((e) => e.name) : [""]
  );

  // Sync local state with external resets
  useEffect(() => {
    const hasVariant = Boolean(currentVariant);
    setIsModifying(!hasVariant);
    setVariantName(currentVariant?.name ?? "");
    setOptions(currentVariant ? currentVariant.elements.map((e) => e.name) : [""]);
  }, [currentVariant]);

  function handleAddOption() {
    setOptions((prev) => [...prev, ""]);
  }

  function handleRemoveOption(index: number) {
    setOptions((prev) => (prev.length <= 1 ? prev : prev.filter((_, i) => i !== index)));
  }

  function handleOptionChange(index: number, value: string) {
    setOptions((prev) => prev.map((opt, i) => (i === index ? value : opt)));
  }

  function handleConfirm() {
    const cleanedOptions = options.map((o) => o.trim()).filter((o) => o.length > 0);
    const name = variantName.trim();
    if (!name || cleanedOptions.length === 0) return;
    const next: TVariant = {
      order: 0,
      name,
      elements: cleanedOptions.map((n) => ({ name: n })),
    };
    field.setValue([next]);
    setIsModifying(false);
  }

  function handleDeleteVariant() {
    field.setValue([]);
    setIsModifying(true);
    setVariantName("");
    setOptions([""]);
  }

  const canConfirm = useMemo(() => {
    const nameOk = variantName.trim().length > 0;
    const optsOk = options.some((o) => o.trim().length > 0);
    return nameOk && optsOk;
  }, [variantName, options]);

  if (isModifying) {
    return (
      <div className="grid gap-4 rounded-2xl border border-black/5 bg-muted/30 p-4">
        {label && <Label className="font-semibold">{label}</Label>}

        <div className="grid gap-2">
          <Label className="font-semibold">Variant name</Label>
          <Input
            placeholder="Color"
            value={variantName}
            onChange={(e) => setVariantName(e.target.value)}
            className=""
          />
        </div>

        <div className="grid gap-3">
          <Label className="font-semibold">Options</Label>
          <div className="grid gap-2">
            {options.map((opt, i) => (
              <div key={i} className="flex items-center gap-2">
                <Input
                  placeholder={i === 0 ? "black" : ""}
                  value={opt}
                  onChange={(e) => handleOptionChange(i, e.target.value)}
                  className="py-4"
                />
                <button
                  type="button"
                  onClick={() => handleRemoveOption(i)}
                  className={`rounded-xl border px-3 py-2 ${options.length > 1 ? "text-red-500 border-red-200" : "text-muted-foreground/40 border-transparent"
                    }`}
                  disabled={options.length <= 1}
                  aria-label="Remove option"
                >
                  <TrashIcon />
                </button>
              </div>
            ))}
            <div>
              <Button type="button" variant="ghost" className="px-2" onClick={handleAddOption}>
                Add option
              </Button>
            </div>
          </div>
        </div>

        <div>
          <Button
            type="button"
            onClick={handleConfirm}
            disabled={!canConfirm}
            className="rounded-xl bg-[#DDDAE7] text-primary"
          >
            Confirmer
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-black/5 bg-muted/30 p-4">
      <div className="flex items-center gap-3">
        <DragIcon />
        <div className="flex-1">
          <div className="text-lg font-semibold">{currentVariant?.name}</div>
          <div className="mt-2 flex flex-wrap gap-2">
            {currentVariant?.elements.map((el, i) => (
              <span
                key={`${el.name}-${i}`}
                className="rounded-xl bg-primary/10 px-3 py-1 text-primary text-sm"
              >
                {el.name}
              </span>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="secondary"
            className="rounded-xl"
            onClick={() => setIsModifying(true)}
          >
            Modify
          </Button>
          <div className="h-6 w-px bg-black/10" />
          <button
            type="button"
            onClick={handleDeleteVariant}
            className="rounded-xl border px-3 py-2 text-red-500 border-red-200"
            aria-label="Delete variant"
          >
            <TrashIcon />
          </button>
        </div>
      </div>
    </div>
  );
}

function TrashIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground">
      <circle cx="9" cy="5" r="1" />
      <circle cx="15" cy="5" r="1" />
      <circle cx="9" cy="12" r="1" />
      <circle cx="15" cy="12" r="1" />
      <circle cx="9" cy="19" r="1" />
      <circle cx="15" cy="19" r="1" />
    </svg>
  );
}
