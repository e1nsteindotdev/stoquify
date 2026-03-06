import {
  Outlet,
  createFileRoute,
  useRouterState,
} from "@tanstack/react-router";
import { AppSidebar } from "@/components/sidebar/app-sidebar";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { useInitApp } from "@/hooks/use-init-app";
import { LoadingScreen } from "@/components/ui/loading-screen";
import { motion } from "motion/react";
import { MobileMenu } from "@/components/sidebar/mobile-menu";
import { RefreshButton } from "@/components/sidebar/refresh-button";

export const Route = createFileRoute("/_dashboard")({
  loader: async () => { },
  component: PathlessLayoutComponent,
});

function PathlessLayoutComponent() {
  const { isLoading } = useInitApp();
  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0 bg-[#EEEFEF]">
          <div className="flex flex-1 flex-col relative">
            <Outlet />
            <MobileMenu />
            <RefreshButton />
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
