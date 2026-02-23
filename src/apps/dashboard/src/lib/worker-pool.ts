import { Effect } from "effect";

type CompressionResponse = {
  id: string;
  base64: string;
  file: File;
  originalSizeKb: number;
  compressedSizeKb: number;
  compressionRatio: number;
};

type WorkerMessage =
  | { type: "success"; data: CompressionResponse }
  | { type: "error"; data: { id: string; error: string } };

class ImageWorker {
  private worker: Worker;
  private workerIndex: number;
  private pending = new Map<
    string,
    {
      resolve: (value: CompressionResponse) => void;
      reject: (reason: Error) => void;
    }
  >();

  constructor(worker: Worker, workerIndex: number) {
    this.worker = worker;
    this.workerIndex = workerIndex;
    this.worker.onmessage = (event: MessageEvent<WorkerMessage>) => {
      const { type, data } = event.data;
      if (type === "success") {
        const pending = this.pending.get(data.id);
        if (pending) {
          pending.resolve(data as CompressionResponse);
          this.pending.delete(data.id);
        }
      } else if (type === "error") {
        const pending = this.pending.get(data.id);
        if (pending) {
          pending.reject(new Error(data.error));
          this.pending.delete(data.id);
        }
      }
    };
  }

  compress(
    id: string,
    file: File,
    quality: number,
  ): Promise<CompressionResponse> {
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.worker.postMessage({
        id,
        file,
        quality,
      });
    });
  }

  terminate() {
    this.worker.terminate();
  }
}

function createWorker(workerIndex: number): ImageWorker {
  const worker = new Worker(
    new URL("../workers/image-compression.worker.ts", import.meta.url),
    { type: "module" },
  );
  return new ImageWorker(worker, workerIndex);
}

export interface ImageWorkerPool {
  compress: (
    id: string,
    file: File,
    quality: number,
  ) => Promise<CompressionResponse>;
}

let pool: ImageWorkerPool | null = null;

export function getWorkerPool(): ImageWorkerPool {
  if (!pool) {
    const workers: ImageWorker[] = [];
    let currentIndex = 0;
    const size = 4;

    for (let i = 0; i < size; i++) {
      workers.push(createWorker(i));
    }

    pool = {
      compress: (id: string, file: File, quality: number) => {
        const worker = workers[currentIndex % size];
        currentIndex++;
        return worker.compress(id, file, quality);
      },
    };
  }
  return pool;
}

export type { CompressionResponse };
