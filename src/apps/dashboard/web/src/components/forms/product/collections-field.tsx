import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { useFieldContext } from "@/hooks/form-context.tsx";
import { useMutation, useQuery } from "convex/react";
import { api } from "api/convex";
import { Button } from "@/components/ui/button";

import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CircleX, PlusIcon } from "lucide-react";
import { toast } from "sonner";
import { Checkbox } from "@/components/ui/checkbox"
import type { Id } from "api/data-model";

export default function CollectionsField({ selectedCollections }: { selectedCollections: Set<Id<'collections'>> }) {
  const field = useFieldContext<Set<string>>();
  console.log("selected collections :", selectedCollections)
  const createCollection = useMutation(api.collections.createCollection);
  const collections = useQuery(api.collections.listAllCollections, {})

  const [createOpen, setCreateOpen] = useState(false);
  const [name, setName] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  async function handleCreate() {
    if (!name.trim() || isAdding) return;
    setIsAdding(true);
    try {
      const res = await createCollection({ title: name });
      if (res.ok) {
        toast.success('Collection added succesfully')
      } else {
        toast.error(res.msg,)
      }
      // Select the newly created category
      //field.handleChange(String(id) as any);
      setCreateOpen(false);
      setName("");
    } finally {
      setIsAdding(false);
    }
  }

  return (
    <div>
      <Card className="gap-2 border-white">
        <CardHeader>
          <CardTitle>Collections</CardTitle>
          <CardDescription>Adding a product to collections will make it appear in the home page in the store</CardDescription>
        </CardHeader>

        <CardContent>
          <Popover>
            <PopoverTrigger asChild>
              <Button className="bg-transparent border-1 w-full justify-start py-2 border-black/20 text-black/70 hover:bg-transparent">
                <PlusIcon />
                Add to a new collection</Button>
            </PopoverTrigger>
            <PopoverContent className="flex flex-col gap-4 w-80 bg-card border-[#FBFAFD]">
              {
                collections?.length !== 0 ?
                  collections?.map(c =>
                    <div className="flex gap-2 items-center uppercase">
                      <Checkbox
                        checked={selectedCollections.has(c._id)}
                        onCheckedChange={(checked) => {
                          return checked ?
                            field.setValue(prev =>
                              prev.add(c._id))
                            : field.setValue(prev => {
                              prev.delete(c._id)
                              return prev
                            })
                        }}
                      />
                      <p className="text-[12px]">{c.title}</p>
                    </div>)
                  :
                  <div className="py-2 text-black/50 italic text-[12px] px-2 uppercase">
                    No collections exist, create a new collection first.
                  </div>
              }
            </PopoverContent>
          </Popover>

          {selectedCollections.size === 0 ?
            <div className="pt-3 text-red-400 italic text-[12px] uppercase">
              Product is added to no collections
            </div>
            :
            <div className="flex flex-col gap-2 pt-3">
              {Array.from(selectedCollections).map(c => (
                <div className="px-4 flex w-full justify-between items-center py-2 rounded-[12px] bg-[#E4E4E4]">
                  <p className="text-[12px]">{collections?.filter(i => i._id === c)?.[0].title}</p>
                  <CircleX color="red" size={20} onClick={() => {
                    field.setValue(prev => { prev.delete(c); return prev })
                  }} />
                </div>
              ))}

            </div>
          }
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
                <p className="text-[14px]">Create a new collection</p>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="flex flex-col gap-4 w-80 bg-card border-[#FBFAFD] shadow-black/40 shadow-lg ">
              <div className="flex flex-col gap-4">
                <p className="text-[14px] font-medium">Collection name:</p>
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
                {isAdding ? "Creating..." : "Create"}
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
