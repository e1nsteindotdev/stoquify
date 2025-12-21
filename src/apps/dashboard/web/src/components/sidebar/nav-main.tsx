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

export function NavMain() {
  const { location } = useRouterState();
  const isActive = (path: string) => location.pathname === path;

  const items = [
    { title: "Produits", url: "/produits", icon: IconPackage },
    { title: "Commandes", url: "/commandes", icon: IconShoppingBag },
    { title: "Clients", url: "/clients", icon: IconUsers },
    { title: "Paramètres", url: "/parametres", icon: IconSettings },
  ];

  return (
    <SidebarGroup>
      <SidebarGroupContent className="flex flex-col gap-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              tooltip="Analytics"
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
          {items.map((item) => (
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
