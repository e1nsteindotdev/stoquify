import { Outlet, createRootRoute } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { ConvexReactClient, useConvexAuth } from "convex/react";
import { ConvexAuthProvider } from "@convex-dev/auth/react";
import { LoginForm } from "@/components/forms/auth/login-form";
import "@/App.css";

const CONVEX_URL = (import.meta as any).env.VITE_CONVEX_URL!;
if (!CONVEX_URL) {
  console.error("missing envar VITE_CONVEX_URL");
}
const convex = new ConvexReactClient(CONVEX_URL);

export const Route = createRootRoute({
  component: () => {
    return (
      <>
        <ThemeProvider>
          <ConvexAuthProvider client={convex}>
            <AuthWrapper>
              <Outlet />
            </AuthWrapper>
            <TanStackRouterDevtools />
          </ConvexAuthProvider>
        </ThemeProvider>
      </>
    );
  },
});

function AuthWrapper({ children }) {
  const { isAuthenticated, isLoading } = useConvexAuth();
  if (isLoading) {
    return <h1>Loading... </h1>;
  }
  if (isAuthenticated) return <>{children}</>;
  else return <LoginForm />;
}
