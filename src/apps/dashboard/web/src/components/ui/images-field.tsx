import { useStore } from "@tanstack/react-form";
import { useFieldContext } from "@/hooks/form-context.tsx";
import { Label } from "@radix-ui/react-label";
import { useRef, useState } from "react";

import { type Id } from "api/data-model";
import { Button } from "./button";
import { Skeleton } from "./skeleton";
import { useMutation } from "convex/react";
import { useMutation as useTanstackMutation } from "@tanstack/react-query";
import { useInitiateProduct, useNavigateToProduct } from "@/hooks/products";
import { api } from "api/convex";

type PropsType = {
  productId: string;
  label?: string;
} & React.ComponentProps<"input">;

type Image = {
  storageId: string;
  order: number;
  url?: string;
  hidden?: boolean;
  __uploading?: boolean;
};

export default function ImageField({
  productId,
  label,
  className,
  type,
  ...props
}: PropsType) {
  const imagesInputRef = useRef<HTMLInputElement>(null);
  const field = useFieldContext<Image[]>();

  const errors = useStore(field.store, (state) => state.meta.errors);
  const [isUploading, setIsUploading] = useState(false);
  const [images, setImages] = useState<Record<string,
    {
      order: number,
      status: "pending" | "uploading" | "uploaded" | "error";
      url?: string
    }>>({});

  const initiateProduct = useInitiateProduct();
  const navigateToProduct = useNavigateToProduct();
  const convexSiteUrl = (import.meta as any).env.VITE_CONVEX_URL as string;

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
  //
  function fingerprint(file: File): string {
    return `${file.name}-${file.size}-${file.lastModified}`;
  }
  function getHighestOrder() {
    let highestOrder = 1
    for (let img in images) {
      if (images[img].order > highestOrder) {
        highestOrder = images[img].order
      }
    }
    return highestOrder
  }
  const generateUploadUrl = useMutation(api.storage.generateUploadUrl)
  const sendImage = useMutation(api.products.sendImage)

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
      postUrl: string,
      fp: string,
      order: number,
    }) => {
      const { file, order, fp, postUrl } = args;
      const res = await fetch(postUrl, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      })
      if (!res.ok) throw new Error("Upload failed");
      const { storageId } = await res.json();
      return { storageId, fp, order };
    },
  });
  async function handleInputChange(files: FileList | null) {
    const uploadImagePromises: Promise<
      { storageId: Id<'_storage'>, fp: string, order: number }>[] = []
    for (let i in files) {
      const fp = fingerprint(files[i])
      if (files[i].type && !images[fp]) {
        // add file to state
        const order = getHighestOrder()
        setImages(prev => ({
          ...prev, [fp]: {
            status: "pending",
            url: "",
            order
          }
        }))
        const postUrl = await generateUploadUrl()
        uploadImagePromises.push(
          uploadMutation.mutateAsync(
            { fp, order, postUrl, file: files[i] })
        )
      }
    }
    const results = await Promise.all(uploadImagePromises)
    const sendImagePromises: Promise<{ url: string | null }>[] = []
    results.forEach(r => {
      sendImagePromises.push(
        sendImage({
          storageId: r.storageId,
          hidden: false,
          productId: productId as Id<'products'>,
          order: r.order,
        })
      )
    })
    const urlResults = await Promise.all(sendImagePromises)
    for (let i = 0; i < results.length; i++) {
      const url = urlResults[i].url ? urlResults[i].url : " "
      const fp = results[i].fp
      if (url) setImages(prev => {
        return {
          ...prev,
          [fp]: {
            ...prev[fp],
            url,
            status: "uploaded"
          }
        }
      })
    }
  }

  console.log("all images : ", images)
  // navigateToProduct(ensuredProductId);
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

      {Object.keys(images).length === 0 ? (
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
        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap flex-col gap-3">
            {Object.values(images).map((value) =>
              <div key={value.url}>
                <p className="text-sm font-italic">{value.status}</p>
              </div>)}
          </div>
          <div>
            <Button type="button" onClick={handleClick}>
              Add other photos
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
