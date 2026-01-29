import { generateUploadUrl, getImageUrl } from "@/actions/convex-uploads";
import { Context, Layer, Effect } from "effect";
import { LocalFiles } from "./files-service";
import avifEncode, { init as initAvifEncode } from "@jsquash/avif/encode";
import avifDecode, { init as initAvifDecode } from "@jsquash/avif/decode";

export class Images extends Context.Tag("Images")<
  Images,
  {
    readonly saveImageLocally: (
      base64: string,
    ) => Effect.Effect<number, Error, never>;
    readonly uploadImageToCloud: (
      file: File,
    ) => Effect.Effect<string, Error, never>;
    readonly compressImageLocally: (
      input: File | Blob | string,
      quality?: number,
    ) => Effect.Effect<
      {
        base64: string;
        file: File;
        originalSizeKb: number;
        compressedSizeKb: number;
        compressionRatio: number;
      },
      Error,
      never
    >;
    readonly deleteLocalImage: (
      id: number,
    ) => Effect.Effect<void, Error, never>;
    readonly deleteCloudImage: (
      url: string,
    ) => Effect.Effect<void, Error, never>;
  }
>() {
  static readonly layer = Layer.effect(
    Images,
    Effect.gen(function*() {
      const localFiles = yield* LocalFiles;

      // Initialize AVIF encoder/decoder with custom WASM file location
      yield* Effect.promise(() =>
        Promise.all([
          initAvifEncode({
            locateFile: (path: string) => `/wasm/${path}`,
          }),
          initAvifDecode({
            locateFile: (path: string) => `/wasm/${path}`,
          }),
        ]),
      ).pipe(
        Effect.catchAll((error) => {
          console.error("Failed to initialize AVIF modules:", error);
          return Effect.fail(new Error(`AVIF initialization failed: ${error}`));
        }),
      );

      return {
        saveImageLocally: (base64: string) => localFiles.write(base64),

        uploadImageToCloud: (file: File) =>
          Effect.gen(function*() {
            const uploadUrl = yield* Effect.promise(() => generateUploadUrl());
            const storageId: string = yield* Effect.promise(() =>
              fetch(uploadUrl, {
                method: "POST",
                headers: { "Content-Type": file.type },
                body: file,
              }),
            ).pipe(
              Effect.andThen((value) => value.json()),
              Effect.andThen(
                (result: { storageId: string }) => result.storageId,
              ),
            );

            const imageUrl = yield* Effect.promise(() =>
              getImageUrl(storageId),
            );
            if (!imageUrl) {
              return yield* Effect.fail(new Error("couldn't get image url"));
            }
            return imageUrl;
          }),

        compressImageLocally: (
          input: File | Blob | string,
          quality: number = 0.8,
        ) =>
          Effect.gen(function*() {
            // Convert input to ImageData
            const imageSource: ImageBitmapSource = yield* Effect.if(
              typeof input === "string",
              {
                onTrue: () =>
                  Effect.promise(() => fetch(input as string)).pipe(
                    Effect.andThen((res) => res.blob()),
                    Effect.catchAll(() =>
                      Effect.fail(
                        new Error("Error while converting base64 to blobl"),
                      ),
                    ),
                  ),
                onFalse: () => Effect.succeed(input as File | Blob),
              },
            );

            // Calculate original size in KB
            const originalSizeKb =
              imageSource instanceof Blob
                ? imageSource.size / 1024
                : ((input as string).length * 0.75) / 1024; // Approximate base64 size

            const bitmap = yield* Effect.promise(() =>
              createImageBitmap(imageSource),
            );
            const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
            const ctx = canvas.getContext("2d");
            if (!ctx) {
              return yield* Effect.fail(Error("Failed to get canvas context"));
            }
            ctx.drawImage(bitmap, 0, 0);
            const imageData = ctx.getImageData(
              0,
              0,
              bitmap.width,
              bitmap.height,
            );

            bitmap.close();

            // Encode ImageData to AVIF format
            const avifBuffer = yield* Effect.tryPromise({
              try: () =>
                avifEncode(imageData, { quality: Math.round(quality * 100) }),
              catch: (error) => new Error(`Failed to encode AVIF: ${error}`),
            });

            // Create Blob and File from encoded buffer
            const avifBlob = new Blob([avifBuffer], { type: "image/avif" });
            const avifFile = new File([avifBlob], "compressed.avif", {
              type: "image/avif",
            });

            // Optimized base64 conversion using direct buffer manipulation
            const base64Result = yield* Effect.sync(() => {
              const uint8Array = new Uint8Array(avifBuffer);
              let binary = "";
              const chunkSize = 8192; // Process in chunks for better performance

              for (let i = 0; i < uint8Array.length; i += chunkSize) {
                const chunk = uint8Array.subarray(i, i + chunkSize);
                binary += String.fromCharCode(...chunk);
              }

              return `data:image/avif;base64,${btoa(binary)}`;
            });

            // Calculate compressed size in KB
            const compressedSizeKb = avifBuffer.byteLength / 1024;

            // Calculate compression ratio (decimal format)
            const compressionRatio =
              originalSizeKb > 0
                ? (originalSizeKb - compressedSizeKb) / originalSizeKb
                : 0;

            return {
              base64: base64Result,
              file: avifFile,
              originalSizeKb,
              compressedSizeKb,
              compressionRatio,
            };
          }),

        deleteLocalImage: (id: number) =>
          Effect.gen(function*() {
            return yield* localFiles.delete(id);
          }),

        deleteCloudImage: (url: string) =>
          Effect.gen(function*() {
            // This would need to be implemented based on your cloud storage provider
            // For now, this is a placeholder that would need actual implementation
            return yield* Effect.fail(
              new Error(
                "deleteCloudImage not implemented - requires cloud storage API",
              ),
            );
          }),
      };
    }),
  ).pipe(Layer.provide(LocalFiles.layer));
}
