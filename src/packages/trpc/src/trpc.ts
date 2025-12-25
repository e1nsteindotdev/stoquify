import { createTRPCProxyClient, httpBatchLink } from "@trpc/client"
import type { AppRouter } from "./router"

export const trpc = createTRPCProxyClient<AppRouter>({
  links: [
    httpBatchLink({
      url: "https://your-worker-subdomain.workers.dev/trpc" // your deployed Worker
    })
  ]
})
