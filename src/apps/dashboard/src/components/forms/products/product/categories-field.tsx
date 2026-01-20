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

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

import { useStore } from "@livestore/react";
import { categories$, shopId$, events } from "@/livestore/schema";

type Props = {
  label?: string;
};

export default function CategoriesField({ label }: Props) {
  const field = useFieldContext<string>();
  const { store } = useStore();
  const shopId = store.query(shopId$);
  const categoriesResult = store.useQuery(categories$);
  const categories = categoriesResult ?? [];

  const [createOpen, setCreateOpen] = useState(false);
  const [name, setName] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [newCategoryId, setNewCategoryId] = useState<string | null>(null);

  async function handleCreate() {
    if (!name.trim() || isCreating || !shopId) return;
    setIsCreating(true);
    try {
      const id = crypto.randomUUID();
      store.commit(
        events.categoryInserted({
          id,
          shop_id: shopId,
          name: name.trim(),
          createdAt: new Date(),
          deletedAt: null,
        }),
      );
      field.handleChange(id as any);
      setNewCategoryId(id);
      setCreateOpen(false);
      setName("");
    } catch (e) {
      console.log("erorr while creating a new category", e)
    } finally {
      setIsCreating(false);
    }
  }

  return (
    <div className="grid">
      {label && <Label className="font-semibold pb-[12px]">{label}</Label>}
      <div className="space-y-1 border border-neutral-300 rounded-[15px] p-3">
        <Select
          value={(newCategoryId || (field.state.value as string)) ?? ""}
          onValueChange={(v) => {
            setNewCategoryId(null);
            field.handleChange(v as any);
          }}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Sélectionner une option" />
          </SelectTrigger>
          <SelectContent className="bg-card">
            {categories.map((c) => (
              <SelectItem key={c.id} className="focus:bg-black/5" value={c.id}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="h-[1px] w-[98%] bg-black/5 justify-self-center mt-3" />

        <Popover open={createOpen} onOpenChange={setCreateOpen}>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              className="flex gap-1 justify-start pl-2 py-0 text-[15px] text-foreground/90 hover:text-foreground w-fit"
            >
              <div className="rounded-full scale-60 border-[1.5px] border-black center p-[4px]">
                <AddIcon />
              </div>
              <p className="text-[14px]">Ajouter une autre catégorie</p>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="flex flex-col gap-4 w-80 bg-card border-[#FBFAFD]">
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
              className="rounded-[12px] bg-[#DDDAE7] text-primary"
            >
              {isCreating ? "Création..." : "Créer"}
            </Button>
          </PopoverContent>
        </Popover>
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
