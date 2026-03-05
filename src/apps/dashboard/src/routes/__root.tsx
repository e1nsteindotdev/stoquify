import {
  Outlet,
  createRootRoute,
  useRouterState,
} from "@tanstack/react-router";
import { QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { queryClient } from "@/lib/ts-query-client";
import { Authenticated, AuthLoading, Unauthenticated } from "convex/react";
import { AuthForm } from "@/components/forms/auth/auth-form";
import { LoadingScreen } from "@/components/ui/loading-screen";

import "@/App.css";

// Public routes that don't require authentication
const PUBLIC_ROUTES = ["/mobile-signin", "/magic-link"];

export const Route = createRootRoute({
  component: () => {
    const routerState = useRouterState();
    // Normalize path to remove double slashes
    const currentPath = routerState.location.pathname.replace(/\/+/g, "/");
    const isPublicRoute = PUBLIC_ROUTES.some((route) =>
      currentPath.startsWith(route),
    );

    return (
      <>
        <ThemeProvider>
          <QueryClientProvider client={queryClient}>
            {isPublicRoute ? (
              // Public routes: render directly without auth checks
              <Outlet />
            ) : (
              <>
                <AuthLoading>
                  <LoadingScreen />
                </AuthLoading>
                <Unauthenticated>
                  <AuthForm />
                </Unauthenticated>
                <Authenticated>
                  <Outlet />
                </Authenticated>
              </>
            )}
            <Toaster />
          </QueryClientProvider>
        </ThemeProvider>
      </>
    );
  },
});
