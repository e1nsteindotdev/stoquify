import { useState } from "react";
import { useFieldContext } from "@/hooks/form-context.tsx";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { ResponsivePopover } from "@/components/ui/responsive-popover";

import { useGetCategories } from "@/database/categories";
import { Id } from "api/data-model";
import { useAppStore } from "@/lib/store";
import { convex } from "@/lib/convex-client";
import { api } from "api/convex";
import { queryClient } from "@/lib/ts-query-client";

type Props = {
  label?: string;
};

export default function CategoriesField({ label }: Props) {
  const field = useFieldContext<Id<"categories">>();
  const storeId = useAppStore((state) => state.selectedStore?._id);
  const categoriesResult = useGetCategories(storeId);
  const categories = categoriesResult?.data ?? [];

  const [name, setName] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [open, setOpen] = useState(false);

  async function handleCreate() {
    if (!name.trim() || isCreating) return;
    setIsCreating(true);
    try {
      if (!storeId) throw Error("no storeId");
      const id = await convex.mutation(api.categories.createCategory, {
        name,
        storeId,
      });
      console.log("new id :", id);
      if (!id) throw Error("failed at creating id");
      await queryClient.refetchQueries({ queryKey: ["categories"] });
      field.handleChange(id);
      setName("");
      setOpen(false);
    } finally {
      setIsCreating(false);
    }
  }

  return (
    <div className="grid">
      {label && <Label className="font-semibold pb-[12px]">{label}</Label>}
      <div className="space-y-1 border border-neutral-300 p-3">
        <Select
          value={(field.state.value as Id<"categories">) ?? ""}
          onValueChange={(v) => field.handleChange(v as any)}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Sélectionner une option" />
          </SelectTrigger>
          <SelectContent className="bg-card">
            {categories.map((c) => (
              <SelectItem
                key={c._id}
                className="focus:bg-black/5"
                value={c._id}
              >
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="h-[1px] w-[98%] bg-black/5 justify-self-center mt-3 mb-3" />

        <ResponsivePopover
          title="Nouvelle catégorie"
          open={open}
          onOpenChange={setOpen}
          trigger={
            <Button
              type="button"
              variant="ghost"
              className="flex gap-1 justify-start pl-2 py-2 text-[15px] text-foreground/90 hover:text-foreground w-full border border-neutral-300 hover:bg-black/5 rounded-none"
            >
              <div className="rounded-none scale-60 border-[1.5px] border-black center p-[4px]">
                <AddIcon />
              </div>
              <p className="text-[14px]">Ajouter une autre catégorie</p>
            </Button>
          }
        >
          <div className="flex flex-col gap-2">
            <p className="text-[14px] font-medium">Nom de la catégorie :</p>
            <Input
              placeholder="e.g. Pants"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <Button
            onClick={handleCreate}
            disabled={!name.trim() || isCreating}
            className="bg-primary text-white hover:bg-primary/90 mt-2"
          >
            {isCreating ? "Création..." : "Créer"}
          </Button>
        </ResponsivePopover>
      </div>
    </div>
  );
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
