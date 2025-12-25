import { appRouter } from "@repo/trpc/router"
import type { AppRouter } from "@repo/trpc/router"
import { fetchRequestHandler } from "@trpc/server/adapters/fetch"

export default {
  fetch(request: Request): Promise<Response> {
    return fetchRequestHandler<AppRouter>({
      endpoint: "/trpc",
      req: request,
      router: appRouter,
      createContext() {
        return {}
      }
    })
  }
}
