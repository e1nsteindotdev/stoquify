import {
  Outlet,
  createRootRoute,
  useRouterState,
} from "@tanstack/react-router";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import "@/App.css";

import { makePersistedAdapter } from "@livestore/adapter-web";
import LiveStoreSharedWorker from "@livestore/adapter-web/shared-worker?sharedworker";
import { LiveStoreProvider, useStore } from "@livestore/react";
import { unstable_batchedUpdates as batchUpdates } from "react-dom";
import { useEffect } from "react";

import LiveStoreWorker from "@/livestore/livestore.worker?worker";
import { orgId$, schema, shopId$ } from "@/livestore/schema";
import { useAuth } from "@/hooks/useAuth";
import { LoginForm } from "@/components/auth/login-form";

const AUTH_LOGOUT_REASON_KEY = "stoquify_auth_logout_reason";

const adapter = makePersistedAdapter({
  storage: { type: "opfs" },
  worker: LiveStoreWorker,
  sharedWorker: LiveStoreSharedWorker,
  experimental: {
    disableFastPath: true,
  },
});

const LiveStoreContextBridge = () => {
  const { store } = useStore();
  const organizationId = useAuth((state) => state.organization?.id);
  const shopId = useAuth((state) => state.shop?.id);
  console.log("shopID :", shopId);

  useEffect(() => {
    if (organizationId) {
      store.setSignal(orgId$, organizationId);
    }
    if (shopId) {
      store.setSignal(shopId$, shopId);
    }
  }, [organizationId, shopId, store]);

  return null;
};

export const Route = createRootRoute({
  component: () => {
    const isLoading = useAuth((state) => state.isLoading);
    const isAuthenticated = useAuth((state) => state.isAuthenticated);
    const storeId = useAuth((state) => state.storeId);
    const logout = useAuth((state) => state.logout);
    const refresh = useAuth((state) => state.refresh);
    const pathname = useRouterState({
      select: (state) => state.location.pathname,
    });

    useEffect(() => {
      if (isAuthenticated && !storeId) {
        void refresh();
      }
    }, [isAuthenticated, storeId, refresh]);

    console.log("storeId :", storeId);

    useEffect(() => {
      if (typeof BroadcastChannel === "undefined") return;

      const channel = new BroadcastChannel("stoquify-auth");
      const onMessage = (event: MessageEvent) => {
        if (event.data?.type === "unauthorized") {
          if (typeof window !== "undefined") {
            window.sessionStorage.setItem(
              AUTH_LOGOUT_REASON_KEY,
              "session_expired",
            );
          }
          void logout();
        }
      };

      channel.addEventListener("message", onMessage);
      return () => {
        channel.removeEventListener("message", onMessage);
        channel.close();
      };
    }, [logout]);

    if (isLoading) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-[#EEEFEF]">
          <div className="text-lg">Chargement...</div>
        </div>
      );
    }

    if (!isAuthenticated) {
      return (
        <ThemeProvider>
          {pathname === "/signup" ? <Outlet /> : <LoginForm />}
          <Toaster />
        </ThemeProvider>
      );
    }

    if (!storeId) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-[#EEEFEF]">
          <div className="text-lg">Loading workspace...</div>
        </div>
      );
    }

    return (
      <>
        <LiveStoreProvider
          schema={schema}
          adapter={adapter}
          renderLoading={(_) => <div>Loading LiveStore ...</div>}
          renderShutdown={(cause) => {
            console.log("🔴 LiveStore shutdown reason:", cause.reason);
            return <div>LiveStore shutdown: {cause.reason}</div>;
          }}
          batchUpdates={batchUpdates}
          storeId={storeId}
          syncPayload={{ authToken: "insecure-token-change-me" }}
        >
          <LiveStoreContextBridge />
          <ThemeProvider>
            <Outlet />
            <Toaster />
          </ThemeProvider>
        </LiveStoreProvider>
      </>
    );
  },
});
