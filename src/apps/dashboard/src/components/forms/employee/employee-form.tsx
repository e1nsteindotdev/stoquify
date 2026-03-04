import { useState, useEffect, useMemo } from "react";
import { useAppStore } from "@/lib/store";
import { useQuery } from "@tanstack/react-query";
import { api } from "api/convex";
import { useAppForm } from "@/hooks/form";
import { Effect } from "effect";
import { effectRuntime } from "@/lib/effect-runtime";
import { convex } from "@/lib/convex-client";
import type { Id } from "api/data-model";

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
import { ClipLoader } from "react-spinners";
import { CopyIcon, QrCode, ChevronDown } from "lucide-react";
import QRCode from "react-qr-code";
import { toast } from "sonner";
import { availableResources } from "@/lib/permissions";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

export type Role = "founder" | "admin" | "staff";

interface Permission {
  storeId?: string;
  resource: string;
  action: "read" | "write" | "*";
}

interface EmployeeFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultRole?: Role;
  inviteId?: Id<"magicLinks"> | null;
}

export function EmployeeForm({
  open,
  onOpenChange,
  defaultRole = "staff",
  inviteId,
}: EmployeeFormProps) {
  const stores = useAppStore((state) => state.stores);
  const [generatedLink, setGeneratedLink] = useState<string | null>(null);
  const [showQR, setShowQR] = useState(false);
  const user = useAppStore((state) => state.user);

  const isNew = !inviteId;

  const { data: existingInvite } = useQuery({
    queryKey: ["invite", inviteId],
    queryFn: () =>
      convex.query(api.magicLinks.getById, { magicLinkId: inviteId! }),
    enabled: !!inviteId,
  });

  const defaultPermissions = useMemo(() => {
    if (existingInvite && existingInvite.permissions) {
      return existingInvite.permissions.map((p: any) => ({
        storeId: p.storeId,
        resource: p.resource,
        action: p.action,
      }));
    }
    return [];
  }, [existingInvite]);

  const defaultValues = useMemo(
    () => ({
      role: existingInvite?.role ?? defaultRole,
      permissions: defaultPermissions,
    }),
    [existingInvite, defaultRole, defaultPermissions],
  );

  const form = useAppForm({
    defaultValues,
    onSubmit: async ({ value }) => {
      const orgId = user?.organization._id;
      if (!orgId) throw new Error("no org id");
      const permissions = value.permissions.map((p) => ({
        storeId: p.storeId ? (p.storeId as any) : undefined,
        resource: p.resource,
        action: p.action,
      }));

      const program = Effect.gen(function* () {
        if (isNew) {
          const result = yield* Effect.promise(() =>
            convex.mutation(api.magicLinks.invite, {
              role: value.role,
              permissions,
              organizationId: orgId,
            }),
          );
          const link = `${window.location.origin}/magic-link?magicLinkId=${result._id}`;
          return link;
        } else {
          yield* Effect.promise(() =>
            convex.mutation(api.magicLinks.update, {
              invitationId: inviteId!,
              permissions,
            }),
          );
          return null;
        }
      });

      const link = await effectRuntime.runPromise(program);

      if (isNew && link) {
        setGeneratedLink(link);
      }

      onOpenChange(false);
      toast.success(
        isNew ? "Invitation créée avec succès" : "Invitation mise à jour",
      );
    },
  });

  useEffect(() => {
    if (open) {
      form.reset(defaultValues);
    }
  }, [open, defaultValues]);

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
        onOpenChange={(o) => {
          if (!o) {
            setGeneratedLink(null);
            onOpenChange(false);
          }
        }}
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
              className="flex-1 rounded-none"
            >
              <CopyIcon className="w-4 h-4 mr-2" />
              Copier le lien
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowQR(true)}
              className="flex-1 rounded-none"
            >
              <QrCode className="w-4 h-4 mr-2" />
              Afficher QR
            </Button>
            <Button
              onClick={() => {
                setGeneratedLink(null);
                onOpenChange(false);
              }}
              className="rounded-none"
            >
              Fermer
            </Button>
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
          <DialogTitle>
            {isNew ? "Ajouter un employé" : "Modifier l'invitation"}
          </DialogTitle>
          <DialogDescription>
            {isNew
              ? "Créez une invitation pour ajouter un nouvel employé à votre organisation."
              : "Modifiez les permissions de cette invitation."}
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
            <Label className="text-sm font-medium">Permissions</Label>
            <PermissionBuilder stores={stores} form={form} />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="rounded-none"
            >
              Annuler
            </Button>
            <form.Subscribe
              selector={(state) => [state.canSubmit, state.isSubmitting]}
              children={([canSubmit, isSubmitting]) => (
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="rounded-none"
                >
                  {isSubmitting ? (
                    <ClipLoader size={16} />
                  ) : isNew ? (
                    "Créer l'invitation"
                  ) : (
                    "Mettre à jour"
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

function PermissionBuilder({ stores, form }: { stores: any[]; form: any }) {
  const [expandedStores, setExpandedStores] = useState<string[]>(() => {
    return stores.length > 0 ? [stores[0]._id] : [];
  });

  const toggleStore = (storeId: string) => {
    setExpandedStores((prev) =>
      prev.includes(storeId)
        ? prev.filter((id) => id !== storeId)
        : [...prev, storeId],
    );
  };

  const getPermission = (storeId: string, resource: string) => {
    const perms = form.getFieldValue("permissions") || [];
    return perms.find(
      (p: Permission) => p.storeId === storeId && p.resource === resource,
    )?.action;
  };

  const setPermission = (
    storeId: string,
    resource: string,
    action: "read" | "write" | "*" | "none",
  ) => {
    const currentPerms = form.getFieldValue("permissions") || [];
    const filtered = currentPerms.filter(
      (p: Permission) => !(p.storeId === storeId && p.resource === resource),
    );
    if (action === "none") {
      form.setFieldValue("permissions", filtered);
    } else {
      form.setFieldValue("permissions", [
        ...filtered,
        { storeId, resource, action },
      ]);
    }
  };

  return (
    <div className="space-y-3">
      {stores.map((store) => (
        <Collapsible
          key={store._id}
          open={expandedStores.includes(store._id)}
          onOpenChange={() => toggleStore(store._id)}
        >
          <div className="border overflow-hidden">
            <CollapsibleTrigger className="w-full">
              <div className="flex items-center justify-between p-4 hover:bg-accent/50 transition-colors">
                <span className="font-medium">{store.name}</span>
                <ChevronDown
                  className={`h-4 w-4 transition-transform ${
                    expandedStores.includes(store._id) ? "rotate-180" : ""
                  }`}
                />
              </div>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="border-t bg-accent/20">
                <table className="w-full">
                  <tbody>
                    {availableResources.map((perm: any) => {
                      return (
                        <tr key={perm.key} className="border-b last:border-b-0">
                          <td className="px-4 py-3">
                            <div className="text-sm font-medium uppercase">
                              {perm.label}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <form.Subscribe
                              selector={(state) => state.values.permissions}
                              children={(permissions: Permission[]) => {
                                const currentPerm = permissions?.find(
                                  (p) =>
                                    p.storeId === store._id &&
                                    p.resource === perm.key,
                                )?.action;

                                return (
                                  <div className="flex gap-1 overflow-hidden border inline-flex">
                                    {["none", "read", "write"].map((action) => {
                                      const actionValue = action as
                                        | "none"
                                        | "read"
                                        | "write";
                                      const isSelected =
                                        actionValue === "none"
                                          ? !currentPerm
                                          : currentPerm === actionValue;

                                      return (
                                        <button
                                          key={action}
                                          type="button"
                                          onClick={() =>
                                            setPermission(
                                              store._id,
                                              perm.key,
                                              actionValue,
                                            )
                                          }
                                          className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                                            isSelected
                                              ? "bg-primary text-primary-foreground"
                                              : "bg-background hover:bg-primary/20"
                                          }`}
                                        >
                                          {action === "none"
                                            ? "Aucun"
                                            : action === "read"
                                              ? "Lecteur"
                                              : "Éditeur"}
                                        </button>
                                      );
                                    })}
                                  </div>
                                );
                              }}
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CollapsibleContent>
          </div>
        </Collapsible>
      ))}
    </div>
  );
}
