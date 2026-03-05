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

export const Route = createFileRoute("/_dashboard")({
  loader: async () => { },
  component: PathlessLayoutComponent,
});

function PathlessLayoutComponent() {
  const { location } = useRouterState();
  const { isLoading } = useInitApp();
  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0 bg-[#EEEFEF]">
          <div className="flex flex-1 flex-col">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: .5 }}
              className="flex flex-1 flex-col"
            >
              <Outlet />
            </motion.div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
