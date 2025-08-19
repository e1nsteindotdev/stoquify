import { Outlet, createRootRoute, redirect } from "@tanstack/react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { ConvexReactClient, useConvexAuth } from "convex/react";
import { Authenticated, Unauthenticated, AuthLoading } from "convex/react";

import { ConvexAuthProvider, useAuthActions } from "@convex-dev/auth/react";
import "@/App.css";
import { AuthForm } from "@/components/forms/auth/auth-form";


const CONVEX_URL = (import.meta as any).env.VITE_CONVEX_URL!;
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
  const { signIn, signOut } = useAuthActions();
  const { isLoading, isAuthenticated } = useConvexAuth()
  return (
    <>
      <AuthLoading> <LoadingScreen /> </AuthLoading>
      <Unauthenticated>
        <AuthForm />
        {/* <div className="h-screen flex items-center justify-center"> */}
        {/*   <button onClick={() => (isAuthenticated ? signOut() : redirect({ to: "/sign-in" }))}> */}
        {/*     {isAuthenticated ? 'Sign out' : 'Sign in'} */}
        {/*   </button> */}
        {/* </div> */}
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
