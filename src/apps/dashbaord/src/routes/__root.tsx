import { Outlet, createRootRoute } from "@tanstack/react-router";
import { QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { Authenticated, Unauthenticated, AuthLoading } from "convex/react";

import { Toaster } from "@/components/ui/sonner"
import { ConvexAuthProvider } from "@convex-dev/auth/react";
import "@/App.css";
import { AuthForm } from "@/components/forms/auth/auth-form";
import { convex, queryClient } from "@/lib/convex-query";

export const Route = createRootRoute({
  component: () => {
    return (
      <>
        <ThemeProvider>
          <ConvexAuthProvider client={convex}>
            <QueryClientProvider client={queryClient}>
              <AuthWrapper>
                <Outlet />
                <Toaster />
              </AuthWrapper>
            </QueryClientProvider>
          </ConvexAuthProvider>
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

import { ClipLoader } from "react-spinners";

function LoadingScreen() {
  return (
    <div className="h-screen center">
       <ClipLoader color="#000" size={50} />
    </div>
  )
}
