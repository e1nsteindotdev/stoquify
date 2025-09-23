import { Outlet, createRootRoute, redirect } from "@tanstack/react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { ConvexReactClient } from "convex/react";
import { Authenticated, Unauthenticated, AuthLoading } from "convex/react";

import { ConvexAuthProvider } from "@convex-dev/auth/react";
import "@/App.css";
import { AuthForm } from "@/components/forms/auth/auth-form";


const CONVEX_URL = (import.meta as any).env.VITE_CONVEX_URL!;
console.log("----------------- CONVEX", CONVEX_URL)
if (!CONVEX_URL) {
  throw new Error("convex url doesn't exist in env")
}

const queryClient = new QueryClient();
const convex = new ConvexReactClient(CONVEX_URL);

export const Route = createRootRoute({
  component: () => {
    return (
      <>
        <ThemeProvider>
          <QueryClientProvider client={queryClient}>
            <ConvexAuthProvider client={convex}>
              <AuthWrapper>
                <Outlet />
              </AuthWrapper>
            </ConvexAuthProvider>
          </QueryClientProvider>
          {/* <TanStackRouterDevtools /> */}
        </ThemeProvider >
      </>
    );
  },
});

function AuthWrapper({ children }) {
  return (
    <>
      <AuthLoading> <LoadingScreen /> </AuthLoading>
      <Unauthenticated>
        <AuthForm />
      </Unauthenticated>
      <Authenticated>{children}</Authenticated>
    </>
  );
}

function LoadingScreen() {
  return (
    <div className="h-screen center">
      <p className="italic font-bold text-4xl">Loading....</p>
    </div>

  )
}
