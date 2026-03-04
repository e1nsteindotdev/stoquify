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
  IconReceipt2,
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
  {
    title: "Analytique",
    url: "/",
    icon: IconChartBar,
    requiredPermission: {
      resource: "analytics",
      action: "read",
      scope: "store",
    },
  },
  {
    title: "Produits",
    url: "/produits",
    icon: IconPackage,
    requiredPermission: {
      resource: "products",
      action: "read",
      scope: "store",
    },
  },
  {
    title: "Commandes",
    url: "/commandes",
    icon: IconShoppingBag,
    requiredPermission: {
      resource: "orders",
      action: "read",
      scope: "store",
    },
  },
  {
    title: "Clients",
    url: "/clients",
    icon: IconUsers,
    requiredPermission: {
      resource: "customers",
      action: "read",
      scope: "store",
    },
  },
  {
    title: "Dépenses",
    url: "/depenses",
    icon: IconReceipt2,
    requiredPermission: {
      resource: "expenses",
      action: "read",
      scope: "store",
    },
  },
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
