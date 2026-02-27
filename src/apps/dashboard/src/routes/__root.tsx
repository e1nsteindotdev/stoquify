import { Outlet, createRootRoute } from "@tanstack/react-router";
import { QueryClientProvider, } from "@tanstack/react-query";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { Toaster } from "@/components/ui/sonner"
import { queryClient } from "@/lib/ts-query-client";
import { Authenticated, AuthLoading, Unauthenticated } from "convex/react";
import { AuthForm } from "@/components/forms/auth/auth-form";

import "@/App.css";


export const Route = createRootRoute({
  component: () => {
    return (
      <>
        <ThemeProvider>
          <QueryClientProvider client={queryClient}>
            <AuthLoading> <p>loading...</p> </AuthLoading>
            <Unauthenticated>
              <AuthForm />
            </Unauthenticated>
            <Authenticated>
              <Outlet />
            </Authenticated>
            <Toaster />
          </QueryClientProvider>
        </ThemeProvider >
      </>
    );
  },
});

