import { Outlet, createRootRoute, useRouter } from "@tanstack/react-router";
import { useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { ConvexProvider, ConvexReactClient, useConvexAuth } from "convex/react";
import { ConvexAuthProvider } from "@convex-dev/auth/react";
import { LoginForm } from "@/components/forms/auth/login-form";
import "@/App.css";

const CONVEX_URL = (import.meta as any).env.VITE_CONVEX_URL!;
if (!CONVEX_URL) {
  console.error("missing envar VITE_CONVEX_URL");
}
const convex = new ConvexReactClient(CONVEX_URL, { verbose: true });
const queryClient = new QueryClient();

export const Route = createRootRoute({
  component: () => {
    return (
      <>
        <ThemeProvider>
          <QueryClientProvider client={queryClient}>
            <ConvexProvider client={convex}>
              <ConvexAuthProvider client={convex}>
                <AuthWrapper>
                  <Outlet />
                </AuthWrapper>
                <TanStackRouterDevtools />
              </ConvexAuthProvider>
            </ConvexProvider>
          </QueryClientProvider>
        </ThemeProvider>
      </>
    );
  },
});

function AuthWrapper({ children }) {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const router = useRouter();
  const pathname = router.state.location.pathname;

  useEffect(() => {
    if (isLoading) return;
    if (isAuthenticated) {
      if (pathname === "/sign-in") {
        router.navigate({ to: "/", replace: true });
      }
    } else {
      if (pathname !== "/sign-in") {
        router.navigate({ to: "/sign-in", replace: true });
      }
    }
  }, [isAuthenticated, isLoading, pathname, router]);

  if (isLoading) {
    return <h1>Loading... </h1>;
  }

  return <>{children}</>;
}
