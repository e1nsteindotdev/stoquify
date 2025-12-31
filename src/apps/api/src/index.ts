import { DurableObject } from 'cloudflare:workers'
import { makeDurableObject, makeWorker } from '@livestore/sync-cf/cf-worker'
import { createStoreDoPromise, type CreateStoreDoOptions } from '@livestore/adapter-cloudflare'
import { nanoid, type Store } from '@livestore/livestore'
import { schema, tables } from 'dashboard/schema'

interface Env {
  WEBSOCKET_SERVER: DurableObjectNamespace
  CLIENT_DO: DurableObjectNamespace
  DB: D1Database
}

const storeId = "bb360461-d04b-4c37-93df-124e9a7f8819"

export class WebSocketServer extends makeDurableObject({
  onPush: async (message) => {
    console.log('onPush', message.batch)
  },
  onPull: async (message) => {
    console.log('onPull', message)
  },
}) { }

export class LiveStoreClientDO extends DurableObject<Env> {
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url)

    if (url.pathname === '/getTodos') {
      const store = await this.getStore()
      const todos = store.query(tables.todos)
      return new Response(JSON.stringify(todos), {
        headers: { 'Content-Type': 'application/json' },
      })
    }

    return new Response('Not found', { status: 404 })
  }

  async getStore(): Promise<Store<typeof schema>> {
    const store = await createStoreDoPromise({
      schema,
      storeId,
      clientId: 'client-do',
      sessionId: nanoid(),
      storage: this.ctx.storage,
      durableObjectId: this.ctx.id.toString(),
      bindingName: 'CLIENT_DO',
      syncBackendDurableObject: this.env.WEBSOCKET_SERVER.get(this.env.WEBSOCKET_SERVER.idFromName(storeId)) as unknown as CreateStoreDoOptions['syncBackendDurableObject'],
      livePull: true,
    })

    return store
  }
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext) {
    const url = new URL(request.url)

    if (url.pathname === '/getTodos') {
      const id = env.CLIENT_DO.idFromName(storeId)
      return env.CLIENT_DO.get(id).fetch(request)
    }

    return makeWorker({
      validatePayload: (payload: any) => {
        if (payload?.authToken !== 'insecure-token-change-me') {
          throw new Error('Invalid auth token')
        }
      },
      enableCORS: true,
    }).fetch(request as any, env as any, ctx)
  },
}
