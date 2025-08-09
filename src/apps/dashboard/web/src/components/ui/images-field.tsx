import { useStore } from "@tanstack/react-form";
import { useFieldContext } from "@/hooks/form-context.tsx";
import { Label } from "@radix-ui/react-label";
import { useRef, useState } from "react";

import { type Id } from "api/data-model";
import { Button } from "./button";
import { Skeleton } from "./skeleton";
import { useMutation } from "convex/react";
import { useMutation as useTanstackMutation } from "@tanstack/react-query";
import { api } from "api/convex";
import ImageItem from "./image-item";
import { useImageActions } from "@/hooks/useImageActions";
import { useInitiateProduct, useNavigateToProduct } from "@/hooks/products";

type PropsType = {
  productId: string;
  label?: string;
} & React.ComponentProps<"input">;

type Image = {
  order: number;
  url?: string;
  hidden?: boolean;
  status: "uploaded" | "uploading" | "error";
  storageId?: Id<"_storage">;
};
type ImagesMap = Map<string, Image>;

export default function ImageField({
  productId,
  label,
  className,
  type,
  ...props
}: PropsType) {
  const imagesInputRef = useRef<HTMLInputElement>(null);
  const field = useFieldContext<ImagesMap>();
  const [currentProductId, setCurrentProductId] = useState<string>(productId);

  const errors = useStore(field.store, (state) => state.meta.errors);
  const [images, setImages] = useState<
    Record<
      string,
      {
        order: number;
        status: "uploading" | "uploaded" | "error";
        url?: string;
      }
    >
  >({});

  // const convexSiteUrl = (import.meta as any).env.VITE_CONVEX_URL as string;
  const initiateProduct = useInitiateProduct();
  const navigateToProduct = useNavigateToProduct();

  function handleClick() {
    imagesInputRef?.current?.click();
  }

  // const uploadMutation = useMutation({
  //   mutationKey: ["upload-image"],
  //   mutationFn: async (args: {
  //     file: File;
  //     order: number;
  //     productId: string;
  //   }) => {
  //     const { file, order, productId } = args;
  //     const sendImageUrl = new URL(`${convexSiteUrl}/sendImage`);
  //     sendImageUrl.searchParams.set("productId", productId);
  //     sendImageUrl.searchParams.set("order", String(order));
  //     // Hidden is optional at the API, defaults false if not provided
  //     const res = await fetch(sendImageUrl, {
  //       method: "POST",
  //       headers: { "Content-Type": file.type },
  //       body: file,
  //     });
  //     if (!res.ok) throw new Error("Upload failed");
  //     const data = await res.json();
  //     return data as { url: string };
  //   },
  // });
  function fingerprint(file: File): string {
    return `${file.name}-${file.size}-${file.lastModified}`;
  }

  const generateUploadUrl = useMutation(api.storage.generateUploadUrl);
  const sendImage = useMutation(api.products.sendImage);

  // const uploadMutation = useMutation({
  //   mutationKey: ["upload-image"],
  //   mutationFn: async (args: {
  //     file: File;
  //     order: number;
  //     productId: string;
  //     fp: string,
  //   }) => {
  //     const { fp, file, order, productId } = args;
  //     const sendImageUrl = new URL(`${convexSiteUrl}/sendImage`);
  //     sendImageUrl.searchParams.set("productId", productId);
  //     sendImageUrl.searchParams.set("order", String(order));
  //     // Hidden is optional at the API, defaults false if not provided
  //     const res = await fetch(sendImageUrl, {
  //       method: "POST",
  //       headers: { "Content-Type": file.type },
  //       body: file,
  //     });
  //     if (!res.ok) throw new Error("Upload failed");
  //     const data: { url: string } = await res.json();
  //     return { url: data.url, fp }
  //   },
  // });
  //
  //
  const uploadMutation = useTanstackMutation({
    mutationKey: ["upload-image"],
    mutationFn: async (args: {
      file: File;
      postUrl: string;
      fp: string;
      order: number;
    }) => {
      const { file, order, fp, postUrl } = args;
      const res = await fetch(postUrl, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });
      if (!res.ok) throw new Error("Upload failed");
      const { storageId } = await res.json();
      return { storageId, fp, order };
    },
  });

  async function handleInputChange(files: FileList | null) {
    if (!files || files.length === 0) return;

    // Ensure we have a product id before uploading anything
    let ensuredProductId = currentProductId;
    let createdNew = false;
    if (!ensuredProductId || ensuredProductId.trim() === "") {
      ensuredProductId = await initiateProduct();
      setCurrentProductId(ensuredProductId);
      createdNew = true;
    }

    const list = Array.from(files);
    const existingValues = Object.values(
      (field.state.value as any) ?? {}
    ) as Image[];
    const baseOrder = existingValues.length
      ? Math.max(...existingValues.map((i) => i.order ?? 0))
      : 0;

    const uploadTasks: Promise<{
      storageId: Id<"_storage">;
      fp: string;
      order: number;
    }>[] = [];

    list.forEach((file, idx) => {
      const fp = fingerprint(file);
      if (!file.type || images[fp]) return;

      const order = baseOrder + 1 + idx;
      field.setValue((prev) => ({
        ...prev,
        [fp]: {
          status: "uploading",
          url: "",
          order,
        },
      }));

      const task = (async () => {
        const postUrl = await generateUploadUrl();
        const res = await uploadMutation.mutateAsync({
          fp,
          order,
          postUrl,
          file,
        });
        return res;
      })();
      uploadTasks.push(task);
    });

    const results = await Promise.all(uploadTasks);

    const sendTasks: Promise<{ url: string | null }>[] = results.map((r) =>
      sendImage({
        storageId: r.storageId,
        hidden: false,
        productId: ensuredProductId as unknown as Id<"products">,
        order: r.order,
      })
    );

    const urlResults = await Promise.all(sendTasks);
    for (let i = 0; i < results.length; i++) {
      const url = urlResults[i].url ?? "";
      const fp = results[i].fp;
      if (url) {
        field.setValue((prev) => ({
          ...prev,
          [fp]: {
            order: prev[fp]?.order ?? results[i].order,
            url,
            status: "uploaded",
            storageId: results[i].storageId,
          },
        }));
      }
    }

    // Ensure all images have a consistent sequential order to prevent accidental drops
    field.setValue((prev) => {
      const entries = Object.entries(prev)
        .sort(([, a], [, b]) => (a.order ?? 0) - (b.order ?? 0))
        .map(([k, v], i) => [k, { ...v, order: i + 1 }] as const);
      return Object.fromEntries(entries) as any;
    });

    if (createdNew && ensuredProductId) {
      navigateToProduct(ensuredProductId);
    }
  }

  const imagesEntries = Object.entries(
    field.state.value as unknown as Record<string, Image>
  ).sort(([, a], [, b]) => (a.order ?? 0) - (b.order ?? 0));
  const imagesList = imagesEntries.map(([, v]) => v);

  // navigateToProduct(ensuredProductId);
  //
  const { deleteImage, hideImage, imageUp, imageDown } = useImageActions(
    currentProductId,
    field as any
  );

  return (
    <div className="grid gap-2">
      {label && <Label className="font-semibold">{label}</Label>}
      <input
        className="hidden"
        ref={imagesInputRef}
        accept="image/*"
        type="file"
        multiple
        onChange={(event) => handleInputChange(event.target.files)}
        {...props}
      />

      {imagesList.length === 0 ? (
        <div className="border-1 border-black/30 rounded-[12px] border-dashed flex items-center justify-center h-[120px]">
          <Button
            type="button"
            className="bg-transparent text-[14px] text-[#6A4FFF] border-[#6A4FFF]/30 border-1 hover:bg-transparent"
            onClick={handleClick}
          >
            Add Photos
          </Button>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-3">
            {imagesEntries.map(([key, value], index) => (
              <ImageItem
                key={key}
                imageKey={key}
                index={index}
                value={value}
                onDelete={deleteImage}
                onHide={hideImage}
                onUp={imageUp}
                onDown={imageDown}
              />
            ))}
          </div>
          <div>
            <Button
              type="button"
              onClick={handleClick}
              className="w-[200px] border-[#6A4FFF]/15 py-4 text-[14px] rounded-xl border-1  bg-[#6A4FFF]/10 text-[#6A4FFF] hover:bg-[#6A4FFF]/10 shadow-none"
            >
              Ajouter plus de photos
            </Button>
          </div>
        </div>
      )}

      {errors.map((error: string) => (
        <div key={error} style={{ color: "red" }}>
          {error}
        </div>
      ))}
    </div>
  );
}
