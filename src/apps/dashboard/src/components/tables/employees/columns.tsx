import { type ColumnDef } from "@tanstack/react-table";
import { DataTableColumnHeader } from "../data-table-column-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CopyIcon, QrCode, Trash2 } from "lucide-react";
import { toast } from "sonner";

export type EmployeeRow = {
  _id: string;
  name: string;
  email?: string;
  phoneNumber?: string;
  role: string;
  roleLabel: string;
  status: "active" | "pending";
  permissions?: Array<{ resource: string; action: string }>;
  inviteLink?: string;
  onRevoke?: () => void;
};

const roleLabels: Record<string, string> = {
  founder: "Patron",
  admin: "Administrateur",
  staff: "Staff",
};

const formatPermission = (resource: string, action: string) => {
  const formattedResource = resource === "*" ? "Tout" : resource;
  const formattedAction = action === "*" ? "Tout" : action;
  return `${formattedResource}: ${formattedAction}`;
};

export const columns: ColumnDef<EmployeeRow>[] = [
  {
    accessorKey: "name",
    enableSorting: false,
    header: ({ column }) => (
      <DataTableColumnHeader
        column={column}
        title="Nom"
        explanation="Nom complet et coordonnées de l'employé"
      />
    ),
    cell: ({ row }) => {
      const name = row.getValue("name") as string;
      const email = row.original.email;
      const phoneNumber = row.original.phoneNumber;
      return (
        <div className="flex flex-col">
          <span className="font-medium">{name || "Sans nom"}</span>
          {email && (
            <span className="text-sm text-muted-foreground">{email}</span>
          )}
          {phoneNumber && !email && (
            <span className="text-sm text-muted-foreground">{phoneNumber}</span>
          )}
        </div>
      );
    },
  },
  {
    accessorKey: "role",
    enableSorting: false,
    header: ({ column }) => (
      <DataTableColumnHeader
        column={column}
        title="Rôle"
        explanation="Niveau d'accès et responsabilités dans le système"
      />
    ),
    cell: ({ row }) => {
      const role = row.getValue("role") as string;
      const status = row.original.status;
      return (
        <div className="flex flex-col gap-1">
          <Badge variant="secondary">{roleLabels[role] || role}</Badge>
          {status === "pending" && <Badge variant="outline">En attente</Badge>}
        </div>
      );
    },
  },
  {
    accessorKey: "permissions",
    enableSorting: false,
    header: ({ column }) => (
      <DataTableColumnHeader
        column={column}
        title="Permissions"
        explanation="Actions spécifiques autorisées pour cet utilisateur"
      />
    ),
    cell: ({ row }) => {
      const permissions = row.original.permissions;
      const status = row.original.status;

      if (!permissions || permissions.length === 0) {
        return <span className="text-sm text-muted-foreground">Aucune</span>;
      }

      const hasAllAccess = permissions.some(
        (p) => p.resource === "*" && p.action === "*",
      );

      if (hasAllAccess) {
        return <Badge variant="outline">Tous les accès</Badge>;
      }

      return (
        <div className="flex flex-wrap gap-1 max-w-md">
          {permissions.map((perm, idx) => (
            <Badge key={idx} variant="outline" className="text-xs">
              {formatPermission(perm.resource, perm.action)}
            </Badge>
          ))}
        </div>
      );
    },
  },
  {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => {
      const status = row.original.status;
      const inviteLink = row.original.inviteLink;
      const onRevoke = row.original.onRevoke;

      if (status === "pending" && inviteLink) {
        return (
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                navigator.clipboard.writeText(inviteLink);
                toast.success("Lien copié dans le presse-papiers");
              }}
            >
              <CopyIcon className="w-4 h-4" />
            </Button>
            {onRevoke && (
              <Button variant="outline" size="sm" onClick={onRevoke}>
                <Trash2 className="w-4 h-4 text-red-500" />
              </Button>
            )}
          </div>
        );
      }

      return null;
    },
  },
];
