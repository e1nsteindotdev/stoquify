import { useState, useEffect } from "react";
import { Button } from "./button";
import { ArrowDown, ArrowUp, EyeOff, Loader2, Trash2 } from "lucide-react";
import type { Image } from "./images-field";

export type ImageItemProps = {
  index: number;
  value: Promise<Image & { fp: string }>;
  actions: {
    readonly deleteImage: (key: string) => void;
    readonly hideImage: (key: string) => void;
    readonly imageUp: (key: string) => void;
    readonly imageDown: (key: string) => void;
  };
};

export function ImageItem({ index, value, actions }: ImageItemProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [image, setImage] = useState<Image & { fp: string }>();
  const { deleteImage, hideImage, imageUp, imageDown } = actions;

  useEffect(() => {
    value.then((image) => {
      setImage(image);
      setIsLoading(image.status === "uploading" ? true : false);
    });
  }, [value]);

  return (
    <div className="flex items-center justify-between rounded-2xl bg-neutral-200 border border-black/8 bg-muted/30 px-2 py-2">
      <div className="flex items-center gap-2.5">
        <div className="relative size-12 h-[60px] overflow-hidden rounded-lg bg-black/10">
          {image?.url ? (
            <img
              src={image?.url}
              className="size-fullobject-contain"
              alt={`photo-${index + 1}`}
            />
          ) : (
            <div className="size-full" />
          )}
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/30">
              <Loader2 className="size-5 animate-spin text-white" />
            </div>
          )}
        </div>
        <div className="h-[16px] rounded-md py-0.5 bg-[#684FCA]/22 w-[2.5px]" />
        <span className="rounded-md bg-[#6A4FFF]/15 px-2.5 py-1.5 text-[16px] font-semibold text-[#6A4FFF]">
          {index + 1}
        </span>
      </div>

      {image?.fp && (
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 rounded-xl p-1">
            <Button
              type="button"
              size="icon"
              variant="outline"
              disabled={isLoading}
              className="border-transparent w-11 h-11 bg-[#F4F4F4] shadow-none hover:bg-black/5"
              onClick={async () => imageDown(image.fp)}
            >
              <ArrowDown className="size-5" />
            </Button>
            <Button
              type="button"
              size="icon"
              variant="outline"
              disabled={isLoading}
              className="border-transparent w-11 h-11 bg-[#F4F4F4] shadow-none hover:bg-black/5"
              onClick={async () => imageUp(image.fp)}
            >
              <ArrowUp className="size-5" />
            </Button>
          </div>
          <span className="mx-1 h-6 w-px bg-black/10" />
          <div className="flex items-center gap-2 rounded-xl p-1">
            <Button
              type="button"
              size="icon"
              variant="outline"
              disabled={isLoading}
              className={`border-transparent w-11 h-11 shadow-none hover:bg-black/10 ${image?.hidden ? "bg-black/20" : "bg-[#DADADA]"
                }`}
              onClick={async () => hideImage(image.fp)}
            >
              <EyeOff
                className={`size-5 ${image?.hidden ? "opacity-70" : ""}`}
              />
            </Button>
            <Button
              type="button"
              size="icon"
              className="border-transparent w-11 h-11 bg-[#DADADA] shadow-none hover:bg-black/10"
              disabled={isLoading}
              onClick={async () => deleteImage(image.fp)}
            >
              <Trash2 color="red" className="size-5" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export default ImageItem;
