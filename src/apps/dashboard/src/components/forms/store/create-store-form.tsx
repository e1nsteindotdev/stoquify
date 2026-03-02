import { useState } from "react";
import { useAppForm } from "@/hooks/form";
import { useAppStore } from "@/lib/store";
import { convex } from "@/lib/convex-client";
import { api } from "api/convex";
import { Effect } from "effect";
import { effectRuntime } from "@/lib/effect-runtime";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ClipLoader } from "react-spinners";
import { ArrowRight } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

interface CreateStoreFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface CreateStoreSuccessProps {
  storeName: string;
  onSwitch: () => void;
  onClose: () => void;
}

function CreateStoreSuccess({
  storeName,
  onSwitch,
  onClose,
}: CreateStoreSuccessProps) {
  return (
    <DialogContent className="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>Boutique créée</DialogTitle>
        <DialogDescription>
          La boutique "{storeName}" a été créée avec succès.
        </DialogDescription>
      </DialogHeader>
      <DialogFooter className="flex-row gap-2 justify-center sm:justify-center">
        <Button variant="outline" onClick={onClose}>
          Fermer
        </Button>
        <Button onClick={onSwitch}>
          <ArrowRight className="w-4 h-4 mr-2" />
          Changer vers cette boutique
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}

export function CreateStoreForm({ open, onOpenChange }: CreateStoreFormProps) {
  const setStores = useAppStore((state) => state.setStores);
  const stores = useAppStore((state) => state.stores);
  const setStore = useAppStore((state) => state.setStore);
  const [createdStore, setCreatedStore] = useState<{
    id: string;
    name: string;
  } | null>(null);

  const form = useAppForm({
    defaultValues: {
      name: "",
    },
    onSubmit: async ({ value }) => {
      const program = Effect.gen(function* () {
        const storeId = yield* Effect.promise(() =>
          convex.mutation(api.stores.create, { name: value.name }),
        );
        return { id: storeId, name: value.name };
      });

      const result = await effectRuntime.runPromise(program);

      const updatedStores = await convex.query(api.stores.list);
      setStores(updatedStores);

      setCreatedStore(result);
      onOpenChange(false);
      toast.success("Boutique créée avec succès");
    },
  });

  const handleSwitchToNewStore = () => {
    if (!createdStore) return;
    const store = stores.find((s) => s._id === createdStore.id);
    if (store) {
      setStore(store);
    }
    setCreatedStore(null);
  };

  const handleCloseSuccess = () => {
    setCreatedStore(null);
  };

  if (createdStore) {
    return (
      <Dialog
        open={!!createdStore}
        onOpenChange={(o) => !o && setCreatedStore(null)}
      >
        <CreateStoreSuccess
          storeName={createdStore.name}
          onSwitch={handleSwitchToNewStore}
          onClose={handleCloseSuccess}
        />
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Créer une nouvelle boutique</DialogTitle>
          <DialogDescription>
            Entrez le nom de votre nouvelle boutique.
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            form.handleSubmit();
          }}
          className="space-y-4"
        >
          <form.AppField
            name="name"
            validators={{
              onChange: ({ value }) => {
                if (!value || value.trim().length === 0) {
                  return "Le nom de la boutique est requis";
                }
                if (value.length < 2) {
                  return "Le nom doit contenir au moins 2 caractères";
                }
                return undefined;
              },
            }}
            children={(field) => (
              <field.TextField
                label="Nom de la boutique"
                placeholder="Ma boutique"
                autoFocus
              />
            )}
          />

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Annuler
            </Button>
            <form.Subscribe
              selector={(state) => [state.canSubmit, state.isSubmitting]}
              children={([canSubmit, isSubmitting]) => (
                <Button type="submit" disabled={!canSubmit || isSubmitting}>
                  {isSubmitting ? <ClipLoader size={16} /> : "Créer"}
                </Button>
              )}
            />
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
