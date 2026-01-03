import { Outlet, createRootRoute } from "@tanstack/react-router";
import { QueryClientProvider, QueryClient } from "@tanstack/react-query";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { Toaster } from "@/components/ui/sonner"
import "@/App.css";
import { AuthForm } from "@/components/forms/auth/auth-form";

import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client'
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      gcTime: 1000 * 60 * 60 * 24, // 24 hours
    },
  },
})

const syncStoragePersister = createAsyncStoragePersister({
  storage: window.localStorage,
})
export const Route = createRootRoute({
  component: () => {
    return (
      <>
        <ThemeProvider>
          <PersistQueryClientProvider
            client={queryClient}
            persistOptions={{ persister: syncStoragePersister }}
          >
            <Outlet />
            <Toaster />
          </PersistQueryClientProvider>
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
