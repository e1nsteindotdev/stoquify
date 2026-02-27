import { Link, useRouterState } from "@tanstack/react-router";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import {
  IconChartBar,
  IconPackage,
  IconShoppingBag,
  IconUsers,
  IconSettings,
} from "@tabler/icons-react";
import { useAppStore } from "@/lib/store";
import {
  hasStorePermission,
  hasGlobalPermission,
  PermissionAction,
} from "@/lib/permissions";

type NavPermission = {
  resource: string;
  action: PermissionAction;
  scope: "store" | "global";
};

type NavItem = {
  title: string;
  url: string;
  icon: React.ComponentType;
  requiredPermission?: NavPermission;
};

const navItems: NavItem[] = [
  { title: "POS", url: "/pos", icon: IconShoppingBag },
  { title: "Produits", url: "/produits", icon: IconPackage },
  { title: "Commandes", url: "/commandes", icon: IconShoppingBag },
  { title: "Clients", url: "/clients", icon: IconUsers },
  {
    title: "Employés",
    url: "/employes",
    icon: IconUsers,
    requiredPermission: {
      resource: "employees",
      action: "read",
      scope: "global",
    },
  },
  { title: "Paramètres", url: "/parametres", icon: IconSettings },
];

export function NavMain() {
  const { location } = useRouterState();
  const user = useAppStore((state) => state.user);
  const selectedStore = useAppStore((state) => state.selectedStore);

  const isActive = (path: string) => location.pathname === path;

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

  const visibleItems = navItems.filter(hasAccess);

  return (
    <SidebarGroup>
      <SidebarGroupContent className="flex flex-col gap-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              tooltip="Analytique"
              isActive={isActive("/")}
            >
              <Link to="/">
                <IconChartBar />
                <span>Analytique</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>

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
