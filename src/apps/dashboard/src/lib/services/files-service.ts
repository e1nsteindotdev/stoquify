import { Context, Effect, Layer } from "effect";

export interface LocalFiles {
  readonly id: string;
  readonly name: string;
  readonly type: string;
  readonly size: number;
  readonly data: ArrayBuffer;
  readonly createdAt: Date;
}

export class LocalFiles extends Context.Tag("CloudFiles")<
  LocalFiles,
  {
    readonly write: (file: File) => Effect.Effect<number, Error, never>;
    readonly read: (url: number) => Effect.Effect<string, Error, never>;
    readonly delete: (id: number) => Effect.Effect<void, Error, never>;
  }
>() { }

const localFilesLayer = Layer.effect(
  LocalFiles,
  Effect.gen(function*() {
    const db = yield* Effect.tryPromise({
      try: () =>
        new Promise<IDBDatabase>((resolve, reject) => {
          const request = indexedDB.open("ImageDB", 1);

          request.onupgradeneeded = (e) => {
            const database = (e.target as IDBOpenDBRequest).result;
            if (!database.objectStoreNames.contains("images")) {
              database.createObjectStore("images", {
                keyPath: "id",
                autoIncrement: true,
              });
            }
          };

          request.onsuccess = () => resolve(request.result);
          request.onerror = () => reject(request.error);
        }),
      catch: (e) => console.log(e),
    });

    return {
      write: (file: File) =>
        Effect.gen(function*() {
          const tx = db.transaction(["images"], "readwrite");
          const store = tx.objectStore("images");

          // we get the base64
          const base64 = Effect.async<string, never>((resume) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () =>
              resume(Effect.succeed(reader.result as string));
            reader.onerror = (error) => Effect.fail(error);
          });

          // we store the base64 in indexedb
          return yield* Effect.async<number, Error, never>((resume) => {
            const request = store.add({
              name: file.name,
              data: base64, // <--- No Base64, just the File/Blob
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
          const tx = db.transaction(["images"], "readwrite");
          const store = tx.objectStore("images");
          return yield* Effect.async<string, Error, never>((resume) => {
            const request = store.get(id);
            request.onsuccess = () => {
              if (request.result) resume(Effect.succeed(request.result.data));
              else resume(Effect.fail(new Error("Image not found")));
            };
            request.onerror = () =>
              resume(Effect.fail(new Error("Read failed")));
          });
        }),
      delete: (id: number) =>
        Effect.gen(function*() {
          const tx = db.transaction(["images"], "readwrite");
          const store = tx.objectStore("images");
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
