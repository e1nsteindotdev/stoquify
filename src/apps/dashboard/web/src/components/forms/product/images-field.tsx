import { useStore } from "@tanstack/react-form";
import { useFieldContext } from "@/hooks/form-context.tsx";
import { Label } from "@radix-ui/react-label";
import { useRef, useState } from "react";

import { type Id } from "api/data-model";
import { Button } from "@/components/ui/button";
import { useMutation } from "convex/react";
import { useMutation as useTanstackMutation } from "@tanstack/react-query";
import { api } from "api/convex";
import ImageItem from "./image-item";
import { useImageActions } from "@/hooks/useImageActions";
import { useGetImageUrl, useInitiateProduct, useNavigateToProduct } from "@/hooks/products";

type PropsType = {
  productId: Id<"products"> | null;
  label?: string;
} & React.ComponentProps<"input">;

export type Image = {
  order: number;
  url?: string;
  hidden?: boolean;
  status: "uploaded" | "uploading" | "error";
  storageId?: Id<"_storage">;
};

type ImagesMap = Map<string, Image>;

export default function ImageField({ productId, label, className, type, ...props }: PropsType) {

  const imagesInputRef = useRef<HTMLInputElement>(null);
  const field = useFieldContext<ImagesMap>();
  const [currentProductId, setCurrentProductId] = useState<Id<"products"> | null>(productId);

  const errors = useStore(field.store, (state) => state.meta.errors);
  const [images, setImages] = useState<Record<string, {
    order: number;
    status: "uploading" | "uploaded" | "error";
    url?: string;
  }>>({});

  const initiateProduct = useInitiateProduct();
  const navigateToProduct = useNavigateToProduct();
  const getImageUrl = useGetImageUrl()
  const generateUploadUrl = useMutation(api.images.generateUploadUrl);
  const sendImage = useMutation(api.products.sendImage);

  function handleClick() { imagesInputRef?.current?.click(); }

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
      const newProductId = await initiateProduct();
      if (!newProductId) {
        return
      }
      ensuredProductId = newProductId
      setCurrentProductId(ensuredProductId);
      createdNew = true;
    }

    const list = Array.from(files);

    //get exisitng images 
    const existingValues = Object.values(field.state.value ?? {}) as Image[];

    // get the base order
    const baseOrder = existingValues.length ? Math.max(...existingValues.map((i) => i.order ?? 0)) : 0;

    const uploadTasks: Promise<{ storageId: Id<"_storage">; fp: string; order: number; }>[] = [];

    // loop through all the uploaded images
    list.forEach((file, idx) => {
      const fp = fingerprint(file);
      if (!file.type || images[fp]) return;

      const order = baseOrder + 1 + idx;

      // add the image to form field
      field.setValue((prev) => ({ ...prev, [fp]: { status: "uploading", url: "", order } }));

      // prepare the task to upload the image to convex's generated postUrl and add it to the other tasks
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

    // fire all the tasks concurrently
    const results = await Promise.all(uploadTasks);

    // prepare the task to attach the image to it's respective product
    const sendTasks: Promise<string | null>[] = results.map(async (r) =>
      sendImage({
        storageId: r.storageId,
        productId: ensuredProductId as unknown as Id<"products">,
        order: r.order,
      })
    );

    // fire all the tasks concurrently and store the served images urls to show them to the user
    const urlResults = await Promise.all(sendTasks);

    for (let i = 0; i < urlResults.length; i++) {
      const url = urlResults[i] ?? "";
      const fp = results[i].fp;
      if (url) {
        // update the state in the form field (status becomes uploaded and we give the newly generated image url)
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

    // if a new product was initiated during this form event, we navigate to it
    if (createdNew && ensuredProductId) {
      navigateToProduct(ensuredProductId);
    }
  }

  // order images and get their url if it doesn't exists
  const imagesEntries = Object
    .entries(field.state.value as unknown as Record<string, Image>)
    .sort(([, a], [, b]) => (a.order ?? 0) - (b.order ?? 0));

  const imagesList: Promise<Image & { fp: string }>[] = imagesEntries.map(async ([fp, image]) => {
    if (!image.url && image.storageId) {
      const url = await getImageUrl(image.storageId) ?? ""
      return { ...image, url, fp }
    }
    return { ...image, fp }
  });

  const actions = useImageActions(currentProductId, field as any);

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

      {(imagesList.length === 0) ? (
        <div className="border-1 border-black/30 rounded-[12px] border-dashed flex items-center justify-center h-[120px]">
          <Button
            type="button"
            className="bg-transparent text-[14px] text-[#6A4FFF] border-[#6A4FFF]/30 border-1 hover:bg-transparent"
            onClick={handleClick}>
            Add Photos
          </Button>
        </div>
      ) : actions !== null && (
        <div className="flex flex-col gap-3 border border-neutral-300 rounded-[15px] p-3">
          <div className="flex flex-col gap-3">
            {imagesList.map((image, index) => (
              <ImageItem
                key={index}
                index={index}
                value={image}
                actions={actions}
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

function fingerprint(file: File): string {
  return `${file.name}-${file.size}-${file.lastModified}`;
}
