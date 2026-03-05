import { useNavigate } from "@tanstack/react-router";
import type { CatalogProduct } from "@/lib/catalog";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

export function Product({
  data,
  source,
}: {
  imgWidth?: { sm: number; large: number };
  source?: { sourceName: string; sourceType: string };
  data: CatalogProduct | undefined;
}) {
  const visibleImages =
    data?.images
      ?.filter((img) => !img.hidden && img.url)
      .sort((a, b) => a.order - b.order) || [];
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const picture_url =
    visibleImages[currentImageIndex]?.url ?? visibleImages[0]?.url;
  const navigate = useNavigate();

  const handleMouseEnter = () => {
    if (visibleImages.length > 1) {
      setCurrentImageIndex(1);
    }
  };

  const handleMouseLeave = () => {
    setCurrentImageIndex(0);
  };

  const isOutOfStock = (() => {
    if (!data) return false;
    if (data.stockingStrategy === "by_demand") return false;
    if (data.stockingStrategy === "by_number") return (data.quantity ?? 0) <= 0;
    // by_variants
    return data.skus.every((sku) => sku.quantity <= 0);
  })();

  return (
    <div className="flex flex-col gap-3 shrink-0">
      <div className="relative">
        <button
          className="ratio-[3/4] w-full lg:min-h-[300px] xl:min-h-[500px] border-white border cursor-pointer overflow-hidden group"
          onClick={() =>
            navigate({ to: `/products/${data?._id}`, search: { source } })
          }
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          <img
            className={cn(
              "flex-1 ratio-3/4 object-cover transition-transform duration-500",
              !isOutOfStock && "group-hover:scale-105",
              isOutOfStock && "grayscale opacity-60",
            )}
            src={picture_url}
          />
          {isOutOfStock && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/20">
              <span className="bg-white text-black px-4 py-2 text-xs font-bold uppercase tracking-widest border border-black">
                Rupture de stock
              </span>
            </div>
          )}
        </button>
      </div>
      <div className="flex flex-col gap-1.5">
        <div className="flex justify-between items-start">
          <p className="font-black text-[20px] leading-[1] font-inter">
            {data?.price} DA
          </p>
        </div>
        <p className="font-bold lg:text-[14px] leading-[1] uppercase tracking-wider font-inter">
          {data?.title}
        </p>
        {data?.stockingStrategy === "by_variants" &&
          data.variants.length > 0 && (
            <p className="text-black/50 text-[12px] leading-[1] font-semibold uppercase tracking-wider font-inter">
              {data.variants[0].options.length} options
            </p>
          )}
      </div>
    </div>
  );
}

export function CollectionProduct({
  data,
  source,
}: {
  imgWidth?: { sm: number; large: number };
  source?: { sourceName: string; sourceType: string };
  data: CatalogProduct | undefined;
}) {
  const visibleImages =
    data?.images
      ?.filter((img) => !img.hidden && img.url)
      .sort((a, b) => a.order - b.order) || [];
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!isHovered || visibleImages.length <= 1) return;

    const intervalId = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % visibleImages.length);
    }, 500);

    return () => clearInterval(intervalId);
  }, [isHovered, visibleImages.length]);

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setCurrentImageIndex(0);
  };

  const isOutOfStock = (() => {
    if (!data) return false;
    if (data.stockingStrategy === "by_demand") return false;
    if (data.stockingStrategy === "by_number") return (data.quantity ?? 0) <= 0;
    // by_variants
    return data.skus.every((sku) => sku.quantity <= 0);
  })();

  const picture_url =
    visibleImages[currentImageIndex]?.url ?? visibleImages[0]?.url;

  return (
    <div className="flex flex-col gap-3 shrink-0">
      <div className="relative">
        <button
          className="border-white border overflow-hidden group"
          onClick={() =>
            navigate({ to: `/products/${data?._id}`, search: { source } })
          }
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          <img
            className={cn(
              "flex-1 ratio-3/4 object-cover w-[250px] lg:w-[400px] transition-transform duration-500",
              !isOutOfStock && "group-hover:scale-105",
              isOutOfStock && "grayscale opacity-60",
            )}
            src={picture_url}
          />
          {isOutOfStock && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/20">
              <span className="bg-white text-black px-4 py-2 text-xs font-bold uppercase tracking-widest border border-black">
                Rupture de stock
              </span>
            </div>
          )}
        </button>
      </div>
      <div className="flex flex-col gap-1.5">
        <div className="flex justify-between items-start">
          <p className="font-black text-[20px] leading-[1] font-inter">
            {data?.price} DA
          </p>
        </div>
        <p className="font-bold lg:text-[14px] leading-[1] uppercase tracking-wider font-inter mt-1">
          {data?.title}
        </p>
        {data?.stockingStrategy === "by_variants" &&
          data.variants.length > 0 && (
            <p className="text-black/50 text-[12px] leading-[1] font-semibold uppercase tracking-wider font-inter">
              {data.variants[0].options.length} options
            </p>
          )}
      </div>
    </div>
  );
}
