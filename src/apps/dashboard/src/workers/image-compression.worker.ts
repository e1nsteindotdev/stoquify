import avifEncode, { init as initAvifEncode } from "@jsquash/avif/encode";

let initialized = false;

async function ensureInitialized() {
  if (!initialized) {
    await initAvifEncode({
      locateFile: (path: string) => `/wasm/${path}`,
    });
    initialized = true;
  }
}

interface CompressionRequest {
  id: string;
  file: File;
  quality: number;
}

interface CompressionResponse {
  id: string;
  base64: string;
  file: File;
  originalSizeKb: number;
  compressedSizeKb: number;
  compressionRatio: number;
}

interface ErrorResponse {
  id: string;
  error: string;
}

async function compressImage(
  id: string,
  file: File,
  quality: number,
): Promise<CompressionResponse> {
  await ensureInitialized();

  const originalSizeKb = file.size / 1024;

  const bitmap = await createImageBitmap(file);
  const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    throw new Error("Failed to get canvas context");
  }

  ctx.drawImage(bitmap, 0, 0);
  const imageData = ctx.getImageData(0, 0, bitmap.width, bitmap.height);
  bitmap.close();

  const avifBuffer = await avifEncode(imageData, {
    speed: 10,
    quality: Math.round(quality * 100),
  });

  const avifBlob = new Blob([avifBuffer], { type: "image/avif" });
  const avifFile = new File([avifBlob], "compressed.avif", {
    type: "image/avif",
  });

  const compressedSizeKb = avifBuffer.byteLength / 1024;
  const compressionRatio =
    originalSizeKb > 0
      ? (originalSizeKb - compressedSizeKb) / originalSizeKb
      : 0;

  const uint8Array = new Uint8Array(avifBuffer);
  let binary = "";
  const chunkSize = 8192;

  for (let i = 0; i < uint8Array.length; i += chunkSize) {
    const chunk = uint8Array.subarray(i, i + chunkSize);
    binary += String.fromCharCode(...chunk);
  }

  const base64 = `data:image/avif;base64,${btoa(binary)}`;

  return {
    id,
    base64,
    file: avifFile,
    originalSizeKb,
    compressedSizeKb,
    compressionRatio,
  };
}

self.onmessage = async (event: MessageEvent<CompressionRequest>) => {
  const { id, file, quality } = event.data;

  try {
    const result = await compressImage(id, file, quality);
    self.postMessage({ type: "success", data: result });
  } catch (error) {
    const errorResponse: ErrorResponse = {
      id,
      error: error instanceof Error ? error.message : "Unknown error",
    };
    self.postMessage({ type: "error", data: errorResponse });
  }
};
