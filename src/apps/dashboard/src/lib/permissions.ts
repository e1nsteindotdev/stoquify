import { TypeUser } from "api/types";

export type PermissionAction = "read" | "write" | "*";

export const availableResources = [
  { key: "products", label: "Produits", description: "Gérer les produits" },
  {
    key: "sales",
    label: "Commandes",
    description: "Voir et gérer les commandes",
  },
  { key: "customers", label: "Clients", description: "Voir les clients" },
  { key: "employees", label: "Employés", description: "Gérer les employés" },
  {
    key: "analytics",
    label: "Analytiques",
    description: "Voir les statistiques",
  },
  {
    key: "settings",
    label: "Paramètres",
    description: "Modifier les paramètres",
  },
  {
    key: "categories",
    label: "Catégories",
    description: "Gérer les catégories",
  },
  {
    key: "collections",
    label: "Collections",
    description: "Gérer les collections",
  },
  { key: "expenses", label: "Dépenses", description: "Gérer les dépenses" },
];

export function hasStorePermission(
  user: TypeUser | null,
  selectedStoreId: string | undefined,
  resource: string,
  action: PermissionAction,
): boolean {
  if (!user?.permissions || !selectedStoreId) return false;

  return user.permissions.some(
    (p) =>
      p.storeId === selectedStoreId &&
      (p.resource === "*" || p.resource === resource) &&
      (p.action === "*" || p.action === action),
  );
}

export function hasGlobalPermission(
  user: TypeUser | null,
  resource: string,
  action: PermissionAction,
): boolean {
  if (!user?.permissions) return false;

  return user.permissions.some(
    (p) =>
      (p.resource === "*" || p.resource === resource) &&
      (p.action === "*" || p.action === action),
  );
}
