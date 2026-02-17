import { makeWorker } from "@livestore/adapter-web/worker";

import { schema } from "@/livestore/schema";
import { makeHttpSync } from "./sync/http-sync";

const syncUrl =
  import.meta.env.VITE_LIVESTORE_SYNC_URL || "http://localhost:8780";

makeWorker({
  schema,
  sync: {
    backend: makeHttpSync({
      url: syncUrl,
      livePull: { pollInterval: 5000 },
    }) as any,
    initialSyncOptions: { _tag: "Blocking", timeout: 5000 },
  },
});
