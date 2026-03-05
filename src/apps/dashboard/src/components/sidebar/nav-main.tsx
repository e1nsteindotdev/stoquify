import { Link, useRouterState } from "@tanstack/react-router";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { useAppStore } from "@/lib/store";
import { hasStorePermission, hasGlobalPermission } from "@/lib/permissions";
import { mainNavItems, NavItem } from "./nav-data";

export function NavMain() {
  const { location } = useRouterState();
  const user = useAppStore((state) => state.user);
  const selectedStore = useAppStore((state) => state.selectedStore);

  const isActive = (path: string) => {
    if (path === "/") {
      return location.pathname === "/";
    }
    return location.pathname.startsWith(path);
  };

  const hasAccess = (item: NavItem): boolean => {
    if (!item.requiredPermission) return true;

    if (item.requiredPermission.scope === "global") {
      return hasGlobalPermission(
        user,
        item.requiredPermission.resource,
        item.requiredPermission.action,
      );
    }
    return hasStorePermission(
      user,
      selectedStore?._id,
      item.requiredPermission.resource,
      item.requiredPermission.action,
    );
  };

  const visibleItems = mainNavItems.filter(hasAccess);

  return (
    <SidebarGroup>
      <SidebarGroupContent className="flex flex-col gap-2">
        <SidebarMenu>
          {visibleItems.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton
                asChild
                tooltip={item.title}
                isActive={isActive(item.url)}
              >
                <Link to={item.url}>
                  <item.icon />
                  <span>{item.title}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
