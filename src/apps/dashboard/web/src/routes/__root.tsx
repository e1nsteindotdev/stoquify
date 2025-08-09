import { Outlet, createRootRoute } from "@tanstack/react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { ConvexReactClient } from "convex/react";
import { Authenticated, Unauthenticated, AuthLoading } from "convex/react";
import "@/App.css";

import { AuthKitProvider, useAuth } from "@workos-inc/authkit-react";
import { ConvexProviderWithAuthKit } from "@convex-dev/workos";

const CONVEX_URL = (import.meta as any).env.VITE_CONVEX_URL!;
if (!CONVEX_URL) {
  throw new Error("convex url doesn't exist in env")
}
const convex = new ConvexReactClient(CONVEX_URL);
const queryClient = new QueryClient();

export const Route = createRootRoute({
  component: () => {
    return (
      <>
        <ThemeProvider>

          <QueryClientProvider client={queryClient}>
            <AuthKitProvider clientId={import.meta.env.VITE_WORKOS_CLIENT_ID} redirectUri={import.meta.env.VITE_WORKOS_REDIRECT_URI} >
              <ConvexProviderWithAuthKit client={convex} useAuth={useAuth}>
                <AuthWrapper>
                  <Outlet />
                </AuthWrapper>
              </ConvexProviderWithAuthKit>
            </AuthKitProvider>
          </QueryClientProvider>

          {/* 
          <TanStackRouterDevtools />
          */}
        </ThemeProvider>
      </>
    );
  },
});

function AuthWrapper({ children }) {
  const { user, signIn, signOut } = useAuth();
  return (
    <>
      <AuthLoading> <LoadingScreen /> </AuthLoading>
      <Unauthenticated>
        <div className="h-screen flex items-center justify-center">
          <button onClick={() => (user ? signOut() : void signIn())}>{user ? 'Sign out' : 'Sign in'}</button>
        </div>
      </Unauthenticated>
      <Authenticated>{children}</Authenticated>
    </>
  );
}

function LoadingScreen() {
  return (
    <div className="h-screen center">
      <p className="italic font-bold text-4xl">Loading BITCH....</p>
    </div>

  )
}
