import { useRef, useCallback } from "react";
import { Label } from "@radix-ui/react-label";
import { Button } from "@/components/ui/button";
import { useFieldContext } from "@/hooks/form-context.tsx";
import { Doc } from "api/data-model";
import ImageItem from "./image-item";
import { Effect } from "effect";
import { effectRuntime } from "@/lib/effect-runtime";
import { Images } from "@/lib/services/image-service";

type PropsType = {
  productId: string | null;
  label?: string;
} & React.ComponentProps<"input">;

type ProductImage = Omit<Doc<"images">, "_id" | "_creationTime"> & {
  tempId?: string;
  originalFile?: File;
};

export default function ImageField({
  productId,
  label,
  className,
  type,
  ...props
}: PropsType) {
  const field = useFieldContext<ProductImage[]>();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const images = field.state.value;

  const calculateNextOrder = (): number => {
    const maxOrder = Math.max(0, ...images.map((img) => img.order));
    return maxOrder + 1;
  };

  const handleFileSelect = useCallback(
    async (files: FileList | null) => {
      if (!files?.length) return;
      const imagesFiles = Array.from(files).filter(
        (file) => file.type.startsWith("image/") === true,
      );
      const nextOrder = calculateNextOrder();

      const program = Effect.gen(function* () {
        const imgService = yield* Images;
        const fileBase64Pairs = yield* Effect.forEach(
          imagesFiles,
          (file) =>
            Effect.gen(function* () {
              const base64 = yield* imgService.fileToBase64(file);
              return { file, base64 };
            }),
          { concurrency: "unbounded" },
        );

        const newImages: ProductImage[] = fileBase64Pairs.map(
          ({ file, base64 }, i) => ({
            tempId: crypto.randomUUID(),
            productId: undefined,
            indexedDBId: undefined,
            url: base64,
            order: nextOrder + i,
            hidden: false,
            originalFile: file,
          }),
        );

        field.setValue((prev) => [...prev, ...newImages]);

        yield* Effect.all(
          newImages.map((image) =>
            Effect.forkDaemon(
              Effect.gen(function* () {
                const { base64 } = yield* imgService.compressImageWithWorker(
                  image.originalFile!,
                  image.tempId!,
                );
                field.setValue((prev) =>
                  prev.map((img) =>
                    img.tempId === image.tempId
                      ? { ...img, url: base64, originalFile: undefined }
                      : img,
                  ),
                );
              }).pipe(Effect.catchAll(() => Effect.succeed(undefined))),
            ),
          ),
          { concurrency: "unbounded" },
        );
      });
      await effectRuntime.runPromise(program);
    },

    [calculateNextOrder, field],
  );

  const handleClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleReorder = useCallback(
    (image: ProductImage, direction: "up" | "down") => {
      field.setValue((prev) => {
        const sorted = [...(prev || [])].sort((a, b) => a.order - b.order);
        const idx = sorted.findIndex((img) => img.order === image.order);
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
    (image: ProductImage) => {
      field.setValue(
        (prev) => prev?.filter((img) => img.order !== image.order) || [],
      );
    },
    [field],
  );

  const handleHide = useCallback(
    (image: ProductImage) => {
      field.setValue(
        (prev) =>
          prev?.map((img) =>
            img.order === image.order ? { ...img, hidden: !img.hidden } : img,
          ) || [],
      );
    },
    [field],
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
              const isNew = !("_id" in image);
              return (
                <ImageItem
                  key={image.order}
                  image={image}
                  index={index}
                  onDelete={() => handleDelete(image)}
                  onHide={() => handleHide(image)}
                  onReorderUp={() => handleReorder(image, "up")}
                  onReorderDown={() => handleReorder(image, "down")}
                />
              );
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
