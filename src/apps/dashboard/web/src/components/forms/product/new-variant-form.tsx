import { useMemo, useState } from "react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

type TVariant = {
  order: number;
  parentVariantId?: string;
  name: string;
  options: {
    name: string;
  }[];
};
export function NewVariantForm({ addNewVariant }: { addNewVariant: (name: string, options: string[]) => void }) {
  const [isModifying, setIsModifying] = useState<boolean>(false);
  const [variantName, setVariantName] = useState<string | null>();
  const [options, setOptions] = useState<string[] | null>();

  function handleAddOption() {
    setOptions((prev) => {
      if (prev)
        return [...prev, ""]
      else
        return [""]
    });
  }

  function handleRemoveOption(index: number) {
    setOptions((prev) => {
      if (prev)
        return prev.length <= 1 ? prev : prev.filter((_, i) => i !== index)
      else return []
    }
    );
  }

  function handleOptionChange(index: number, value: string) {
    setOptions((prev) => {
      if (prev)
        return prev.map((opt, i) => (i === index ? value : opt))
    });
    const lastOption = options![options!.length - 1]
    if (lastOption != "") {
      handleAddOption()
    }
  }

  async function handleSubmit() {
    if (options && variantName) {
      const cleanedOptions = options
        .map((o) => o.trim())
        .filter((o) => o !== "" && o);
      const name = variantName.trim();
      if (!name || cleanedOptions.length === 0) return;
      const next: TVariant = {
        order: 0,
        name,
        options: cleanedOptions.map((n) => ({ name: n })),
      };
      addNewVariant(variantName, options)
      setIsModifying(false);
      setVariantName("")
      setOptions([])
    }
  }

  const canConfirm = useMemo(() => {
    if (variantName && options) {
      const nameOk = variantName.trim().length > 0;
      const optsOk = options.some((o) => o.trim().length > 0);
      return nameOk && optsOk;
    }
  }, [variantName, options]);
  if (isModifying) {
    return (
      <div className={cn("grid gap-2",)}>
        <p className="font-semibold text-[18px]">Ajouter une nouvelle variante</p>
        <div className="grid gap-4 border border-neutral-300 rounded-[15px] p-4">
          <div className="grid gap-3">
            <Label className="font-semibold">Nom de la variante</Label>
            <Input
              placeholder="Color"
              value={variantName ?? ""}
              onChange={(e) => setVariantName(e.target.value)}
              className="bg-white/20"
            />
          </div>
          <div className="grid gap-3">
            <Label className="font-semibold">Options</Label>
            <div className="grid gap-2">
              {options?.map((opt, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Input
                    placeholder={"black"}
                    value={opt}
                    onChange={(e) => handleOptionChange(i, e.target.value)}
                    className="py-4 bg-white/20"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveOption(i)}
                    className={`rounded-xl py-2 `}
                    disabled={options.length <= 1}
                    aria-label="Remove option"
                  >
                    <Trash2 color={i === options.length - 1 ? "#DEDEDE" : "#FF383C"} className="size-5" />
                  </button>
                </div>
              ))}
              <div>

              </div>
            </div>
          </div>
          <div className="flex w-full justify-between">
            <Button
              type="button"
              variant={"primary"}
              onClick={handleSubmit}
              disabled={!canConfirm}
            >
              Confirmer
            </Button>
            <Button
              type="button"
              variant={"destructive"}
              onClick={() => { setIsModifying(false) }}
            >
              Annuler
            </Button>
          </div>
        </div>
      </div>

    )
  } else {
    return <div>
      <Button
        type="button"
        variant="ghost"
        className="flex gap-1 justify-start pl-2 py-0 text-[15px] text-foreground/90 hover:text-foreground w-fit"
        onClick={() => { handleAddOption(); setIsModifying(true) }}
      >
        <div className="rounded-full scale-60 border-[1.5px] border-black center p-[4px]">
          <AddIcon />
        </div>
        <p className="text-[14px]">Ajouter une nouvelle variante</p>
      </Button>
    </div>
  }
}


function AddIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="9"
      height="9"
      fill="none"
      viewBox="0 0 9 9"
    >
      <path
        stroke="#000"
        strokeLinecap="round"
        strokeWidth="0.818"
        d="M1.023 4.5h6.954M4.5 7.978V1.023"
      />
    </svg>
  );
}
