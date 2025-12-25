import { fetchRequestHandler } from "@trpc/server/adapters/fetch"
import { appRouter } from "./router"
import type { AppRouter } from "./router"

type Env = {
  D1: D1Database
}
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Request-Method": "*",
      "Access-Control-Allow-Methods": "OPTIONS, GET, POST",
      "Access-Control-Allow-Headers": "*"
    }

    if (request.method === "OPTIONS") {
      return new Response("ok", { headers: corsHeaders })
    }

    const response = await fetchRequestHandler<AppRouter>({
      endpoint: "/trpc",
      req: request,
      router: appRouter,
      createContext() {
        return {
          d1: env.D1,
          my_service: { message: "hello from dynamic context" }
        }
      }
    })

    const newHeaders = new Headers(response.headers)
    for (const [key, value] of Object.entries(corsHeaders)) {
      newHeaders.set(key, value)
    }

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: newHeaders
    })
  }
}
