import { TypeUser } from "api/types";

export type PermissionAction =
  | "read"
  | "write"
  | "create"
  | "update"
  | "delete"
  | "*";

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
