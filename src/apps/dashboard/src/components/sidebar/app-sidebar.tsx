import * as React from "react";

import {
  IconCamera,
  IconChartBar,
  IconDashboard,
  IconDatabase,
  IconFileAi,
  IconFileDescription,
  IconFileWord,
  IconFolder,
  IconHelp,
  IconListDetails,
  IconReport,
  IconSearch,
  IconSettings,
  IconShoppingBag,
  IconUsers,
} from "@tabler/icons-react";

import { NavMain } from "@/components/sidebar/nav-main";
import { NavUser } from "@/components/sidebar/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { NavSecondary } from "./nav-secondary";
import { NavDocuments } from "./nav-documents";
import { secondaryNavItems } from "./nav-data";

// This is sample data.
const data = {
  user: {
    name: "shadcn",
    email: "m@example.com",
    avatar: "/avatars/shadcn.jpg",
  },
  documents: [
    // {
    //   name: "Bibliothèque de données",
    //   url: "#",
    //   icon: IconDatabase,
    // },
    // {
    //   name: "Rapports",
    //   url: "#",
    //   icon: IconReport,
    // },
    // {
    //   name: "Assistant Word",
    //   url: "#",
    //   icon: IconFileWord,
    // },
  ],
};
export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem className="flex items-center">
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5"
            >
              <a href="#">
                <img
                  src="/full-logo.png"
                  alt="Stoquify Logo"
                  className="h-6 w-auto object-contain"
                />
              </a>
            </SidebarMenuButton>
            <SidebarTrigger />
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain />
        {data.documents.length > 0 && <NavDocuments items={data.documents} />}
        <NavSecondary items={secondaryNavItems} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser avatar={data.user.avatar} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
