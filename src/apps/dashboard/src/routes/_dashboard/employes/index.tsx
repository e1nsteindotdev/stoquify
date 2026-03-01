import { createFileRoute, redirect } from "@tanstack/react-router";
import { useAppStore } from "@/lib/store";
import { hasGlobalPermission } from "@/lib/permissions";
import { api } from "api/convex";
import { useQuery, useMutation } from "convex/react";
import { Badge } from "@/components/ui/badge";
import { ClipLoader } from "react-spinners";
import { Button } from "@/components/ui/button";
import { EmployeeForm } from "@/components/forms/employee/employee-form";
import { useState } from "react";
import { PlusIcon, CopyIcon, QrCode, Trash2 } from "lucide-react";
import { toast } from "sonner";
import QRCode from "react-qr-code";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export const Route = createFileRoute("/_dashboard/employes/")({
  loader: () => {
    const user = useAppStore.getState().user;

    if (!hasGlobalPermission(user, "employees", "read")) {
      throw redirect({ to: "/" });
    }
  },
  component: Page,
});

function Page() {
  const [showForm, setShowForm] = useState(false);
  const [showQR, setShowQR] = useState<string | null>(null);
  const users = useQuery(api.users.getOrganizationUsers);
  const pendingInvites = useQuery(api.magicLinks.getPendingByOrganization);
  const revoke = useMutation(api.magicLinks.revoke);

  if (!users || pendingInvites === undefined) {
    return (
      <div className="p-4 pt-0 w-full h-full flex items-center justify-center">
        <ClipLoader />
      </div>
    );
  }

  const groupedUsers = {
    founder: users.filter((u) => u.role === "founder"),
    admin: users.filter((u) => u.role === "admin"),
    staff: users.filter((u) => u.role === "staff"),
  };

  const roleLabels: Record<string, string> = {
    founder: "Fondateur",
    admin: "Administrateur",
    staff: "Staff",
  };

  const handleCopyLink = (link: string) => {
    navigator.clipboard.writeText(link);
    toast.success("Lien copié dans le presse-papiers");
  };

  const handleRevoke = async (inviteId: string) => {
    try {
      await revoke({ invitationId: inviteId as any });
      toast.success("Invitation supprimée");
    } catch (error) {
      toast.error("Erreur lors de la suppression");
    }
  };

  return (
    <div className="p-4 pt-0 w-full h-full flex flex-col gap-6 overflow-auto">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Employés</h1>
          <p className="text-sm text-muted-foreground">
            Gérez les membres de votre équipe et leurs permissions.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={() => setShowForm(true)}>
            <PlusIcon className="w-4 h-4 mr-2" />
            Ajouter un employé
          </Button>
        </div>
      </div>

      {pendingInvites.length > 0 && (
        <div className="flex flex-col gap-3">
          <h2 className="text-lg font-semibold text-gray-700">
            Invitations en attente ({pendingInvites.length})
          </h2>
          <div className="grid gap-3">
            {pendingInvites.map((invite) => {
              const link = `${window.location.origin}/magic-link?magicLinkId=${invite._id}`;
              const permSummary = invite.permissions?.some(
                (p) => p.resource === "*" && p.action === "*",
              )
                ? "Tous les accès"
                : invite.permissions
                    ?.map((p) => `${p.resource}: ${p.action}`)
                    .join(", ") || "Aucune";

              return (
                <div
                  key={invite._id}
                  className="bg-white rounded-lg border p-4 flex flex-col sm:flex-row sm:items-center gap-4"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">
                      {invite.email || "Sans email"}
                    </p>
                    <p className="text-sm text-gray-500 truncate">
                      Rôle: {roleLabels[invite.role]}
                    </p>
                    <p className="text-sm text-gray-500 truncate">
                      Permissions: {permSummary}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary">En attente</Badge>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCopyLink(link)}
                    >
                      <CopyIcon className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowQR(link)}
                    >
                      <QrCode className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRevoke(invite._id)}
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {Object.entries(groupedUsers).map(([role, usersInRole]) => {
        if (usersInRole.length === 0) return null;

        return (
          <div key={role} className="flex flex-col gap-3">
            <h2 className="text-lg font-semibold text-gray-700">
              {roleLabels[role]}s ({usersInRole.length})
            </h2>
            <div className="grid gap-3">
              {usersInRole.map((user) => (
                <div
                  key={user._id}
                  className="bg-white rounded-lg border p-4 flex flex-col sm:flex-row sm:items-center gap-4"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">
                      {user.name}
                    </p>
                    {user.email && (
                      <p className="text-sm text-gray-500 truncate">
                        {user.email}
                      </p>
                    )}
                    {user.phoneNumber && (
                      <p className="text-sm text-gray-500 truncate">
                        {user.phoneNumber}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary" className="capitalize">
                      {roleLabels[role]}
                    </Badge>
                    {user.permissions?.map((perm, idx) => (
                      <Badge key={idx} variant="outline" className="text-xs">
                        {perm.resource}: {perm.action}
                      </Badge>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}

      <EmployeeForm open={showForm} onOpenChange={setShowForm} />

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
