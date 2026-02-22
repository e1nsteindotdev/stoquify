/// <reference types="@cloudflare/workers-types" />

import type { D1Database, KVNamespace } from "@cloudflare/workers-types";
import type { EventInput } from "./sql-extractor";

export interface SyncStoreDOEnv {
  DB: D1Database;
  AUTH_KV: KVNamespace;
}

export interface PushRequest {
  storeId: string;
  events: Array<{
    name: string;
    args: Record<string, unknown>;
    clientId: string;
    sessionId: string;
  }>;
}

export interface PullRequest {
  storeId: string;
  afterSeq: number;
}

export interface PushResponse {
  lastSeqNum: number;
}

export interface PullResponse {
  events: Array<{
    seqNum: number;
    parentSeqNum: number;
    name: string;
    args: Record<string, unknown>;
    clientId: string;
    sessionId: string;
  }>;
  checkpoint: number;
}

export class SyncStoreDO {
  ctx: DurableObjectState;
  env: SyncStoreDOEnv;

  constructor(ctx: DurableObjectState, env: SyncStoreDOEnv) {
    this.ctx = ctx;
    this.env = env;
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const pathname = url.pathname;

    if (pathname === "/do/push" && request.method === "POST") {
      return this.handlePush(request);
    }

    if (pathname === "/do/pull" && request.method === "POST") {
      return this.handlePull(request);
    }

    return new Response("Not found", { status: 404 });
  }

  private async handlePush(request: Request): Promise<Response> {
    try {
      const body = (await request.json()) as PushRequest;
      const { storeId, events } = body;

      if (!storeId || !Array.isArray(events) || events.length === 0) {
        return new Response("Invalid request", { status: 400 });
      }

      const response = await this.ctx.blockConcurrencyWhile(async () => {
        const db = this.env.DB;
        const CHECKPOINT_TABLE = "catalog_checkpoint";
        const EVENTLOG_TABLE = "eventlog";

        const checkpointRow = await db
          .prepare(
            `SELECT lastSeqNum FROM ${CHECKPOINT_TABLE} WHERE storeId = ?`,
          )
          .bind(storeId)
          .first<{ lastSeqNum: number }>();

        let currentSeqNum = checkpointRow?.lastSeqNum ?? 0;
        const timestamp = Date.now();

        const insertedEvents: Array<{
          seqNum: number;
          parentSeqNum: number;
          name: string;
          args: Record<string, unknown>;
          clientId: string;
          sessionId: string;
        }> = [];

        for (const event of events) {
          currentSeqNum += 1;
          const parentSeqNum = currentSeqNum - 1;

          await db
            .prepare(
              `INSERT INTO ${EVENTLOG_TABLE} (storeId, seqNum, eventName, eventArgs, clientId, sessionId, parentSeqNum, timestamp)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            )
            .bind(
              storeId,
              currentSeqNum,
              event.name,
              JSON.stringify(event.args),
              event.clientId,
              event.sessionId,
              parentSeqNum,
              timestamp,
            )
            .run();

          insertedEvents.push({
            seqNum: currentSeqNum,
            parentSeqNum,
            name: event.name,
            args: event.args,
            clientId: event.clientId,
            sessionId: event.sessionId,
          });
        }

        await db
          .prepare(
            `INSERT INTO ${CHECKPOINT_TABLE} (storeId, lastSeqNum) VALUES (?, ?)
             ON CONFLICT(storeId) DO UPDATE SET lastSeqNum = excluded.lastSeqNum`,
          )
          .bind(storeId, currentSeqNum)
          .run();

        return {
          lastSeqNum: currentSeqNum,
          events: insertedEvents,
        };
      });

      return Response.json(response);
    } catch (error) {
      console.error("DO push error:", error);
      return new Response("Internal error", { status: 500 });
    }
  }

  private async handlePull(request: Request): Promise<Response> {
    try {
      const body = (await request.json()) as PullRequest;
      console.log('pull body :', body)
      const { storeId, afterSeq = 0 } = body;

      if (!storeId) {
        return new Response("Missing storeId", { status: 400 });
      }

      const db = this.env.DB;
      const CHECKPOINT_TABLE = "catalog_checkpoint";
      const EVENTLOG_TABLE = "eventlog";

      const rows = await db
        .prepare(
          `SELECT seqNum, parentSeqNum, eventName, eventArgs, clientId, sessionId
           FROM ${EVENTLOG_TABLE}
           WHERE storeId = ? AND seqNum > ?
           ORDER BY seqNum ASC`,
        )
        .bind(storeId, afterSeq)
        .all<{
          seqNum: number;
          parentSeqNum: number;
          eventName: string;
          eventArgs: string;
          clientId: string;
          sessionId: string;
        }>();

      const events = rows.results.map((row) => ({
        seqNum: row.seqNum,
        parentSeqNum: row.parentSeqNum,
        name: row.eventName,
        args: JSON.parse(row.eventArgs || "{}"),
        clientId: row.clientId,
        sessionId: row.sessionId,
      }));

      // console.log("pulled evnets :")
      // console.log(events)

      const checkpointRow = await db
        .prepare(`SELECT lastSeqNum FROM ${CHECKPOINT_TABLE} WHERE storeId = ?`)
        .bind(storeId)
        .first<{ lastSeqNum: number }>();

      return Response.json({
        events,
        checkpoint: checkpointRow?.lastSeqNum ?? 0,
      });
    } catch (error) {
      console.error("DO pull error:", error);
      return new Response("Internal error", { status: 500 });
    }
  }
}
