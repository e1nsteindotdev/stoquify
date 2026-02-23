import { Outlet, createRootRoute } from "@tanstack/react-router";
import { QueryClientProvider, QueryClient } from "@tanstack/react-query";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { Toaster } from "@/components/ui/sonner"
import { ClipLoader } from "react-spinners";
import { queryClient } from "@/lib/convex-query";
import "@/App.css";

export const Route = createRootRoute({
  component: () => {
    return (
      <>
        <ThemeProvider>
          <QueryClientProvider client={queryClient}>
            <Outlet />
            <Toaster />
          </QueryClientProvider>
        </ThemeProvider >
      </>
    );
  },
});
//
// function AuthWrapper({ children }) {
//   return (
//     <>
//       <AuthLoading> <LoadingScreen /> </AuthLoading>
//       <Unauthenticated>
//         <AuthForm />
//       </Unauthenticated>
//       <Authenticated>{children}</Authenticated>
//     </>
//   );
// }

