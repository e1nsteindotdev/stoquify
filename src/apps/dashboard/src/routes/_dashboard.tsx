import {
  Outlet,
  createFileRoute,
  useMatches,
  Link,
  useLocation,
} from "@tanstack/react-router";
import { AppSidebar } from "@/components/sidebar/app-sidebar";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import React, { useEffect } from "react";
import { idbGet, idbPut } from "@/lib/idb";
import { queryClient } from "@/lib/ts-query-client";
import { useAppStore } from "@/lib/store";
import { convex } from "@/lib/convex-client";
import { api } from "api/convex";
import { initializeCollections } from "@/database/initialize";
import { useConvexAuth, useQuery } from "convex/react";
import { useAuthActions } from "@convex-dev/auth/react";
import { useGetUser } from "@/hooks/useGetUser";

let initialized = false;

export const Route = createFileRoute("/_dashboard")({
  loader: async () => {
  },
  component: PathlessLayoutComponent,
});

const getPathLabel = (path: string) => {
  const labels: Record<string, string> = {
    produits: "Produits",
    create: "Nouveau produit",
    commandes: "Commandes",
    clients: "Clients",
    depenses: "Dépenses",
    parametres: "Paramètres",
    pos: "POS",
    "": "Analytique",
  };
  return labels[path] || path;
};

function PathlessLayoutComponent() {
  // console.log("_dsahboard rendered")
  // const { isLoading, isAuthenticated } = useConvexAuth()
  // const location = useLocation();
  // const matches = useMatches();
  // const breadcrumbs = matches
  //   .filter(
  //     (match) =>
  //       match.routeId !== "__root__" && match.routeId !== "/_dashboard",
  //   )
  //   .map((match) => {
  //     const pathSegments = match.pathname.split("/").filter(Boolean);
  //     const lastSegment = pathSegments[pathSegments.length - 1] || "";
  //     const label = getPathLabel(lastSegment);
  //
  //     // Handle $slug or IDs
  //     if (lastSegment.startsWith("p_") || (lastSegment.length > 20 && !label)) {
  //       return { label: "Détails", href: match.pathname };
  //     }
  //     return { label, href: match.pathname };
  //   });
  //
  //
  // useEffect(() => {
  //   async function init() {
  //     if (initialized) return;
  //     console.log("_dashboard useEffect");
  //     initialized = true;
  //     try {
  //       const [products, collections, user, stores] = await Promise.all([
  //         idbGet("products"),
  //         idbGet("collections"),
  //         idbGet("user"),
  //         idbGet("stores"),
  //       ]);
  //       console.log("loader run , ", user);
  //       if (stores?.length > 0) {
  //         const selectedStore = useAppStore.getState().selectedStore;
  //         useAppStore.getState().setStores(stores);
  //         if (!selectedStore) useAppStore.getState().setStore(stores[0]);
  //       } else {
  //         console.log("fetching stores from convex");
  //         const stores = await convex.query(api.stores.list);
  //         console.log("finished");
  //         useAppStore.getState().setStores(stores);
  //       }
  //       if (user) {
  //         useAppStore.getState().setUser(user);
  //       } else {
  //         console.log("fetching user from convex");
  //         const user = await convex.query(api.users.getUserData);
  //         idbPut("user", user);
  //         console.log("finished");
  //         useAppStore.getState().setUser(user);
  //       }
  //
  //       console.log("initializing queries");
  //       queryClient.setQueryData(["products"], products);
  //       queryClient.setQueryData(["collections"], collections);
  //       initializeCollections();
  //     } catch (e) {
  //       console.log("faild to preload products :", String(e));
  //     }
  //   }
  //   init()
  // }, [])
  // console.log("convex auth loading state :", isLoading, isAuthenticated)
  //
  // if (isLoading) return <p>convex auth is loading... </p>

  const { isPending } = useGetUser()
  if (isPending) {
    return <p>auth query is pending</p>
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        {/* <header className="flex py-4 px-6 shrink-0 items-center gap-2">
          <div className="flex items-center gap-2 px-3">
            <Breadcrumb>
              <BreadcrumbList>
                {breadcrumbs.map((bc, index) => (
                  <React.Fragment key={bc.href}>
                    <BreadcrumbItem
                      className={index === 0 ? "hidden md:block" : ""}
                    >
                      {index === breadcrumbs.length - 1 ? (
                        <BreadcrumbPage>{bc.label}</BreadcrumbPage>
                      ) : (
                        <BreadcrumbLink asChild>
                          <Link to={bc.href as any}>{bc.label}</Link>
                        </BreadcrumbLink>
                      )}
                    </BreadcrumbItem>
                    {index < breadcrumbs.length - 1 && (
                      <BreadcrumbSeparator className="hidden md:block" />
                    )}
                  </React.Fragment>
                ))}
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header> */}
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0 bg-[#EEEFEF]">
          <div className="flex flex-1 flex-col">
            <Outlet />
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
