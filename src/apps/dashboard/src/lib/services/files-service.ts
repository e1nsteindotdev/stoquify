import { Context, Effect, Layer } from "effect";

// Same constants as indexeddb.ts
const DB_NAME = "stoquify-image-uploads";
const STORE_NAME = "files";
const DB_VERSION = 4;

export interface LocalFiles {
  readonly id: string;
  readonly name: string;
  readonly type: string;
  readonly size: number;
  readonly data: ArrayBuffer;
  readonly createdAt: Date;
}

export class LocalFiles extends Context.Tag("LocalFiles")<
  LocalFiles,
  {
    readonly write: (base64: string) => Effect.Effect<number, Error, never>;
    readonly read: (id: number) => Effect.Effect<string, Error, never>;
    readonly delete: (id: number) => Effect.Effect<void, Error, never>;
  }
>() {
  static readonly layer = Layer.effect(
    LocalFiles,
    Effect.gen(function* () {
      const db = yield* Effect.async<IDBDatabase, Error, never>((resume) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        request.onupgradeneeded = (e) => {
          const database = (e.target as IDBOpenDBRequest).result;
          const oldVersion = e.oldVersion;

          // Delete and recreate the store if it exists with old schema (version < 3)
          if (
            oldVersion < 4 &&
            database.objectStoreNames.contains(STORE_NAME)
          ) {
            database.deleteObjectStore(STORE_NAME);
          }

          // Create new store without keyPath
          if (!database.objectStoreNames.contains(STORE_NAME)) {
            database.createObjectStore(STORE_NAME);
          }
        };

        request.onsuccess = () => resume(Effect.succeed(request.result));
        request.onerror = () =>
          resume(Effect.fail(new Error(String(request.error))));
      });

      return {
        write: (base64: string) =>
          Effect.gen(function* () {
            // Convert base64 to Blob first (async operations)
            const response = yield* Effect.tryPromise(() => fetch(base64));
            const blob = yield* Effect.tryPromise(() => response.blob());

            // Generate a 6-digit random ID
            const id = Math.floor(100000 + Math.random() * 900000);

            // Create transaction after all async work is done
            const tx = db.transaction([STORE_NAME], "readwrite");
            const store = tx.objectStore(STORE_NAME);

            return yield* Effect.async<number, Error, never>((resume) => {
              const request = store.add({ blob: blob }, id);

              request.onsuccess = () => {
                resume(Effect.succeed(id));
              };

              request.onerror = () =>
                resume(Effect.fail(new Error("Failed to save image")));

              tx.onerror = () =>
                resume(Effect.fail(new Error("Failed to save image")));
            }).pipe(
              Effect.catchAll((e) =>
                Effect.fail(new Error("failed saving the file in indexedDB")),
              ),
            );
          }),
        read: (id: number) =>
          Effect.gen(function* () {
            const tx = db.transaction([STORE_NAME], "readonly");
            const store = tx.objectStore(STORE_NAME);
            return yield* Effect.async<string, Error, never>((resume) => {
              const request = store.get(id);
              request.onsuccess = () => {
                if (request.result) {
                  const blob = request.result.blob;
                  // Convert Blob to base64
                  const reader = new FileReader();
                  reader.onloadend = () => {
                    resume(Effect.succeed(reader.result as string));
                  };
                  reader.onerror = () => {
                    resume(Effect.fail(new Error("Failed to read blob")));
                  };
                  reader.readAsDataURL(blob);
                } else {
                  resume(Effect.fail(new Error("File not found")));
                }
              };
              request.onerror = () =>
                resume(Effect.fail(new Error("Read failed")));
            });
          }),
        delete: (id: number) =>
          Effect.gen(function* () {
            const tx = db.transaction([STORE_NAME], "readwrite");
            const store = tx.objectStore(STORE_NAME);
            return yield* Effect.async<void, Error, never>((resume) => {
              const request = store.delete(id);
              request.onsuccess = () => resume(Effect.succeed(undefined));
              request.onerror = () =>
                resume(Effect.fail(new Error("Delete failed")));
            });
          }),
      };
    }),
  );
}
