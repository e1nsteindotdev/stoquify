import { Outlet, createFileRoute, useMatches, Link } from "@tanstack/react-router";
import { PanelLeft } from "lucide-react";
import { AppSidebar } from "@/components/sidebar/app-sidebar";
import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import React from "react";

export const Route = createFileRoute("/_dashboard")({
  component: PathlessLayoutComponent,
});

const getPathLabel = (path: string) => {
  const labels: Record<string, string> = {
    produits: "Produits",
    create: "Nouveau produit",
    commandes: "Commandes",
    clients: "Clients",
    parametres: "Paramètres",
    pos: "POS",
    "": "Analytique",
  };
  return labels[path] || path;
};

function PathlessLayoutComponent() {
  const matches = useMatches();
  const breadcrumbs = matches
    .filter((match) => match.routeId !== "__root__" && match.routeId !== "/_dashboard")
    .map((match) => {
      const pathSegments = match.pathname.split("/").filter(Boolean);
      const lastSegment = pathSegments[pathSegments.length - 1] || "";
      const label = getPathLabel(lastSegment);

      // Handle $slug or IDs
      if (lastSegment.startsWith("p_") || (lastSegment.length > 20 && !label)) {
        return { label: "Détails", href: match.pathname };
      }

      return { label, href: match.pathname };
    });

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex py-4 px-6 shrink-0 items-center gap-2">
          <SidebarTrigger 
            className="h-9 w-auto px-3 gap-2 bg-gray-100 border border-gray-300 hover:bg-gray-200 shadow-sm"
          >
            <PanelLeft className="size-4" />
            <span className="text-sm font-medium">Menu</span>
          </SidebarTrigger>
          <div className="flex items-center gap-2 px-3">
            <Breadcrumb>
              <BreadcrumbList>
                {breadcrumbs.map((bc, index) => (
                  <React.Fragment key={bc.href}>
                    <BreadcrumbItem className={index === 0 ? "hidden md:block" : ""}>
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
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0 bg-[#EEEFEF]">
          <Outlet />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
