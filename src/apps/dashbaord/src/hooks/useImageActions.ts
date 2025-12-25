import { useCallback } from "react";
import { type Id } from "@repo/backend/_generated/dataModel";

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

// function normalizeForServer(images: ImagesRecord) {
//   // Include any image that has a storageId (regardless of local status),
//   // otherwise it would be dropped from the server when we patch.
//   return Object.values(images)
//     .filter((img) => !!img.storageId)
//     .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
//     .map((img) => ({
//       storageId: img.storageId as Id<"_storage">,
//       hidden: !!img.hidden,
//       order: img.order ?? 0,
//     }));
// }

function reindexSequential(images: ImagesRecord): ImagesRecord {
  const entries = Object.entries(images)
    .sort(([, a], [, b]) => a.order - b.order)
    .map(([key, img], i) => [key, { ...img, order: i + 1 }] as const);
  return Object.fromEntries(entries);
}

export function useImageActions(productId: any | null, field: FieldLike) {
  // const updateProduct = useMutation(api.products.updateProduct);
  // const persist = useCallback(
  //   async (images: ImagesRecord) => {
  //     await updateProduct({
  //       productId: productId as Id<"products">,
  //       images: normalizeForServer(images),
  //     });
  //   },
  //   [productId, updateProduct]
  // );

  const deleteImage = useCallback(
    (key: string) => {
      field.setValue((prev) => {
        const { [key]: _, ...rest } = prev;
        return reindexSequential(rest);
      });
    },
    [field]
  );

  const hideImage = useCallback(
    (key: string) => {
      field.setValue((prev) => {
        return {
          ...prev,
          [key]: { ...prev[key], hidden: !prev[key].hidden },
        };
      });
    },
    [field]
  );

  const imageUp = useCallback(
    (key: string) => {
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
        const result = reindexSequential(Object.fromEntries(sorted));
        // console.log('result from re-ordering ,', result)
        return result
      });
    },
    [field]
  );

  const imageDown = useCallback(
    (key: string) => {
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
        return reindexSequential(Object.fromEntries(sorted));
      });
    },
    [field]
  );

  return { deleteImage, hideImage, imageUp, imageDown } as const;
}
