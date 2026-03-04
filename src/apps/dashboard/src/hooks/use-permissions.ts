import { useAppStore } from "@/lib/store";
import {
  hasStorePermission,
  hasGlobalPermission,
  PermissionAction,
} from "@/lib/permissions";

export function usePermissions() {
  const user = useAppStore((state) => state.user);
  const selectedStore = useAppStore((state) => state.selectedStore);

  const hasPermission = (
    resource: string,
    action: PermissionAction,
    scope: "store" | "global" = "store",
  ): boolean => {
    if (scope === "global") {
      return hasGlobalPermission(user, resource, action);
    }
    return hasStorePermission(user, selectedStore?._id, resource, action);
  };

  return { hasPermission };
}
