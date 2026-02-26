import { EyeOff, Trash2 } from "lucide-react";
import { UpArrow } from "@/components/icons/up-arrow";
import { DownArrow } from "@/components/icons/down-arrow";
import { useGetIndexedDBImg } from "@/hooks/storage/get-indexeddb-img";
import { Doc } from "api/data-model";
import { Button } from "@/components/ui/button";

type ProductImage = Omit<Doc<"images">, "_id" | "_creationTime">;

type ImageItemProps = {
  index: number;
  image: ProductImage;
  onDelete: () => void;
  onHide: () => void;
  onReorderUp: () => void;
  onReorderDown: () => void;
};

export function ImageItem({
  index,
  image,
  onDelete,
  onHide,
  onReorderUp,
  onReorderDown,
}: ImageItemProps) {
  const url = image.indexedDBId
    ? (useGetIndexedDBImg(image.indexedDBId) ?? image.url)
    : image.url;


  return (
    <div className="flex items-center justify-between rounded-2xl bg-neutral-200 border border-black/8 bg-muted/30 px-2 py-2">
      <div className="flex items-center gap-2.5">
        <div className="relative size-12 h-[60px] overflow-hidden rounded-lg bg-black/10">
          <img
            src={url}
            className="size-full object-contain"
            alt={`photo-${index + 1}`}
          />
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
            className={`border-transparent w-11 h-11 shadow-none hover:bg-black/10 ${image.hidden ? "bg-black/20" : "bg-[#DADADA]"
              }`}
            onClick={onHide}
          >
            <EyeOff className={`size-5 ${image.hidden ? "opacity-70" : ""}`} />
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
