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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CircleX, PlusIcon } from "lucide-react";
import { toast } from "sonner";
import { Checkbox } from "@/components/ui/checkbox";
import { useStore } from "@livestore/react";
import { collections$, shopId$, events } from "@/livestore/schema";

export default function CollectionsField({
  selectedCollections,
}: {
  selectedCollections: Set<string>;
}) {
  const field = useFieldContext<Set<string>>();
  const { store } = useStore();
  const shopId = store.query(shopId$);
  const collectionsResult = store.useQuery(collections$);
  const collections = collectionsResult ?? [];

  const [createOpen, setCreateOpen] = useState(false);
  const [name, setName] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  async function handleCreate() {
    if (!name.trim() || isAdding || !shopId) return;
    setIsAdding(true);
    try {
      store.commit(
        events.collectionInserted({
          id: crypto.randomUUID(),
          shop_id: shopId,
          name: name.trim(),
          createdAt: new Date(),
          deletedAt: null,
        }),
      );
      toast.success("Collection ajoutée avec succès");
      setCreateOpen(false);
      setName("");
    } catch (error) {
      toast.error("Erreur lors de la création");
    } finally {
      setIsAdding(false);
    }
  }

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
          <Popover open={createOpen} onOpenChange={setCreateOpen}>
            <PopoverTrigger asChild>
              <Button className="bg-transparent border-1 w-full justify-start py-2 border-black/20 text-black/70 hover:bg-transparent">
                <PlusIcon />
                Ajouter à une nouvelle collection
              </Button>
            </PopoverTrigger>
            <PopoverContent className="flex flex-col gap-4 w-80 bg-card border-[#FBFAFD]">
              {collections.length !== 0 ? (
                collections.map((c) => (
                  <div className="flex gap-2 items-center uppercase" key={c.id}>
                    <Checkbox
                      checked={selectedCollections.has(c.id)}
                      onCheckedChange={(checked) => {
                        return checked
                          ? field.setValue((prev) => prev.add(c.id))
                          : field.setValue((prev) => {
                              prev.delete(c.id);
                              return prev;
                            });
                      }}
                    />
                    <p className="text-[12px]">{c.name}</p>
                  </div>
                ))
              ) : (
                <div className="py-2 text-black/50 italic text-[12px] px-2 uppercase">
                  Aucune collection n'existe, créez d'abord une nouvelle
                  collection.
                </div>
              )}
            </PopoverContent>
          </Popover>

          {selectedCollections.size === 0 ? (
            <div className="pt-3 text-red-400 italic text-[12px] uppercase">
              Le produit n'est ajouté à aucune collection
            </div>
          ) : (
            <div className="flex flex-col gap-2 pt-3">
              {Array.from(selectedCollections).map((c) => (
                <div
                  className="px-4 flex w-full justify-between items-center py-2 rounded-[12px] bg-[#E4E4E4]"
                  key={c}
                >
                  <p className="text-[12px]">
                    {collections.find((i) => i.id === c)?.name}
                  </p>
                  <CircleX
                    color="red"
                    size={20}
                    onClick={() => {
                      field.setValue((prev) => {
                        prev.delete(c);
                        return prev;
                      });
                    }}
                  />
                </div>
              ))}
            </div>
          )}
          <div className="h-[1px] w-[98%] bg-black/5 justify-self-center mt-3" />

          <Popover>
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                className="flex pt-3 gap-1 justify-start pl-2 py-0 text-[15px] text-foreground/90 hover:text-foreground w-fit"
              >
                <div className="rounded-full scale-60 border-[1.5px] border-black center p-[4px]">
                  <AddIcon />
                </div>
                <p className="text-[14px]">Créer une nouvelle collection</p>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="flex flex-col gap-4 w-80 bg-card border-[#FBFAFD] shadow-black/40 shadow-lg ">
              <div className="flex flex-col gap-4">
                <p className="text-[14px] font-medium">
                  Nom de la collection :
                </p>
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
                className="rounded-[12px] bg-[#DDDAE7] text-primary"
              >
                {isAdding ? "Création..." : "Créer"}
              </Button>
            </PopoverContent>
          </Popover>
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
