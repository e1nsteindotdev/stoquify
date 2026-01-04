export interface ServerEventInput {
  name: string
  args?: unknown
  clientId: string
  sessionId: string
}

export interface StoredEvent {
  name: string
  args: unknown | null
  seqNum: number
  parentSeqNum: number
  createdAt: string
  clientId: string
  sessionId: string
}

export interface PushResult {
  event: StoredEvent
  broadcastCount: number
}

export interface Env {
  DB: D1Database
  ADMIN_SECRET?: string
}

export interface DurableObjectSelf {
  ctx: DurableObjectState
  env: Env
}

// declare global {
//   interface Env {}
//   interface DurableObjectState {}
//   interface D1Database {}
//   interface DurableObjectStorage {}
//   interface DurableObjectId {}
//   interface WebSocket {}
//   interface WebSocketPair {}
//   interface WebSocketRequestResponsePair {}
//   interface D1Statement {}
//   interface D1Result<T = unknown> {
//     results: T[]
//     success: boolean
//     error?: string
//   }
// }

