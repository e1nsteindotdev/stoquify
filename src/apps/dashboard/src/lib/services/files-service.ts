import { Context, Effect, Layer } from "effect";

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
    Effect.gen(function*() {
      const db = yield* Effect.async<IDBDatabase, Error, never>(resume => {
        const request = indexedDB.open("filesDb", 1);
        request.onupgradeneeded = (e) => {
          const database = (e.target as IDBOpenDBRequest).result;
          if (!database.objectStoreNames.contains("files")) {
            database.createObjectStore("files", {
              keyPath: "id",
              autoIncrement: true,
            });
          }
        };

        request.onsuccess = () =>
          resume(Effect.succeed(request.result));
        // request.onerror = () =>
        //   resume(Effect.fail(new Error(request?.error)))
      })

      return {
        write: (base64: string) =>
          Effect.gen(function*() {
            const tx = db.transaction(["files"], "readwrite");
            const store = tx.objectStore("files");

            // we get the base64
            return yield* Effect.async<number, Error, never>((resume) => {
              const request = store.add({
                data: base64,
                timestamp: Date.now(),
              });

              request.onsuccess = () => {
                const generatedId = request.result as number;
                // we succeed with the id of the file to retrieve it later
                resume(Effect.succeed(generatedId));
              };

              tx.onerror = () =>
                resume(Effect.fail(new Error("Failed to save image")));
            });
          }),
        read: (id: number) =>
          Effect.gen(function*() {
            const tx = db.transaction(["files"], "readonly");
            const store = tx.objectStore("files");
            return yield* Effect.async<string, Error, never>((resume) => {
              const request = store.get(id);
              request.onsuccess = () => {
                if (request.result) resume(Effect.succeed(request.result.data));
                else resume(Effect.fail(new Error("File not found")));
              };
              request.onerror = () =>
                resume(Effect.fail(new Error("Read failed")));
            });
          }),
        delete: (id: number) =>
          Effect.gen(function*() {
            const tx = db.transaction(["files"], "readwrite");
            const store = tx.objectStore("files");
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
