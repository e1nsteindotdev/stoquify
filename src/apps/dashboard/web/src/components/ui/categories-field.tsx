import { useState } from "react";
import { useFieldContext } from "@/hooks/form-context.tsx";
import { useMutation, useQuery } from "convex/react";
import { api } from "api/convex";
import { Label } from "./label";
import { Button } from "./button";

import { Input } from "./input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./select";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"


type Props = {
  label?: string;
};

export default function CategoriesField({ label }: Props) {
  const field = useFieldContext<string>();
  const categories = useQuery(api.products.listCategories) ?? [];
  const createCategory = useMutation(api.products.createCategory as any);

  const [createOpen, setCreateOpen] = useState(false);
  const [name, setName] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  async function handleCreate() {
    if (!name.trim() || isCreating) return;
    setIsCreating(true);
    try {
      const id = await createCategory({ name });
      // Select the newly created category
      field.handleChange(String(id) as any);
      setCreateOpen(false);
      setName("");
    } finally {
      setIsCreating(false);
    }
  }

  return (
    <div className="grid gap-3">
      <div className="flex flex-col gap-3">
        {label && <Label className="font-semibold">{label}</Label>}
        <Select
          value={(field.state.value as string) ?? ""}
          onValueChange={(v) => field.handleChange(v as any)}
        >
          <SelectTrigger className="w-full py-4">
            <SelectValue placeholder="Select an option" />
          </SelectTrigger>
          <SelectContent className="bg-card">
            {categories.map((c) => (
              <SelectItem key={c._id} className="focus:bg-black/5" value={String(c._id)}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="h-[1px] w-[98%] bg-black/10 justify-self-center mt-1" />

      <Popover>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            className="justify-start pl-2 py-0 htext-[15px] text-foreground/90 hover:text-foreground w-fit"
          >
            <div className="rounded-full border-[1.5px] border-black center p-[4px]">
              <AddIcon />
            </div>
            <p className="text-[16px]">
              Add another category
            </p>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="flex flex-col gap-4 w-80 bg-card border-[#FBFAFD]">
          <div className="flex flex-col gap-2">
            <p>Create New category</p>
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
            {isCreating ? "Creating..." : "Create"}
          </Button>
        </PopoverContent>
      </Popover>
    </div >
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
  )
}
