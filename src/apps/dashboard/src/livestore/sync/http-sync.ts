import {
  Effect,
  Option,
  Schema,
  Stream,
  SubscriptionRef,
} from "@livestore/utils/effect";

export interface HttpSyncOptions {
  url: string;
  livePull?: {
    pollInterval?: number;
  };
}

const defaultOptions = {
  livePull: { pollInterval: 5000 },
};

class HttpError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "HttpError";
    this.status = status;
  }
}

const AUTH_CHANNEL_NAME = "stoquify-auth";
let unauthorizedPublished = false;

const publishUnauthorized = () => {
  if (unauthorizedPublished) return;
  unauthorizedPublished = true;

  if (typeof BroadcastChannel === "undefined") return;

  const channel = new BroadcastChannel(AUTH_CHANNEL_NAME);
  channel.postMessage({ type: "unauthorized" });
  channel.close();
};

export const makeHttpSync = (options: HttpSyncOptions) => {
  const opts = { ...defaultOptions, ...options };

  return ({
    storeId,
  }: {
    storeId: string;
    payload?: unknown;
  }): Effect.Effect<any, Error, never> =>
    Effect.gen(function* () {
      const isConnected = yield* SubscriptionRef.make(false);
      const livePullInterval = opts.livePull?.pollInterval ?? 5000;

      const CHECKPOINT_KEY = `stoquify_checkpoint_${storeId}`;

      const getStoredCheckpoint = (): number => {
        if (typeof window === "undefined") return 0;
        const stored = localStorage.getItem(CHECKPOINT_KEY);
        return stored ? parseInt(stored, 10) : 0;
      };

      const setStoredCheckpoint = (seqNum: number) => {
        if (typeof window === "undefined") return;
        localStorage.setItem(CHECKPOINT_KEY, String(seqNum));
      };

      let currentCheckpoint = getStoredCheckpoint();
      console.log("[http-sync] Initial checkpoint:", currentCheckpoint);

      const doRequest = (
        path: string,
        body?: unknown,
      ): Effect.Effect<any, Error, never> =>
        Effect.gen(function* () {
          const url = `${opts.url}${path}?storeId=${encodeURIComponent(storeId)}`;
          const response = yield* Effect.promise(() =>
            fetch(url, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              credentials: "include",
              body: body ? JSON.stringify({ storeId, ...body }) : undefined,
            }).then((res) => {
              if (!res.ok) {
                if (res.status === 401) {
                  publishUnauthorized();
                }
                throw new HttpError(
                  res.status,
                  `HTTP ${res.status}: ${res.statusText}`,
                );
              }
              unauthorizedPublished = false;
              return res.json();
            }),
          );
          return response;
        });

      const connect = Effect.gen(function* () {
        try {
          yield* doRequest("/ping");
          yield* SubscriptionRef.set(isConnected, true);
        } catch {
          yield* SubscriptionRef.set(isConnected, false);
        }
      });

      const ping = Effect.gen(function* () {
        yield* doRequest("/ping");
        yield* SubscriptionRef.set(isConnected, true);
      }).pipe(
        Effect.catchAllCause(() => SubscriptionRef.set(isConnected, false)),
      );

      const backendIdHelper = yield* Effect.gen(function* () {
        let currentId: string | undefined = "backend-1";
        return {
          get: () => Option.fromNullable(currentId),
          lazySet: (id: string) => {
            currentId = id;
          },
        };
      });

      const pull = (
        cursor: Option.Option<{
          eventSequenceNumber: number;
          metadata?: Option.Option<unknown>;
        }>,
        pullOptions?: { live?: boolean },
      ) => {
        const cursorSeq = Option.match(cursor, {
          onNone: () => 0,
          onSome: (c) => c.eventSequenceNumber ?? 0,
        });

        const afterSeq = cursorSeq > 0 ? cursorSeq : currentCheckpoint;
        console.log(
          "[http-sync] Pulling with afterSeq:",
          afterSeq,
          "cursorSeq:",
          cursorSeq,
          "stored checkpoint:",
          currentCheckpoint,
        );

        const fetchBatch = (fromSeq: number) =>
          Effect.gen(function* () {
            const response = yield* doRequest("/pull", { afterSeq: fromSeq });
            const events = response.events || [];

            const newCheckpoint = response.checkpoint ?? fromSeq;
            if (newCheckpoint > currentCheckpoint) {
              currentCheckpoint = newCheckpoint;
              setStoredCheckpoint(currentCheckpoint);
              console.log(
                "[http-sync] Updated checkpoint to:",
                currentCheckpoint,
              );
            }

            return {
              batch: events.map((event: any) => ({
                eventEncoded: event,
                metadata: Option.none(),
              })),
              checkpoint: response.checkpoint,
              lastSeqNum:
                events.length > 0 ? events[events.length - 1].seqNum : fromSeq,
            };
          });

        const stream = Stream.fromEffect(fetchBatch(afterSeq));

        if (pullOptions?.live) {
          return Stream.flatMap(stream, (firstResult) => {
            let currentSeq = firstResult.lastSeqNum;

            const liveStream = Stream.flatMap(
              Stream.repeatEffect(Effect.sleep(livePullInterval)),
              () =>
                Stream.fromEffect(
                  Effect.gen(function* () {
                    const response = yield* doRequest("/pull", {
                      afterSeq: currentSeq,
                    });
                    const events = response.events || [];

                    const newCheckpoint = response.checkpoint ?? currentSeq;
                    if (newCheckpoint > currentCheckpoint) {
                      currentCheckpoint = newCheckpoint;
                      setStoredCheckpoint(currentCheckpoint);
                    }

                    if (events.length === 0) {
                      return {
                        batch: [],
                        checkpoint: response.checkpoint,
                        lastSeqNum: currentSeq,
                      };
                    }

                    currentSeq = events[events.length - 1].seqNum;

                    return {
                      batch: events.map((event: any) => ({
                        eventEncoded: event,
                        metadata: Option.none(),
                      })),
                      checkpoint: response.checkpoint,
                      lastSeqNum: currentSeq,
                    };
                  }),
                ),
            );

            return Stream.concat(
              Stream.succeed({
                batch: firstResult.batch,
                pageInfo: { _tag: "MoreKnown" as const, remaining: 0 },
              }),
              Stream.map(liveStream, (r) => ({
                batch: r.batch,
                pageInfo:
                  r.batch.length > 0
                    ? { _tag: "MoreKnown" as const, remaining: 0 }
                    : { _tag: "NoMore" as const },
              })),
            );
          });
        }

        return Stream.map(stream, (result) => ({
          batch: result.batch,
          pageInfo:
            result.batch.length > 0
              ? { _tag: "MoreKnown" as const, remaining: 0 }
              : { _tag: "NoMore" as const },
        }));
      };

      const push = (batch: ReadonlyArray<any>) =>
        Effect.gen(function* () {
          if (batch.length === 0) {
            return;
          }

          const events = batch.map((item) => ({
            name: item.name,
            args: item.args,
            seqNum: item.seqNum,
            parentSeqNum: item.parentSeqNum,
            clientId: item.clientId,
            sessionId: item.sessionId,
          }));

          yield* doRequest("/events", { events });
        });

      return {
        connect,
        isConnected,
        pull,
        push,
        ping,
        metadata: {
          name: "@stoquify/custom-http-sync",
          description: "Custom HTTP sync backend for Stoquify",
          protocol: "http",
          url: opts.url,
        },
        supports: {
          pullPageInfoKnown: true,
          pullLive: true,
        },
      };
    });
};
