import { generateUploadUrl, getImageUrl } from "@/lib/actions/convex-uploads";
import { Context, Layer, Effect } from "effect";
import { LocalFiles } from "@/lib/services/files-service";
import avifEncode, { init as initAvifEncode } from "@jsquash/avif/encode";
import { init as initAvifDecode } from "@jsquash/avif/decode";
import { getWorkerPool, CompressionResponse } from "@/lib/worker-pool";
import { Id } from "api/data-model";

function getPool() {
  return getWorkerPool();
}

/**
 * Images service context tag for dependency injection.
 * Provides image-related operations including local storage, cloud uploads,
 * compression, and deletion capabilities.
 */
export class Images extends Context.Tag("Images")<
  Images,
  {
    readonly saveImageLocally: (image: string | File) => Effect.Effect<number, Error, never>;
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
    readonly fileToBase64: (file: File) => Effect.Effect<string, Error, never>;
    readonly compressImageWithWorker: (
      file: File,
      id: string,
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
  }
>() {
  /**
   * Creates the effect layer for the Images service.
   * Initializes AVIF encoder/decoder WASM modules and provides LocalFiles dependency.
   */
  static readonly layer = Layer.effect(
    Images,
    Effect.gen(function*() {
      // Access the LocalFiles service for local storage operations
      const localFiles = yield* LocalFiles;

      // Initialize worker pool for parallel image compression
      getWorkerPool();

      // Initialize AVIF encoder/decoder with custom WASM file location
      // WASM files must be served from /wasm/ directory in public assets
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
        // Delegates to LocalFiles service to store image data in IndexedDB
        saveImageLocally: (file) => localFiles.write(file),
        fileToBase64: (file: File) =>
          Effect.async<string, Error, never>((resume) => {
            const reader = new FileReader();
            reader.onload = () =>
              resume(Effect.succeed(reader.result as string));
            reader.onerror = () =>
              resume(Effect.fail(new Error("turning image to base64 failed")));
            reader.readAsDataURL(file);
          }),
        // Uploads a File to Convex cloud storage:
        // 1. Gets a pre-signed upload URL from Convex
        // 2. POSTs the file to that URL
        // 3. Retrieves the public image URL using the storage ID
        uploadImageToCloud: (file: File) =>
          Effect.gen(function*() {
            // Step 1: Get pre-signed upload URL from Convex backend
            const uploadUrl = yield* Effect.promise(() => generateUploadUrl());
            // Step 2: Upload the file to the storage service
            const storageId: string = yield* Effect.promise(() =>
              fetch(uploadUrl, {
                method: "POST",
                headers: { "Content-Type": file.type },
                body: file,
              }),
            ).pipe(
              // Step 3: Parse the response to extract storage ID
              Effect.andThen((value) => value.json()),
              Effect.andThen(
                (result: { storageId: string }) => result.storageId,
              ),
            );

            // Step 4: Convert storage ID to public accessible URL
            const imageUrl = yield* Effect.promise(() => getImageUrl(storageId as Id<'_storage'>));
            if (!imageUrl) {
              return yield* Effect.fail(new Error("couldn't get image url"));
            }
            return imageUrl;
          }),

        // Compresses an image using AVIF format:
        // Accepts File, Blob, or URL string as input
        // Returns base64 string, File object, and compression statistics
        compressImageLocally: (
          input: File | Blob | string,
          quality: number = 0.8,
        ) =>
          Effect.gen(function*() {
            // Convert input to a Blob for processing
            // If input is a URL string, fetch it first; otherwise use directly
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
            // For Blobs, use size property; for base64 strings, estimate using 0.75 multiplier
            const originalSizeKb =
              imageSource instanceof Blob
                ? imageSource.size / 1024
                : ((input as string).length * 0.75) / 1024;

            // Create an ImageBitmap from the source for efficient rendering
            const bitmap = yield* Effect.promise(() =>
              createImageBitmap(imageSource),
            );
            // Use OffscreenCanvas for performant client-side image manipulation
            const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
            const ctx = canvas.getContext("2d");
            if (!ctx) {
              return yield* Effect.fail(Error("Failed to get canvas context"));
            }
            // Draw the bitmap to canvas and extract pixel data
            ctx.drawImage(bitmap, 0, 0);
            const imageData = ctx.getImageData(
              0,
              0,
              bitmap.width,
              bitmap.height,
            );

            // Free bitmap memory after extracting image data
            bitmap.close();

            // Encode the image data to AVIF format using jSquash WASM encoder
            // Quality is scaled from 0-1 to 0-100
            const avifBuffer = yield* Effect.tryPromise({
              try: () =>
                avifEncode(imageData, { quality: Math.round(quality * 100) }),
              catch: (error) => new Error(`Failed to encode AVIF: ${error}`),
            });

            // Wrap the encoded buffer in a Blob and File for consistent API
            const avifBlob = new Blob([avifBuffer], { type: "image/avif" });
            const avifFile = new File([avifBlob], "compressed.avif", {
              type: "image/avif",
            });

            // Convert AVIF buffer to base64 data URL for easy transmission
            // Uses chunked processing to handle large files efficiently
            const base64Result = yield* Effect.sync(() => {
              const uint8Array = new Uint8Array(avifBuffer);
              let binary = "";
              const chunkSize = 8192;

              for (let i = 0; i < uint8Array.length; i += chunkSize) {
                const chunk = uint8Array.subarray(i, i + chunkSize);
                binary += String.fromCharCode(...chunk);
              }

              return `data:image/avif;base64,${btoa(binary)}`;
            });

            // Calculate compression metrics
            const compressedSizeKb = avifBuffer.byteLength / 1024;
            // Compression ratio as decimal (e.g., 0.7 means 70% size reduction)
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

        // Compresses an image using a Web Worker for parallel processing
        compressImageWithWorker: (
          file: File,
          id: string,
          quality: number = 0.8,
        ) =>
          Effect.gen(function*() {
            const workerPool = getPool();

            const result: CompressionResponse = yield* Effect.tryPromise({
              try: () => workerPool.compress(id, file, quality),
              catch: (error) =>
                new Error(
                  `Worker compression failed: ${error instanceof Error ? error.message : "Unknown error"}`,
                ),
            });

            return result;
          }),

        // Deletes an image from local IndexedDB storage using its numeric ID
        deleteLocalImage: (id: number) =>
          Effect.gen(function*() {
            return yield* localFiles.delete(id);
          }),

        // Placeholder for cloud image deletion - requires implementation
        // Would need to integrate with the specific cloud storage provider's API
        deleteCloudImage: (url: string) =>
          Effect.gen(function*() {
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
