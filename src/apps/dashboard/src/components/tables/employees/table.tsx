import { api } from "api/convex";
import { Button } from "@/components/ui/button";
import { PlusIcon, CopyIcon, QrCode, Trash2, Settings } from "lucide-react";
import { useState } from "react";
import { PermissionGuard } from "@/components/permission-guard";
import { EmployeeForm } from "@/components/forms/employee/employee-form";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import QRCode from "react-qr-code";
import type { Role } from "@/components/forms/employee/employee-form";
import type { Id } from "api/data-model";
import { Skeleton } from "@/components/ui/skeleton";
import { convex } from "@/lib/convex-client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

const roleLabels: Record<string, string> = {
  founder: "Patron",
  admin: "Administrateur",
  staff: "Staff",
};

const roleOrder: Role[] = ["founder", "admin", "staff"];

export function EmployeesTable() {
  const queryClient = useQueryClient();
  const [formState, setFormState] = useState<{
    open: boolean;
    role: Role;
    inviteId?: Id<"magicLinks"> | null;
  }>({
    open: false,
    role: "staff",
    inviteId: null,
  });
  const [showQR, setShowQR] = useState<string | null>(null);
  const { data: users = [], isLoading: isUsersLoading } = useQuery({
    queryKey: ["users", "organization"],
    queryFn: () => convex.query(api.users.listOrganization),
  });
  const { data: pendingInvites = [], isLoading: isInvitesLoading } = useQuery({
    queryKey: ["magicLinks", "pending"],
    queryFn: () => convex.query(api.magicLinks.listPending),
  });
  const revoke = useMutation({
    mutationFn: (invitationId: string) =>
      convex.mutation(api.magicLinks.remove, {
        invitationId: invitationId as any,
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["magicLinks", "pending"],
      });
    },
  });

  if (isUsersLoading || isInvitesLoading) {
    return (
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-2">
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-4 w-64" />
          </div>
          <Skeleton className="h-4 w-24" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex flex-col border bg-card">
              <div className="flex items-center justify-between p-4 border-b">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-6 w-32" />
                  <Skeleton className="h-5 w-8" />
                </div>
                <Skeleton className="h-9 w-24" />
              </div>
              <div className="flex-1 p-4 space-y-3">
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <Skeleton className="h-4 w-32" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const handleRevoke = async (inviteId: string) => {
    try {
      await revoke.mutateAsync(inviteId);
      toast.success("Invitation supprimée");
    } catch (error) {
      toast.error("Erreur lors de la suppression");
    }
  };

  const handleCopyLink = (link: string) => {
    navigator.clipboard.writeText(link);
    toast.success("Lien copié dans le presse-papiers");
  };

  const getEmployeesByRole = (role: string) => {
    return users.filter((u) => u.role === role);
  };

  const getPendingByRole = (role: string) => {
    return pendingInvites.filter((invite) => invite.role === role);
  };

  const totalEmployees = users.length + pendingInvites.length;

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Employés</h1>
          <p className="text-sm text-muted-foreground">
            Gérez les membres de votre équipe et leurs permissions.
          </p>
        </div>
        <div className="text-sm text-muted-foreground">
          {totalEmployees} employé{totalEmployees !== 1 ? "s" : ""}
          {pendingInvites.length > 0 &&
            ` (${pendingInvites.length} en attente)`}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {roleOrder.map((role) => {
          const employees = getEmployeesByRole(role);
          const pending = getPendingByRole(role);
          const allItems = [...employees, ...pending];

          return (
            <div key={role} className="flex flex-col border bg-card">
              <div className="flex items-center justify-between p-4 border-b">
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-semibold">{roleLabels[role]}</h2>
                  <Badge variant="secondary">{allItems.length}</Badge>
                </div>
                <PermissionGuard
                  resource="employees"
                  action="write"
                  scope="global"
                >
                  <Button
                    size="sm"
                    onClick={() =>
                      setFormState({ open: true, role, inviteId: null })
                    }
                  >
                    <PlusIcon className="w-4 h-4 mr-2" />
                    Ajouter
                  </Button>
                </PermissionGuard>
              </div>

              <div className="flex-1 p-4 space-y-3">
                {allItems.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <p className="text-sm text-muted-foreground">
                      Aucun {roleLabels[role].toLowerCase()}
                    </p>
                  </div>
                ) : (
                  allItems.map((item, idx) => {
                    const isPending = !("name" in item) && "expiresAt" in item;

                    if (isPending) {
                      const invite = item as (typeof pendingInvites)[0];
                      const link = `${window.location.origin}/magic-link?magicLinkId=${invite._id}`;
                      const pendingNumber = idx - employees.length + 1;

                      return (
                        <div
                          key={invite._id}
                          className="bg-secondary/30 p-3 border"
                        >
                          <div className="flex items-center justify-between gap-3 mb-2">
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="flex items-center gap-2">
                                <div className="flex-shrink-0 w-8 h-8 bg-secondary flex items-center justify-center border">
                                  <span className="text-sm font-medium text-black dark:text-white">
                                    #{pendingNumber}
                                  </span>
                                </div>
                                <span className="text-sm font-medium uppercase text-black dark:text-white">
                                  INVITATION
                                </span>
                              </div>
                              <div className="min-w-0">
                                {invite.email && (
                                  <p className="font-medium truncate text-sm">
                                    {invite.email}
                                  </p>
                                )}
                              </div>
                            </div>
                            <Badge
                              variant="outline"
                              className="text-xs bg-yellow-100 text-yellow-800 border-yellow-300 font-medium flex-shrink-0"
                            >
                              En attente
                            </Badge>
                          </div>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 w-7 p-0"
                              onClick={() => handleCopyLink(link)}
                              title="Copier le lien"
                            >
                              <CopyIcon className="w-3.5 h-3.5" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 w-7 p-0"
                              onClick={() => setShowQR(link)}
                              title="Voir QR"
                            >
                              <QrCode className="w-3.5 h-3.5" />
                            </Button>
                            <PermissionGuard
                              resource="employees"
                              action="write"
                              scope="global"
                            >
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-7 w-7 p-0"
                                onClick={() => {
                                  setFormState({
                                    open: true,
                                    role: invite.role as Role,
                                    inviteId: invite._id,
                                  });
                                }}
                                title="Permissions"
                              >
                                <Settings className="w-3.5 h-3.5" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-7 w-7 p-0 border-red-600 text-red-600 hover:text-red-700 hover:bg-red-50"
                                onClick={() => handleRevoke(invite._id)}
                                title="Supprimer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            </PermissionGuard>
                          </div>
                        </div>
                      );
                    } else {
                      const user = item as (typeof users)[0];
                      const permSummary = user.permissions?.some(
                        (p) => p.resource === "*" && p.action === "*",
                      )
                        ? "Tous les accès"
                        : user.permissions
                            ?.map((p) => {
                              const resource =
                                p.resource === "*" ? "touts" : p.resource;
                              const action =
                                p.action === "*" ? "touts" : p.action;
                              return `${resource}: ${action}`;
                            })
                            .join(", ") || "Aucune";

                      return (
                        <div key={user._id} className="bg-card p-3 border">
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{user.name}</p>
                            {user.phoneNumber && (
                              <p className="text-sm text-muted-foreground truncate">
                                {user.phoneNumber}
                              </p>
                            )}
                            {user.email && !user.phoneNumber && (
                              <p className="text-sm text-muted-foreground truncate">
                                {user.email}
                              </p>
                            )}
                            <p className="text-sm text-muted-foreground mt-1">
                              {permSummary}
                            </p>
                          </div>
                        </div>
                      );
                    }
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>

      <EmployeeForm
        open={formState.open}
        onOpenChange={(open) => setFormState({ ...formState, open })}
        defaultRole={formState.role}
        inviteId={formState.inviteId}
      />

      <Dialog open={!!showQR} onOpenChange={(o) => !o && setShowQR(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Scanner le QR Code</DialogTitle>
          </DialogHeader>
          <div className="flex justify-center p-4">
            {showQR && <QRCode value={showQR} size={280} />}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
