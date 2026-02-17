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
              body: body ? JSON.stringify({ storeId, ...body }) : undefined,
            }).then((res) => {
              if (!res.ok) {
                throw new Error(`HTTP ${res.status}: ${res.statusText}`);
              }
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

      const pull = (cursor: any, pullOptions?: { live?: boolean }) => {
        const stream = Stream.fromEffect(
          Effect.gen(function* () {
            const afterSeq = cursor?.eventSequenceNumber ?? 0;
            const response = yield* doRequest("/pull", { afterSeq });

            return {
              batch: (response.events || []).map((event: any) => ({
                eventEncoded: event,
                metadata: Option.none(),
              })),
              pageInfo:
                response.checkpoint === -1
                  ? { _tag: "NoMore" }
                  : { _tag: "MoreKnown", remaining: 0 },
            };
          }),
        );

        if (pullOptions?.live) {
          const unfoldEffect = (lastCursor: number) =>
            Effect.gen(function* () {
              yield* Effect.sleep(livePullInterval);
              const response = yield* doRequest("/pull", {
                afterSeq: lastCursor,
              });

              return {
                batch: (response.events || []).map((event: any) => ({
                  eventEncoded: event,
                  metadata: Option.none(),
                })),
                pageInfo:
                  response.checkpoint === -1
                    ? { _tag: "NoMore" }
                    : { _tag: "MoreKnown", remaining: 0 },
              };
            });

          return Stream.flatMap(stream, (firstResult) => {
            const lastSeq =
              firstResult.batch.at(-1)?.eventEncoded?.seqNum ??
              cursor?.eventSequenceNumber ??
              0;
            return Stream.concat(
              Stream.succeed(firstResult),
              Stream.flatMap(
                Stream.repeatEffect(Effect.sleep(livePullInterval)),
                () => Stream.fromEffect(unfoldEffect(lastSeq)),
              ),
            );
          });
        }

        return stream;
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
