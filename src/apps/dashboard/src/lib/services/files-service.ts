import { Context, Effect, Layer } from "effect";

// Database configuration constants for IndexedDB
const DB_NAME = "stoquify-image-uploads";
const STORE_NAME = "files";
const DB_VERSION = 4;

/** Interface representing a file stored in IndexedDB */
export interface LocalFiles {
  readonly id: string;
  readonly name: string;
  readonly type: string;
  readonly size: number;
  readonly data: ArrayBuffer;
  readonly createdAt: Date;
}

/**
 * LocalFiles service context tag for dependency injection.
 * Provides IndexedDB-based local file storage operations.
 */
export class LocalFiles extends Context.Tag("LocalFiles")<
  LocalFiles,
  {
    /** Writes a base64-encoded file to IndexedDB, returns the generated numeric ID */
    readonly write: (
      file: string | File,
    ) => Effect.Effect<number, Error, never>;
    /** Reads a file from IndexedDB by ID, returns base64-encoded data URL */
    readonly read: (id: number) => Effect.Effect<string | null, Error, never>;
    /** Deletes a file from IndexedDB by ID */
    readonly delete: (id: number) => Effect.Effect<void, Error, never>;
  }
>() {
  /**
   * Creates the effect layer for the LocalFiles service.
   * Opens IndexedDB connection and provides CRUD operations.
   */
  static readonly layer = Layer.effect(
    LocalFiles,
    Effect.gen(function*() {
      // Open IndexedDB and wrap in Effect for async handling
      const db = yield* Effect.async<IDBDatabase, Error, never>((resume) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        // Handle database schema upgrades on version changes
        request.onupgradeneeded = (e) => {
          const database = (e.target as IDBOpenDBRequest).result;
          const oldVersion = e.oldVersion;

          // Delete and recreate the store if it exists with old schema (version < 3)
          // This ensures clean schema migration
          if (
            oldVersion < 4 &&
            database.objectStoreNames.contains(STORE_NAME)
          ) {
            database.deleteObjectStore(STORE_NAME);
          }

          // Create new store without keyPath for numeric auto-increment IDs
          if (!database.objectStoreNames.contains(STORE_NAME)) {
            database.createObjectStore(STORE_NAME);
          }
        };

        request.onsuccess = () => resume(Effect.succeed(request.result));
        request.onerror = () =>
          resume(Effect.fail(new Error(String(request.error))));
      });

      return {
        // Writes a base64 data URL to IndexedDB:
        // 1. Converts base64 to Blob via fetch
        // 2. Generates a random 6-digit numeric ID
        // 3. Stores the blob with that ID
        write: (file) =>
          Effect.gen(function*() {
            // Convert base64 to Blob first (async operations)

            let ensuredFile: File;
            if (typeof file === "string") {
              const response = yield* Effect.tryPromise(() => fetch(file));
              const blob = yield* Effect.tryPromise(() => response.blob());
              ensuredFile = new File([blob], "image", { type: blob.type });
            } else ensuredFile = file;

            // Generate a 6-digit random ID
            const id = Math.floor(100000 + Math.random() * 900000);

            // Create transaction after all async work is done
            const tx = db.transaction([STORE_NAME], "readwrite");
            const store = tx.objectStore(STORE_NAME);

            return yield* Effect.async<number, Error, never>((resume) => {
              const request = store.add(ensuredFile, id);

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

        // Reads a file from IndexedDB by its numeric ID:
        // 1. Retrieves the stored Blob
        // 2. Converts Blob to base64 data URL using FileReader
        read: (id: number) =>
          Effect.gen(function*() {
            const tx = db.transaction([STORE_NAME], "readonly");
            const store = tx.objectStore(STORE_NAME);
            return yield* Effect.async<string | null, Error, never>(
              (resume) => {
                const request = store.get(id);
                request.onsuccess = () => {
                  if (request.result) {
                    const file = request.result;
                    const url = URL.createObjectURL(file);
                    resume(Effect.succeed(url));
                  } else {
                    resume(Effect.succeed(null));
                  }
                };
                request.onerror = () => resume(Effect.succeed(null));
              },
            );
          }),

        // Deletes a file from IndexedDB by its numeric ID
        delete: (id: number) =>
          Effect.gen(function*() {
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
