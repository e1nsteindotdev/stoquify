import { Context, Effect, Layer } from "effect"

export interface LocalFile {
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
    readonly insertFile: (file: File) => Effect.Effect<void, never, never>,
    readonly readFiles: (url: string) => Effect.Effect<ArrayBuffer, Error, never>
  }
>() { }

export interface LocalFilesService {
  readonly insertFile: (file: File) => Effect.Effect<LocalFile, never, never>;
  readonly readFiles: (url: string) => Effect.Effect<ArrayBuffer, Error, never>;
}

class LocalFilesServiceImpl extends Effect.Service<LocalFilesServiceImpl>()(
  "LocalFilesService",
  {
    accessors: true,
    effect: Effect.gen(function*() {
      const files = new Map<string, LocalFile>();

      const insertFile = (file: File): Effect.Effect<LocalFile, never, never> =>
        Effect.sync(() => {
          const id = crypto.randomUUID();
          const localFile: LocalFile = {
            id,
            name: file.name,
            type: file.type,
            size: file.size,
            data: new ArrayBuffer(0),
            createdAt: new Date(),
          };
          files.set(id, localFile);
          return localFile;
        });

      const readFiles = (
        url: string,
      ): Effect.Effect<ArrayBuffer, Error, never> =>
        Effect.async((resolve, signal) => {
          const xhr = new XMLHttpRequest();
          xhr.responseType = "arraybuffer";
          xhr.open("GET", url);
          xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              resolve(Effect.succeed(xhr.response as ArrayBuffer));
            } else {
              resolve(
                Effect.fail(new Error(`Failed to fetch ${url}: ${xhr.status}`)),
              );
            }
          };
          xhr.onerror = () => {
            resolve(Effect.fail(new Error(`Failed to fetch ${url}`)));
          };
          xhr.onabort = () => {
            resolve(Effect.fail(new Error(`Request aborted for ${url}`)));
          };
          xhr.send();
          return void 0;
        });

      return { insertFile, readFiles } as LocalFilesService;
    }),
  },
) { }

export const LocalFilesLive = LocalFilesServiceImpl.Default;
