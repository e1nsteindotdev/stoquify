import { handleWebSocket } from '@livestore/sync-cf/cf-worker'
import type { ExecutionContext } from 'hono'
export { WebSocketServer } from "./web-socket-do"

interface Env {
  DB: D1Database;
  ADMIN_SECRET: string
  ws_do: DurableObjectNamespace;
}

export default {
  fetch: async (request: Request, env: Env, ctx: ExecutionContext) => {
    const url = new URL(request.url)

    if (url.pathname.endsWith('/websocket')) {
      return handleWebSocket(request, env, ctx, {
        validatePayload: (payload: any) => {
          if (payload?.authToken !== 'insecure-token-change-me') {
            throw new Error('Invalid auth token')
          }
        },
      })
    }

    return new Response('Invalid path', { status: 400 })
  },
}
