import { Outlet, createRootRoute } from "@tanstack/react-router";
import { QueryClientProvider, QueryClient } from "@tanstack/react-query";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { Toaster } from "@/components/ui/sonner"
import "@/App.css";
import { AuthForm } from "@/components/forms/auth/auth-form";

const queryClient = new QueryClient()
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

import { ClipLoader } from "react-spinners";

function LoadingScreen() {
  return (
    <div className="h-screen center">
      <ClipLoader color="#000" size={50} />
    </div>
  )
}
