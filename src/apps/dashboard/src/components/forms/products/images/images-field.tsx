import { useRef, useCallback } from "react";
import { Label } from "@radix-ui/react-label";
import { useStore } from "@livestore/react";
import { Button } from "@/components/ui/button";
import { events, shopId$ } from "@/livestore/schema";
import { useFieldContext } from "@/hooks/form-context.tsx";
import ImageItem from "./image-item";
import type { ProductImage } from "@/livestore/schema/products/types";

type PropsType = {
  productId: string | null;
  oldImages: Array<{ id: string }> | null;
  label?: string;
} & React.ComponentProps<"input">;

export default function ImageField({
  productId,
  oldImages,
  label,
  className,
  type,
  ...props
}: PropsType) {
  const { store } = useStore();
  const shopId = store.query(shopId$);

  const field = useFieldContext<ProductImage[]>();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const images = field.state.value;

  const calculateNextOrder = (): number => {
    const maxOrder = Math.max(0, ...images.map((img) => img.displayOrder));
    return maxOrder + 1;
  };

  const handleFileSelect = useCallback(
    async (files: FileList | null) => {
      if (!files?.length) return;

      const nextOrder = calculateNextOrder();
      const fileReadPromises: Promise<ProductImage>[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (!file.type.startsWith("image/")) continue;

        const id = crypto.randomUUID();
        const displayOrder = nextOrder + i;

        const fileReadPromise = new Promise<ProductImage>((resolve) => {
          const reader = new FileReader();
          reader.onload = (event) => {
            resolve({
              id,
              shop_id: shopId,
              product_id: "",
              url: (event?.target?.result as string) ?? "",
              indexedDBId: null,
              displayOrder,
              hidden: 0,
              createdAt: new Date(),
              deletedAt: null,
            });
          };
          reader.readAsDataURL(file);
        });

        fileReadPromises.push(fileReadPromise);
      }

      const newImages = await Promise.all(fileReadPromises);
      field.setValue((prev) => [...(prev || []), ...newImages]);
    },

    [calculateNextOrder, shopId, field],
  );

  const handleClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleReorder = useCallback(
    (image: ProductImage, direction: "up" | "down") => {
      field.setValue((prev) => {
        const sorted = [...(prev || [])].sort(
          (a, b) => a.displayOrder - b.displayOrder,
        );
        const idx = sorted.findIndex((img) => img.id === image.id);

        if (idx === -1) return prev;

        if (direction === "up" && idx > 0) {
          [sorted[idx - 1], sorted[idx]] = [sorted[idx], sorted[idx - 1]];
        } else if (direction === "down" && idx < sorted.length - 1) {
          [sorted[idx], sorted[idx + 1]] = [sorted[idx + 1], sorted[idx]];
        }

        return sorted.map((img, i) => ({
          ...img,
          displayOrder: i + 1,
        }));
      });
    },
    [field],
  );

  const handleDelete = useCallback(
    (image: ProductImage, isNew: boolean) => {
      if (isNew) {
        field.setValue(
          (prev) => prev?.filter((img) => img.id !== image.id) || [],
        );
      } else {
        field.setValue(
          (prev) => {
            const result = prev.map(prevImage => {
              if (prevImage.id === image.id) {
                return { ...prevImage, deletedAt: new Date() }
              }
              return prevImage
            })
            return result
          },
        );
      }
    },
    [field],
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

      {images.length === 0 ? (
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
            {images.map((image, index) => {
              const isNew = !oldImages?.some((oldImage: any) => image.id === oldImage.id)
              return (
                <ImageItem
                  key={image.id}
                  index={index}
                  image={image}
                  onDelete={() => handleDelete(image, isNew)}
                  onHide={() => handleHide(image)}
                  onReorderUp={() => handleReorder(image, "up")}
                  onReorderDown={() => handleReorder(image, "down")}
                />
              )
            })}
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
