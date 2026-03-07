import {
  IconChartBar,
  IconPackage,
  IconShoppingBag,
  IconUsers,
  IconReceipt2,
  IconSettings,
  type Icon,
} from "@tabler/icons-react";
import { PermissionAction } from "@/lib/permissions";

export type NavPermission = {
  resource: string;
  action: PermissionAction;
  scope: "store" | "global";
};

export type NavItem = {
  title: string;
  url: string;
  icon: Icon;
  requiredPermission?: NavPermission;
};

export const mainNavItems: NavItem[] = [
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
      resource: "sales",
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

export const secondaryNavItems: NavItem[] = [
  {
    title: "POS",
    url: "/pos",
    icon: IconShoppingBag,
  },
  {
    title: "Paramètres",
    url: "/parametres",
    icon: IconSettings,
  },
];
