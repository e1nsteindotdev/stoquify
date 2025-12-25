import { createTRPCProxyClient, httpBatchLink } from "@trpc/client"
import type { AppRouter } from "../router"

export const trpc = createTRPCProxyClient<AppRouter>({
  links: [
    httpBatchLink({
      url: "http://localhost:8787/trpc" // your deployed Worker
    })
  ]
})
