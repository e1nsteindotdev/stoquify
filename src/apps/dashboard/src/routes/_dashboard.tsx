import {
  Outlet,
  createFileRoute,
} from "@tanstack/react-router";
import { AppSidebar } from "@/components/sidebar/app-sidebar";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { useInitApp } from "@/hooks/use-init-app";
import { LoadingScreen } from "@/components/ui/loading-screen";
import { MobileMenu } from "@/components/sidebar/mobile-menu";
import { RefreshButton } from "@/components/sidebar/refresh-button";
import { convex } from "@/lib/convex-client";
import { api } from "api/convex";
import { useAppStore } from "@/lib/store";
import { idbGet } from "@/lib/idb";
import { queryClient } from "@/lib/ts-query-client";

export const Route = createFileRoute("/_dashboard")({
  loader: async () => {
    // init user
    try {
      if (!useAppStore.getState().user) {
        const user = await convex.query(api.users.me);
        useAppStore.getState().setUser(user)
      }
    } catch (e) {
      console.log("can't signin")
    }

    // init stores
    const stores = await idbGet("stores")
    if (stores.length > 0) useAppStore.getState().setStores(stores)
    else {
      const stores = await convex.query(api.stores.list, {});
      useAppStore.getState().setStores(stores)
      const storeId = useAppStore.getState().selectedStore
      queryClient.setQueryData(["stores", storeId], stores);
    }
  },
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
