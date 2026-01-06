import { useRef, useCallback, useMemo } from "react";
import { Label } from "@radix-ui/react-label";
import { useStore } from "@livestore/react";
import { Button } from "@/components/ui/button";
import { fileStorage } from "@/hooks/storage/indexeddb";
import { imageMetadataStorage } from "@/hooks/storage/image-metadata";
import { useUploadQueue } from "@/hooks/useUploadQueue";
import { events, productImages$, shopId$ } from "@/livestore/schema";
import { useFieldContext } from "@/hooks/form-context.tsx";
import ImageItem from "./image-item";
import type { ProductImage } from "@/livestore/schema/products/types";

type PropsType = {
  productId: string | null;
  label?: string;
} & React.ComponentProps<"input">;

type ImageWithStatus = ProductImage & {
  status: "pending" | "uploading" | "uploaded" | "failed";
};

export default function ImageField({
  productId,
  label,
  className,
  type,
  ...props
}: PropsType) {
  const field = useFieldContext<ProductImage[]>();
  const { store } = useStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { uploadFile, retryUpload, deleteUpload, uploadStates } =
    useUploadQueue(productId);

  const dbImages = productId ? store.useQuery(productImages$(productId)) : null;
  const shopId = store.query(shopId$);

  const formImages = field.state.value || [];

  const allImages = useMemo((): ImageWithStatus[] => {
    const uploadStatesArray = Array.from(uploadStates.values());
    const uploadStateMap = new Map(uploadStatesArray.map((s) => [s.uuid, s]));

    const existingImages: ImageWithStatus[] = (dbImages ?? []).map((img) => ({
      id: img.id,
      shop_id: "",
      product_id: productId || "",
      url: img.url,
      localUrl: img.localUrl || img.url,
      order: img.order,
      hidden: img.hidden,
      createdAt: new Date(),
      deletedAt: null,
      status: "uploaded",
    }));

    const newImages: ImageWithStatus[] = formImages.map((img) => {
      const uploadState = uploadStateMap.get(img.id);
      return {
        ...img,
        status: uploadState?.status || "pending",
      };
    });

    return [...newImages, ...existingImages].sort((a, b) => a.order - b.order);
  }, [formImages, dbImages, productId, uploadStates]);

  const calculateNextOrder = useCallback((): number => {
    const maxOrder = Math.max(0, ...allImages.map((img) => img.order));
    return maxOrder + 1;
  }, [allImages]);

  const handleFileSelect = useCallback(
    async (files: FileList | null) => {
      if (!files?.length) return;

      const nextOrder = calculateNextOrder();
      const newImages: ProductImage[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (!file.type.startsWith("image/")) continue;

        const id = crypto.randomUUID();
        const order = nextOrder + i;
        const localUrl = URL.createObjectURL(file);

        await fileStorage.save({
          uuid: id,
          name: file.name,
          type: file.type,
          size: file.size,
          blob: file,
          productId: null,
          order,
          status: "pending",
          retryCount: 0,
          createdAt: Date.now(),
        });

        await imageMetadataStorage.save({
          id,
          url: "",
          status: "pending",
          retryCount: 0,
        });

        await uploadFile(id, file, order);

        newImages.push({
          id,
          shop_id: shopId,
          product_id: "",
          url: "",
          localUrl,
          order,
          hidden: 0,
          createdAt: new Date(),
          deletedAt: null,
        });
      }

      field.setValue((prev) => [...(prev || []), ...newImages]);
    },
    [store, calculateNextOrder, productId, uploadFile, shopId, field],
  );

  const handleClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleReorder = useCallback(
    (image: ProductImage, direction: "up" | "down") => {
      field.setValue((prev) => {
        const sorted = [...(prev || [])].sort((a, b) => a.order - b.order);
        const idx = sorted.findIndex((img) => img.id === image.id);

        if (idx === -1) return prev;

        if (direction === "up" && idx > 0) {
          [sorted[idx - 1], sorted[idx]] = [sorted[idx], sorted[idx - 1]];
        } else if (direction === "down" && idx < sorted.length - 1) {
          [sorted[idx], sorted[idx + 1]] = [sorted[idx + 1], sorted[idx]];
        }

        return sorted.map((img, i) => ({
          ...img,
          order: i + 1,
        }));
      });
    },
    [field],
  );

  const handleDelete = useCallback(
    async (image: ProductImage) => {
      await deleteUpload(image.id);
      await fileStorage.delete(image.id);
      await imageMetadataStorage.delete(image.id);

      field.setValue(
        (prev) => prev?.filter((img) => img.id !== image.id) || [],
      );
    },
    [store, deleteUpload, field],
  );

  const handleHide = useCallback(
    (image: ProductImage) => {
      store.commit(
        events.productImagePartialUpdated({
          id: image.id,
          hidden: image.hidden ? 0 : 1,
        }),
      );
    },
    [store],
  );

  const handleRetry = useCallback(
    async (image: ImageWithStatus) => {
      if (image.status === "failed") {
        await retryUpload(image.id);
      }
    },
    [retryUpload],
  );

  return (
    <div className="grid gap-2">
      {label && <Label className="font-semibold">{label}</Label>}
      <input
        className="hidden"
        ref={fileInputRef}
        accept="image/*"
        type="file"
        multiple
        onChange={(event) => handleFileSelect(event.target.files)}
        {...props}
      />

      {allImages.length === 0 ? (
        <div className="border border-black/30 rounded-[12px] border-dashed flex items-center justify-center h-30">
          <Button
            type="button"
            className="bg-transparent text-[14px] text-primary border-primary/30 border hover:bg-transparent"
            onClick={handleClick}
          >
            Ajouter des photos
          </Button>
        </div>
      ) : (
        <div className="flex flex-col gap-3 border border-neutral-300 rounded-[15px] p-3">
          <div className="flex flex-col gap-3">
            {allImages.map((image, index) => (
              <ImageItem
                key={image.id}
                index={index}
                image={image}
                status={image.status}
                onRetry={() => handleRetry(image)}
                onDelete={() => handleDelete(image)}
                onHide={() => handleHide(image)}
                onReorderUp={() => handleReorder(image, "up")}
                onReorderDown={() => handleReorder(image, "down")}
              />
            ))}
          </div>
          <div>
            <Button
              type="button"
              onClick={handleClick}
              className="w-[200px] border-priamry/15 py-4 text-[14px] rounded-xl border-1  bg-primary/10 text-primary hover:bg-primary/10 shadow-none"
            >
              Ajouter plus de photos
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
