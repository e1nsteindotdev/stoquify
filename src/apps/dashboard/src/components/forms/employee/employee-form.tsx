import { useState, useMemo } from "react";
import { useAppStore } from "@/lib/store";
import { useQuery } from "@tanstack/react-query"
import { api } from "api/convex";
import { useAppForm } from "@/hooks/form";
import { Effect } from "effect";
import { effectRuntime } from "@/lib/effect-runtime";
import { convex } from "@/lib/convex-client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { ClipLoader } from "react-spinners";
import { CheckIcon, CopyIcon, QrCode, Trash2 } from "lucide-react";
import QRCode from "react-qr-code";
import { toast } from "sonner";

type Role = "founder" | "admin" | "staff";

interface Permission {
  storeId?: string;
  resource: string;
  action: "read" | "write" | "update" | "delete" | "create" | "*";
}

interface EmployeeFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EmployeeForm({ open, onOpenChange }: EmployeeFormProps) {
  const stores = useAppStore((state) => state.stores);
  const [generatedLink, setGeneratedLink] = useState<string | null>(null);
  const [showQR, setShowQR] = useState(false);
  const user = useAppStore(state => state.user)

  // const availablePermissions = await convex.query(api.permissions.list)
  const defaultPermissions: Permission[] = [];

  const form = useAppForm({
    defaultValues: {
      role: "staff" as Role,
      email: "",
      allAccess: false,
      permissions: defaultPermissions,
    },
    onSubmit: async ({ value }) => {
      const orgId = user?.organization._id
      if (!orgId) throw new Error('no org id')
      const permissions = value.allAccess
        ? [{ resource: "*", action: "*" as const }]
        : value.permissions.map((p) => ({
          storeId: p.storeId ? (p.storeId as any) : undefined,
          resource: p.resource,
          action: p.action,
        }));

      const program = Effect.gen(function*() {
        const result = yield* Effect.promise(() => convex.mutation(api.magicLinks.invite, {
          email: value.email || undefined,
          role: value.role,
          permissions,
          organizationId: orgId
        })
        );
        const link = `${window.location.origin}/magic-link?magicLinkId=${result._id}`;
        return link;
      });

      const link = await effectRuntime.runPromise(program);
      setGeneratedLink(link);
      onOpenChange(false);
      toast.success("Invitation créée avec succès");
    },
  });

  const handleCopyLink = () => {
    if (generatedLink) {
      navigator.clipboard.writeText(generatedLink);
      toast.success("Lien copié dans le presse-papiers");
    }
  };

