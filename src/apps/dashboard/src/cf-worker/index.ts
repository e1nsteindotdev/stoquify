import { makeDurableObject, makeWorker } from '@livestore/sync-cf/cf-worker'
// import { logExtractedSql } from './event-sql-extractor'
// import { schema } from '../livestore/schema.ts'
//
import type { ServerEventInput } from './types.ts'

const WSS_DO = class extends makeDurableObject({
  onPush: async (message) => {
    console.log('pushed events')
    // console.log('onPush', message.batch)
  },
  onPull: async (message) => {
    console.log('pulled events')
    // console.log('onPull', message)
  },
}) { }

export class WebSocketServer extends WSS_DO {
  async getHead(storeId: string) {
    const dbName = `eventlog_7_${storeId?.replace(/[^a-zA-Z0-9]/g, '_')}`
    const result = await this.env.DB.prepare(
      `SELECT MAX(seqNum) as maxSeq FROM ${dbName}`
    ).first()
    return result?.maxSeq as number ?? 0
  }
  // async customFetch(request: Request) {
  //   const url = new URL(request.url)
  //   if (url.pathname === '/push-auto' && request.method === 'OPTIONS') {
  //     return new Response(null, {
  //       headers: {
  //         'Access-Control-Allow-Origin': '*',
  //         'Access-Control-Allow-Methods': 'POST, OPTIONS',
  //         'Access-Control-Allow-Headers': 'Content-Type',
  //       }
  //     })
  //   }
  //   if (url.pathname === '/push-auto' && request.method === 'POST') {
  //     console.log('called handle push auto')
  //     return this.handlePushAuto(request)
  //   }
  // }
  //
  // private async handlePushAuto(request: Request): Promise<Response> {
  //   return this.ctx.blockConcurrencyWhile(async () => {
  //     const url = new URL(request.url)
  //     const storeId = "e979a59e-9c9f-4e93-ade1-17849ae6d2b7"
  //     const body = await request.json() as ServerEventInput
  //     // const dbName = `eventlog_7_${storeId?.replace(/[^a-zA-Z0-9]/g, '_')}`
  //     const dbName = "eventlog_7_81e3832f_5861_474f_8c68_407fb23f8340"
  //
  //
  //     const result = await this.env.DB.prepare(
  //       `SELECT MAX(seqNum) as maxSeq FROM ${dbName}`
  //     ).first()
  //
  //     const parentSeqNum: number = result?.maxSeq as number ?? 0
  //
  //     const seqNum = parentSeqNum + 1
  //     const createdAt = new Date().toISOString()
  //
  //
  //     const event = {
  //       name: body.name,
  //       args: body.args ?? null,
  //       seqNum,
  //       parentSeqNum,
  //       createdAt,
  //       clientId: body.clientId,
  //       sessionId: body.sessionId,
  //     }
  //     console.log('got the whole event prepared : ')
  //     console.log(event)
  //     //
  //     await this.env.DB.prepare(
  //       `CREATE TABLE IF NOT EXISTS ${dbName} (
  //         seqNum INTEGER PRIMARY KEY,
  //         parentSeqNum INTEGER NOT NULL,
  //         args TEXT,
  //         name TEXT NOT NULL,
  //         createdAt TEXT NOT NULL,
  //         clientId TEXT NOT NULL,
  //         sessionId TEXT NOT NULL
  //       )`
  //     ).run()
  //
  //     await this.env.DB.prepare(
  //       `INSERT INTO ${dbName} (seqNum, parentSeqNum, args, name, createdAt, clientId, sessionId) VALUES (?, ?, ?, ?, ?, ?, ?)`
  //     ).bind(
  //       seqNum, parentSeqNum,
  //       event.args === undefined ? null : JSON.stringify(event.args),
  //       event.name, createdAt, event.clientId, event.sessionId
  //     ).run()
  //
  //     // Broadcast the new event to all connected WebSocket clients
  //     // Construct the message in the exact format clients expect (matches @livestore/sync-cf protocol)
  //     const clients = this.ctx.getWebSockets()
  //     if (clients.length > 0) {
  //       // Build PullRes message matching WSMessage.BackendToClientMessage schema
  //       // This mirrors what the library does internally in durable-object.ts
  //       const pullRes = {
  //         _tag: 'WSMessage.PullRes',
  //         batch: [
  //           {
  //             eventEncoded: event,
  //             metadata: { createdAt },
  //           },
  //         ],
  //         requestId: { context: 'push', requestId: 'push-auto' },
  //         remaining: 0,
  //       }
  //
  //       const encodedMessage = JSON.stringify(pullRes)
  //
  //       for (const conn of clients) {
  //         try {
  //           conn.send(encodedMessage)
  //         } catch (e) {
  //           console.error('Failed to send to client:', e)
  //         }
  //       }
  //     }
  //
  //     return new Response(JSON.stringify(event), {
  //       headers: { 'Content-Type': 'application/json' }
  //     })
  //   })
  // }
  //
}

export default {
  async fetch(request: any, env: any, ctx: any) {

    const url = new URL(request.url)
    if (url.pathname === '/get-head' && request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        }
      })
    }

    if (url.pathname === '/get-head' && request.method === 'GET') {
      console.log("recived /get-head request")
      const storeId = url.searchParams.get('storeId')
      const durableObjectNamespace = env.WEBSOCKET_SERVER
      const id = durableObjectNamespace.idFromName(storeId!)
      const durableObject = durableObjectNamespace.get(id)
      const head = await durableObject.getHead(storeId)
      const response = Response.json({ parentSeqNum: head })
      response.headers.set('Access-Control-Allow-Origin', '*')
      return response
    }


    const worker = makeWorker({
      validatePayload: (payload: any) => {
        if (payload?.authToken !== 'insecure-token-change-me') {
          throw new Error('Invalid auth token')
        }
      },
      enableCORS: true,
    })

    return worker.fetch(request, env, ctx)
  }
}



