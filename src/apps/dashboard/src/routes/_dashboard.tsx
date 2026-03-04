import { Outlet, createFileRoute } from "@tanstack/react-router";
import { AppSidebar } from "@/components/sidebar/app-sidebar";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { useInitApp } from "@/hooks/use-init-app";

export const Route = createFileRoute("/_dashboard")({
  loader: async () => {},
  component: PathlessLayoutComponent,
});

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

  const { isLoading } = useInitApp();
  if (isLoading) {
    return <p>loading</p>;
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
