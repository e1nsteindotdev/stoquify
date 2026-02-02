import { EyeOff, Trash2 } from "lucide-react";
import { Button } from "../../../ui/button";
import { UpArrow } from "@/components/icons/up-arrow";
import { DownArrow } from "@/components/icons/down-arrow";
import type { ProductImage } from "@/livestore/schema/products/types";
import { useGetIndexedDBImg } from "@/hooks/get-indexeddb-img";

type ImageItemProps = {
  index: number;
  image: ProductImage;
  isNew: boolean;
  onDelete: () => void;
  onHide: () => void;
  onReorderUp: () => void;
  onReorderDown: () => void;
};

export function ImageItem({
  index,
  image,
  isNew,
  onDelete,
  onHide,
  onReorderUp,
  onReorderDown,
}: ImageItemProps) {
  const isDbHidden = image.hidden === 1;
  const url = useGetIndexedDBImg(image.indexedDBId);
  if (!url) console.log("no url for this image :",)
  return (
    <div className="flex items-center justify-between rounded-2xl bg-neutral-200 border border-black/8 bg-muted/30 px-2 py-2">
      <div className="flex items-center gap-2.5">
        <div className="relative size-12 h-[60px] overflow-hidden rounded-lg bg-black/10">
          <img
            src={url ? url : image.url}
            className="size-full object-contain"
            alt={`photo-${index + 1}`}
          />
          {isNew && (
            <div className="absolute top-0 right-0 bg-primary text-white text-[10px] px-1.5 py-0.5 rounded-bl">
              New
            </div>
          )}
          {/* {(isUploading || isPending || isFailed) && ( */}
          {/*   <div */}
          {/*     className={`absolute inset-0 flex items-center justify-center ${isFailed ? "bg-black/50 cursor-pointer" : "bg-black/30" */}
          {/*       }`} */}
          {/*     onClick={handleRetryClick} */}
          {}
          {/*     {getStatusIcon()} */}
          {/*   </div> */}
          {/* )} */}
        </div>
        <div className="h-[16px] rounded-md py-0.5 bg-[primary]/22 w-[2.5px]" />
        <span className="rounded-md bg-[primary]/15 px-2.5 py-1.5 text-[16px] font-semibold text-[primary]">
          {index + 1}
        </span>
      </div>

      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2 rounded-xl p-1">
          <Button
            type="button"
            size="icon"
            variant="outline"
            className="border-transparent w-11 h-11 bg-[#F4F4F4] shadow-none hover:bg-black/5"
            onClick={onReorderDown}
          >
            <DownArrow />
          </Button>
          <Button
            type="button"
            size="icon"
            variant="outline"
            className="border-transparent w-11 h-11 bg-[#F4F4F4] shadow-none hover:bg-black/5"
            onClick={onReorderUp}
          >
            <UpArrow />
          </Button>
        </div>
        <span className="mx-1 h-6 w-px bg-black/10" />
        <div className="flex items-center gap-2 rounded-xl p-1">
          <Button
            type="button"
            size="icon"
            variant="outline"
            className={`border-transparent w-11 h-11 shadow-none hover:bg-black/10 ${isDbHidden ? "bg-black/20" : "bg-[#DADADA]"
              }`}
            onClick={onHide}
          >
            <EyeOff className={`size-5 ${isDbHidden ? "opacity-70" : ""}`} />
          </Button>
          <Button
            type="button"
            size="icon"
            className="border-transparent w-11 h-11 bg-[#DADADA] shadow-none hover:bg-black/10"
            onClick={onDelete}
          >
            <Trash2 color="red" className="size-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}

export default ImageItem;
