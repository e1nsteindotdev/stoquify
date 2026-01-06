import { useCallback, useEffect, useRef, useState } from "react";
import { fileStorage } from "@/hooks/storage/indexeddb";
import { imageMetadataStorage } from "@/hooks/storage/image-metadata";
import { type StoredFile } from "@/hooks/storage/mod";
import { generateUploadUrl, getImageUrl } from "@/actions/convex-uploads";
import { useStore } from "@livestore/react";
import { events, shopId$ } from "@/livestore/schema";

const MAX_RETRIES = 15;
const RETRY_INTERVAL_MS = 15_000;

export interface UploadState {
  uuid: string;
  status: StoredFile["status"];
  retryCount: number;
  error?: string;
  previewUrl?: string;
  fileName: string;
  order: number;
  url?: string;
}

export type UploadQueueCallbacks = {
  onUploadComplete?: (uuid: string, url: string) => void;
  onUploadError?: (uuid: string, error: string) => void;
};

export function useUploadQueue(
  productId: string | null,
  callbacks?: UploadQueueCallbacks,
) {
  const { store } = useStore();
  const retryTimeouts = useRef<Map<string, number>>(new Map());
  const [uploadStates, setUploadStates] = useState<Map<string, UploadState>>(
    new Map(),
  );

  const getShopId = useCallback(() => {
    return store.query(shopId$);
  }, [store]);

  const updateState = useCallback(
    (uuid: string, updates: Partial<UploadState>) => {
      setUploadStates((prev) => {
        const newMap = new Map(prev);
        const existing = newMap.get(uuid);
        if (existing) {
          newMap.set(uuid, { ...existing, ...updates });
        }
        return newMap;
      });
    },
    [],
  );

  const uploadFile = useCallback(
    async (
      uuid: string,
      file: File,
      order: number,
      existingPreviewUrl?: string,
    ): Promise<void> => {
      const previewUrl = existingPreviewUrl ?? URL.createObjectURL(file);

      updateState(uuid, {
        status: "uploading",
        retryCount: 0,
        previewUrl,
        fileName: file.name,
        order,
      });

      try {
        if (!navigator.onLine) {
          throw new Error("Offline");
        }

        const uploadUrl = await generateUploadUrl();

        const uploadRes = await fetch(uploadUrl, {
          method: "POST",
          headers: { "Content-Type": file.type },
          body: file,
        });

        if (!uploadRes.ok) {
          throw new Error(`Upload failed: ${uploadRes.statusText}`);
        }

        const { storageId } = await uploadRes.json();

        const shopId = getShopId();
        const imageUrl = await getImageUrl(storageId);
        if (!imageUrl) {
          throw new Error("Failed to get image URL");
        }

        await fileStorage.update(uuid, {
          status: "uploaded",
          productId,
        });

        await imageMetadataStorage.update(uuid, {
          url: imageUrl,
          status: "uploaded",
        });

        updateState(uuid, { status: "uploaded", url: imageUrl });

        callbacks?.onUploadComplete?.(uuid, imageUrl);
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";

        const currentState = uploadStates.get(uuid);
        const retryCount = (currentState?.retryCount ?? 0) + 1;

        if (retryCount >= MAX_RETRIES) {
          await fileStorage.update(uuid, {
            status: "failed",
            error: errorMessage,
            retryCount,
          });

          await imageMetadataStorage.update(uuid, {
            status: "failed",
            error: errorMessage,
            retryCount,
          });

          updateState(uuid, {
            status: "failed",
            retryCount,
            error: errorMessage,
          });

          callbacks?.onUploadError?.(uuid, errorMessage);

          const shopId = getShopId();
          store.commit(
            events.notificationInserted({
              id: crypto.randomUUID(),
              shop_id: shopId,
              type: "upload_failed",
              title: "Échec du téléversement",
              message: `Le fichier "${file.name}" n'a pas pu être téléversé après ${MAX_RETRIES} tentatives.`,
              data: JSON.stringify({
                fileName: file.name,
                error: errorMessage,
              }),
              read: 0,
              createdAt: new Date(),
              deletedAt: null,
            }),
          );
        } else {
          await fileStorage.update(uuid, {
            status: "pending",
            retryCount,
          });

          await imageMetadataStorage.update(uuid, {
            status: "pending",
            retryCount,
          });

          updateState(uuid, {
            status: "pending",
            retryCount,
          });

          const timeoutId = window.setTimeout(() => {
            retryTimeouts.current.delete(uuid);
            const stored = fileStorage.get(uuid);
            stored.then((file) => {
              if (file) {
                const blob = file.blob;
                const fileObj = new File([blob], file.name, {
                  type: file.type,
                });
                uploadFile(file.uuid, fileObj, file.order, previewUrl);
              }
            });
          }, RETRY_INTERVAL_MS);

          retryTimeouts.current.set(uuid, timeoutId);
        }
      }
    },
    [productId, store, getShopId, uploadStates, updateState, callbacks],
  );

  const retryUpload = useCallback(
    async (uuid: string): Promise<void> => {
      const file = await fileStorage.get(uuid);
      if (!file) {
        console.error(`File with uuid ${uuid} not found in storage`);
        return;
      }

      const timeoutId = retryTimeouts.current.get(uuid);
      if (timeoutId) {
        clearTimeout(timeoutId);
        retryTimeouts.current.delete(uuid);
      }

      const blob = file.blob;
      const fileObj = new File([blob], file.name, { type: file.type });
      await uploadFile(file.uuid, fileObj, file.order);
    },
    [uploadFile],
  );

  const retryAll = useCallback(async (): Promise<void> => {
    if (!navigator.onLine) {
      return;
    }

    const files = await fileStorage.getAll();
    const pendingOrFailed = files.filter(
      (f) => f.status === "pending" || f.status === "failed",
    );

    await Promise.all(pendingOrFailed.map((file) => retryUpload(file.uuid)));
  }, [retryUpload]);

  const cancelRetry = useCallback((uuid: string): void => {
    const timeoutId = retryTimeouts.current.get(uuid);
    if (timeoutId) {
      clearTimeout(timeoutId);
      retryTimeouts.current.delete(uuid);
    }
  }, []);

  const cancelAllRetries = useCallback((): void => {
    retryTimeouts.current.forEach((timeoutId) => clearTimeout(timeoutId));
    retryTimeouts.current.clear();
  }, []);

  const deleteUpload = useCallback(
    async (uuid: string): Promise<void> => {
      cancelRetry(uuid);
      await fileStorage.delete(uuid);
      await imageMetadataStorage.delete(uuid).catch(() => {});
      setUploadStates((prev) => {
        const newMap = new Map(prev);
        newMap.delete(uuid);
        return newMap;
      });
    },
    [cancelRetry],
  );

  useEffect(() => {
    const handleOnline = () => {
      if (navigator.onLine) {
        retryAll();
      }
    };

    window.addEventListener("online", handleOnline);
    return () => window.removeEventListener("online", handleOnline);
  }, [retryAll]);

  useEffect(() => {
    return () => {
      cancelAllRetries();
    };
  }, [cancelAllRetries]);

  return {
    uploadFile,
    retryUpload,
    retryAll,
    cancelRetry,
    cancelAllRetries,
    deleteUpload,
    uploadStates,
  };
}
