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
  IconInnerShadowTop,
  IconListDetails,
  IconReport,
  IconSearch,
  IconSettings,
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

// This is sample data.
const data = {
  user: {
    name: "shadcn",
    email: "m@example.com",
    avatar: "/avatars/shadcn.jpg",
  },
  navMain: [
    {
      title: "Tableau de bord",
      url: "#",
      icon: IconDashboard,
    },
    {
      title: "Cycle de vie",
      url: "#",
      icon: IconListDetails,
    },
    {
      title: "Analytique",
      url: "#",
      icon: IconChartBar,
    },
    {
      title: "Projets",
      url: "#",
      icon: IconFolder,
    },
    {
      title: "Équipe",
      url: "#",
      icon: IconUsers,
    },
  ],
  navClouds: [
    {
      title: "Capture",
      icon: IconCamera,
      isActive: true,
      url: "#",
      items: [
        {
          title: "Propositions actives",
          url: "#",
        },
        {
          title: "Archivé",
          url: "#",
        },
      ],
    },
    {
      title: "Proposition",
      icon: IconFileDescription,
      url: "#",
      items: [
        {
          title: "Propositions actives",
          url: "#",
        },
        {
          title: "Archivé",
          url: "#",
        },
      ],
    },
    {
      title: "Prompts",
      icon: IconFileAi,
      url: "#",
      items: [
        {
          title: "Propositions actives",
          url: "#",
        },
        {
          title: "Archivé",
          url: "#",
        },
      ],
    },
  ],
  navSecondary: [
    {
      title: "Paramètres",
      url: "#",
      icon: IconSettings,
    },
    // {
    //   title: "Aide",
    //   url: "#",
    //   icon: IconHelp,
    // },
    // {
    //   title: "Recherche",
    //   url: "#",
    //   icon: IconSearch,
    // },
  ],
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
            <SidebarMenuButton asChild className="data-[slot=sidebar-menu-button]:!p-1.5" >
              <a href="#">
                <IconInnerShadowTop className="!size-5" />
                <span className="text-base font-semibold">Stoquify</span>
              </a>
            </SidebarMenuButton>
            <SidebarTrigger />
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain />
        {data.documents.length > 0 && <NavDocuments items={data.documents} />}
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser avatar={data.user.avatar} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
