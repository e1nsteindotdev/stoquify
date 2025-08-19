import { useCallback } from "react";
import { useMutation } from "convex/react";
import { api } from "api/convex";
import { type Id } from "api/data-model";

export type LocalImage = {
  order: number;
  url?: string;
  hidden?: boolean;
  status: "uploading" | "uploaded" | "error";
  storageId?: Id<"_storage">;
};

type ImagesRecord = Record<string, LocalImage>;

type FieldLike = {
  state: { value: ImagesRecord };
  setValue: (updater: (prev: ImagesRecord) => ImagesRecord) => void;
};

function normalizeForServer(images: ImagesRecord) {
  // Include any image that has a storageId (regardless of local status),
  // otherwise it would be dropped from the server when we patch.
  return Object.values(images)
    .filter((img) => !!img.storageId)
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
    .map((img) => ({
      storageId: img.storageId as Id<"_storage">,
      hidden: !!img.hidden,
      order: img.order ?? 0,
    }));
}

function reindexSequential(images: ImagesRecord): ImagesRecord {
  const entries = Object.entries(images)
    .sort(([, a], [, b]) => a.order - b.order)
    .map(([key, img], i) => [key, { ...img, order: i + 1 }] as const);
  return Object.fromEntries(entries);
}

export function useImageActions(
  productId: Id<"products"> | null,
  field: FieldLike
) {

  const updateProduct = useMutation(api.products.updateProduct);
  const persist = useCallback(
    async (images: ImagesRecord) => {
      await updateProduct({
        id: productId as Id<"products">,
        images: normalizeForServer(images),
      });
    },
    [productId, updateProduct]
  );

  const deleteImage = useCallback(
    async (key: string) => {
      let nextImages: ImagesRecord = {};
      field.setValue((prev) => {
        const { [key]: _, ...rest } = prev;
        nextImages = reindexSequential(rest);
        return nextImages;
      });
      await persist(nextImages);
    },

    [field, persist]
  );

  const hideImage = useCallback(
    async (key: string) => {
      let nextImages: ImagesRecord = {};
      field.setValue((prev) => {
        nextImages = {
          ...prev,
          [key]: { ...prev[key], hidden: !prev[key].hidden },
        };
        return nextImages;
      });
      await persist(nextImages);
    },
    [field, persist]
  );

  const imageUp = useCallback(
    async (key: string) => {
      let nextImages: ImagesRecord = {};
      field.setValue((prev) => {
        const sorted = Object.entries(prev).sort(
          ([, a], [, b]) => a.order - b.order
        );
        const idx = sorted.findIndex(([k]) => k === key);
        if (idx > 0) {
          const [prevKey, prevImg] = sorted[idx - 1];
          const [curKey, curImg] = sorted[idx];
          const a: LocalImage = { ...prevImg, order: prevImg.order + 1 };
          const b: LocalImage = { ...curImg, order: curImg.order - 1 };
          sorted[idx - 1] = [prevKey, a];
          sorted[idx] = [curKey, b];
        }
        nextImages = reindexSequential(Object.fromEntries(sorted));
        return nextImages;
      });
      await persist(nextImages);
    },
    [field, persist]
  );

  const imageDown = useCallback(
    async (key: string) => {
      let nextImages: ImagesRecord = {};
      field.setValue((prev) => {
        const sorted = Object.entries(prev).sort(
          ([, a], [, b]) => a.order - b.order
        );
        const idx = sorted.findIndex(([k]) => k === key);
        if (idx >= 0 && idx < sorted.length - 1) {
          const [curKey, curImg] = sorted[idx];
          const [nextKey, nextImg] = sorted[idx + 1];
          const a: LocalImage = { ...curImg, order: curImg.order + 1 };
          const b: LocalImage = { ...nextImg, order: nextImg.order - 1 };
          sorted[idx] = [curKey, a];
          sorted[idx + 1] = [nextKey, b];
        }
        nextImages = reindexSequential(Object.fromEntries(sorted));
        return nextImages;
      });
      await persist(nextImages);
    },
    [field, persist]
  );

  return { deleteImage, hideImage, imageUp, imageDown } as const;
}
