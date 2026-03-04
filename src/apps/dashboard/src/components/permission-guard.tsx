import React from "react";
import { usePermissions } from "@/hooks/use-permissions";
import { PermissionAction } from "@/lib/permissions";

interface PermissionGuardProps {
  resource: string;
  action: PermissionAction;
  scope?: "store" | "global";
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function PermissionGuard({
  resource,
  action,
  scope = "store",
  children,
  fallback = null,
}: PermissionGuardProps) {
  const { hasPermission } = usePermissions();

  if (hasPermission(resource, action, scope)) {
    return <>{children}</>;
  }

  return <>{fallback}</>;
}
