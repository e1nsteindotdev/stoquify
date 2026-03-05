import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useFieldContext } from "@/hooks/form-context.tsx";
import { Button } from "@/components/ui/button";

import { Input } from "@/components/ui/input";
import { ResponsivePopover } from "@/components/ui/responsive-popover";
import { CircleX, PlusIcon } from "lucide-react";
import { toast } from "sonner";
import { Checkbox } from "@/components/ui/checkbox";
import type { Id } from "api/data-model";
import { useGetCollections } from "@/database/collections";
import { convex } from "@/lib/convex-client";
import { api } from "api/convex";
import { queryClient } from "@/lib/ts-query-client";
import { useAppStore } from "@/lib/store";

export default function CollectionsField({
  selectedCollections,
}: {
  selectedCollections: Id<"collections">[];
}) {
  const field = useFieldContext<Id<"collections">[]>();
  const collectionsResult = useGetCollections();
  const collections = collectionsResult?.data;

  const [name, setName] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [openCreate, setOpenCreate] = useState(false);

  async function handleCreate() {
    if (!name.trim() || isAdding) return;
    const storeId = useAppStore.getState().selectedStore?._id;
    if (!storeId) {
      toast.error("Aucune boutique sélectionnée");
      return;
    }
    setIsAdding(true);
    try {
      const res = await convex.mutation(api.collections.createCollection, {
        storeId,
        title: name,
      });
      if (res.ok) {
        toast.success("Collection ajoutée avec succès");
        queryClient.refetchQueries({ queryKey: ["collections"] });
        setName("");
        setOpenCreate(false);
      } else {
        toast.error(res.msg);
      }
    } finally {
      setIsAdding(false);
    }
  }

  const isSelected = (id: Id<"collections">) =>
    selectedCollections.includes(id);

  return (
    <div>
      <Card className="gap-2 border-white">
        <CardHeader>
          <CardTitle>Collections</CardTitle>
          <CardDescription>
            Ajouter un produit à des collections le fera apparaître sur la page
            d'accueil de la boutique
          </CardDescription>
        </CardHeader>

        <CardContent>
          <ResponsivePopover
            title="Ajouter à une collection"
            trigger={
              <Button className="bg-transparent border-1 w-full justify-start py-2 border-black/20 text-black/70 hover:bg-transparent rounded-none">
                <PlusIcon />
                Ajouter à une nouvelle collection
              </Button>
            }
          >
            {collections?.length !== 0 ? (
              collections?.map((c) => (
                <div key={c._id} className="flex gap-2 items-center uppercase">
                  <Checkbox
                    checked={isSelected(c._id)}
                    onCheckedChange={(checked) => {
                      return checked
                        ? field.setValue((prev) => [...prev, c._id])
                        : field.setValue((prev) =>
                            prev.filter((id) => id !== c._id),
                          );
                    }}
                  />
                  <p className="text-[12px]">{c.title}</p>
                </div>
              ))
            ) : (
              <div className="py-2 text-black/50 italic text-[12px] px-2 uppercase">
                Aucune collection n'existe, créez d'abord une nouvelle
                collection.
              </div>
            )}
          </ResponsivePopover>

          {selectedCollections.length === 0 ? (
            <div className="pt-3 text-black/50 italic text-[12px] uppercase">
              Le produit n'est ajouté à aucune collection
            </div>
          ) : (
            <div className="flex flex-col gap-2 pt-3">
              {selectedCollections.map((c) => (
                <div
                  key={c}
                  className="px-4 flex w-full justify-between items-center py-2 rounded-[12px] bg-[#E4E4E4]"
                >
                  <p className="text-[12px]">
                    {collections?.find((i) => i._id === c)?.title}
                  </p>
                  <CircleX
                    color="red"
                    size={20}
                    className="cursor-pointer"
                    onClick={() => {
                      field.setValue((prev) => prev.filter((id) => id !== c));
                    }}
                  />
                </div>
              ))}
            </div>
          )}
          <div className="h-[1px] w-[98%] bg-black/5 justify-self-center mt-3 mb-3" />

          <ResponsivePopover
            title="Nouvelle collection"
            open={openCreate}
            onOpenChange={setOpenCreate}
            trigger={
              <Button
                type="button"
                variant="ghost"
                className="flex gap-1 justify-start pl-2 py-2 text-[15px] text-foreground/90 hover:text-foreground w-full border border-neutral-300 hover:bg-black/5 rounded-none"
              >
                <div className="rounded-none scale-60 border-[1.5px] border-black center p-[4px]">
                  <AddIcon />
                </div>
                <p className="text-[14px]">Créer une nouvelle collection</p>
              </Button>
            }
          >
            <div className="flex flex-col gap-4">
              <p className="text-[14px] font-medium">Nom de la collection :</p>
              <Input
                placeholder="e.g. New Arrival"
                value={name}
                className="py-1"
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <Button
              onClick={handleCreate}
              disabled={!name.trim() || isAdding}
              className="bg-primary text-white hover:bg-primary/90 mt-4 w-full"
            >
              {isAdding ? "Création..." : "Créer"}
            </Button>
          </ResponsivePopover>
        </CardContent>
      </Card>
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
