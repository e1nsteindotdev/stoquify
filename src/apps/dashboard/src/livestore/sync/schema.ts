import { Rpc, RpcGroup, Schema } from "@livestore/utils/effect";

export class SyncRpc extends RpcGroup.make(
  Rpc.make("SyncRpc.Push", {
    payload: Schema.Struct({
      storeId: Schema.String,
      events: Schema.Array(
        Schema.Struct({
          name: Schema.String,
          args: Schema.Unknown,
          seqNum: Schema.Number,
          parentSeqNum: Schema.Number,
          clientId: Schema.String,
          sessionId: Schema.String,
        }),
      ),
    }),
    success: Schema.Struct({ lastSeqNum: Schema.Number }),
    error: Schema.String,
  }),
  Rpc.make("SyncRpc.Pull", {
    payload: Schema.Struct({
      storeId: Schema.String,
      afterSeq: Schema.Number,
    }),
    success: Schema.Struct({
      events: Schema.Array(
        Schema.Struct({
          name: Schema.String,
          args: Schema.Unknown,
          seqNum: Schema.Number,
          parentSeqNum: Schema.Number,
          clientId: Schema.String,
          sessionId: Schema.String,
        }),
      ),
      checkpoint: Schema.Number,
    }),
    error: Schema.String,
    stream: true,
  }),
  Rpc.make("SyncRpc.Ping", {
    payload: Schema.Struct({ storeId: Schema.String }),
    success: Schema.Struct({ ok: Schema.Boolean }),
    error: Schema.String,
  }),
) {}
