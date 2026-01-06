import { Outlet, createRootRoute } from "@tanstack/react-router";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import "@/App.css";

import { makePersistedAdapter } from "@livestore/adapter-web";
import LiveStoreSharedWorker from "@livestore/adapter-web/shared-worker?sharedworker";
import { LiveStoreProvider } from "@livestore/react";
import { unstable_batchedUpdates as batchUpdates } from "react-dom";

import LiveStoreWorker from "@/livestore/livestore.worker?worker";
import { schema } from "@/livestore/schema";

const adapter = makePersistedAdapter({
  storage: { type: "opfs" },
  worker: LiveStoreWorker,
  sharedWorker: LiveStoreSharedWorker,
});

const storeId = "nezt-livestore-store-2";

export const Route = createRootRoute({
  component: () => {
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
          <ThemeProvider>
            <Outlet />
            <Toaster />
          </ThemeProvider>
        </LiveStoreProvider>
      </>
    );
  },
});