  if (generatedLink) {
    return (
      <Dialog
        open={!!generatedLink}
        onOpenChange={(o) => !o && setGeneratedLink(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Invitation créée</DialogTitle>
            <DialogDescription>
              Partagez ce lien avec l'employé pour qu'il puisse créer son
              compte.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center gap-4 py-4">
            <div className="bg-white p-4 rounded-lg">
              <QRCode value={generatedLink} size={180} />
            </div>
            <p className="text-xs text-gray-500 break-all text-center px-2">
              {generatedLink}
            </p>
          </div>
          <DialogFooter className="flex-row gap-2 justify-center">
            <Button
              variant="outline"
              onClick={handleCopyLink}
              className="flex-1"
            >
              <CopyIcon className="w-4 h-4 mr-2" />
              Copier le lien
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowQR(true)}
              className="flex-1"
            >
              <QrCode className="w-4 h-4 mr-2" />
              Afficher QR
            </Button>
            <Button onClick={() => setGeneratedLink(null)}>Fermer</Button>
          </DialogFooter>

          <Dialog open={showQR} onOpenChange={setShowQR}>
            <DialogContent className="sm:max-w-sm">
              <DialogHeader>
                <DialogTitle>Scanner le QR Code</DialogTitle>
              </DialogHeader>
              <div className="flex justify-center p-4">
                <QRCode value={generatedLink} size={280} />
              </div>
            </DialogContent>
          </Dialog>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Ajouter un employé</DialogTitle>
          <DialogDescription>
            Créez une invitation pour ajouter un nouvel employé à votre
            organisation.
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            form.handleSubmit();
          }}
          className="space-y-6"
        >
          <div className="space-y-4">
            <div>
              <Label>Rôle</Label>
              <form.AppField
                name="role"
                children={(field) => (
                  <Select
                    value={field.state.value}
                    onValueChange={(v) => field.handleChange(v as Role)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner un rôle" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="founder">Fondateur</SelectItem>
                      <SelectItem value="admin">Administrateur</SelectItem>
                      <SelectItem value="staff">Staff</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            <div>
              <Label>Email (optionnel)</Label>
              <form.AppField
                name="email"
                children={(field) => (
                  <input
                    type="email"
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder="employé@exemple.com"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  />
                )}
              />
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <form.AppField
                name="allAccess"
                children={(field) => (
                  <Checkbox
                    id="allAccess"
                    checked={field.state.value}
                    onCheckedChange={(checked) => field.handleChange(!!checked)}
                  />
                )}
              />
              <Label htmlFor="allAccess" className="text-sm font-medium">
                Tous les accès
              </Label>
            </div>

            {!form.getFieldValue("allAccess") && (
              <div className="space-y-4 border rounded-lg p-4">
                <Label className="text-sm font-medium">Permissions</Label>
                <PermissionBuilder
                  stores={stores}
                  form={form}
                />
              </div>
            )}
          </div>

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
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <ClipLoader size={16} />
                  ) : (
                    "Créer l'invitation"
                  )}
                </Button>
              )}
            />
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function PermissionBuilder({
  stores,
  form,
}: {
  stores: any[];
  form: any;
}) {
  const [selectedResources, setSelectedResources] = useState<string[]>([]);

  const toggleResource = (resource: string) => {
    setSelectedResources((prev) =>
      prev.includes(resource)
        ? prev.filter((r) => r !== resource)
        : [...prev, resource],
    );
  };
  const { isLoading, data: availablePermissions } = useQuery({
    queryKey: ['availablePermissions'],
    queryFn: async () => await convex.query(api.permissions.list)
  })
  if (isLoading) return <p>Loading...</p>
  if (!availablePermissions) return <p>error</p>

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {availablePermissions.map((perm) => (
          <label
            key={perm.key}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md border cursor-pointer transition-colors ${selectedResources.includes(perm.key)
              ? "bg-primary/10 border-primary"
              : "hover:bg-accent"
              }`}
          >
            <Checkbox
              checked={selectedResources.includes(perm.key)}
              onCheckedChange={() => toggleResource(perm.key)}
            />
            <span className="text-sm">{perm.label}</span>
          </label>
        ))}
      </div>

      {selectedResources.map((resource) => (
        <div key={resource} className="border rounded-lg p-3 space-y-3">
          <Label className="font-medium">
            {availablePermissions.find((p) => p.key === resource)?.label}
          </Label>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-xs text-muted-foreground">Boutique</Label>
              <form.Subscribe
                selector={(state) => state.values.permissions}
                children={(perms: Permission[]) => {
                  const perm = perms?.find((p) => p.resource === resource);
                  return (
                    <Select
                      value={perm?.storeId || "all"}
                      onValueChange={(storeId) => {
                        const currentPerms =
                          form.getFieldValue("permissions") || [];
                        const filtered = currentPerms.filter(
                          (p: Permission) => p.resource !== resource,
                        );
                        if (storeId === "all") {
                          form.setFieldValue("permissions", [
                            ...filtered,
                            { resource, action: "read" },
                          ]);
                        } else {
                          form.setFieldValue("permissions", [
                            ...filtered,
                            { resource, action: "read", storeId },
                          ]);
                        }
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Toutes les boutiques" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">
                          Toutes les boutiques
                        </SelectItem>
                        {stores.map((store) => (
                          <SelectItem key={store._id} value={store._id}>
                            {store.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  );
                }}
              />
            </div>

            <div>
              <Label className="text-xs text-muted-foreground">Action</Label>
              <form.Subscribe
                selector={(state) => state.values.permissions}
                children={(perms: Permission[]) => {
                  const perm = perms?.find((p) => p.resource === resource);
                  return (
                    <Select
                      value={perm?.action || "read"}
                      onValueChange={(action) => {
                        const currentPerms =
                          form.getFieldValue("permissions") || [];
                        const existingIdx = currentPerms.findIndex(
                          (p: Permission) => p.resource === resource,
                        );
                        if (existingIdx >= 0) {
                          const updated = [...currentPerms];
                          updated[existingIdx] = {
                            ...updated[existingIdx],
                            action: action as Permission["action"],
                          };
                          form.setFieldValue("permissions", updated);
                        } else {
                          form.setFieldValue("permissions", [
                            ...currentPerms,
                            {
                              resource,
                              action: action as Permission["action"],
                            },
                          ]);
                        }
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="read">Lire</SelectItem>
                        <SelectItem value="write">Écrire</SelectItem>
                        <SelectItem value="create">Créer</SelectItem>
                        <SelectItem value="update">Modifier</SelectItem>
                        <SelectItem value="delete">Supprimer</SelectItem>
                        <SelectItem value="*">Tous</SelectItem>
                      </SelectContent>
                    </Select>
                  );
                }}
              />
            </div>
          </div>
        </div>
      ))}

      {selectedResources.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-4">
          Sélectionnez une ressource pour configurer les permissions
        </p>
      )}
    </div>
  );
}
