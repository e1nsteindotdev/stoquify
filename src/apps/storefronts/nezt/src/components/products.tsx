import { useNavigate } from "@tanstack/react-router";
import type { Doc } from "api/data-model";
import { useState, useEffect } from "react";

export function Product({
  data,
  source,
}: {
  imgWidth?: { sm: number; large: number };
  source?: { sourceName: string; sourceType: string };
  data: Doc<"products"> | undefined;
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

  return (
    <div className="flex flex-col gap-3 shrink-0">
      <div className="">
        <button
          className="ratio-[3/4] w-full lg:min-h-[300px] xl:min-h-[500px] border-white border cursor-pointer"
          onClick={() =>
            navigate({ to: `/products/${data?._id}`, search: { source } })
          }
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          <img className="flex-1 ratio-3/4 object-cover" src={picture_url} />
        </button>
      </div>
      <div className="flex flex-col gap-1.5">
        <div className="flex justify-between items-start">
          <p className="font-black text-[20px] leading-[1] font-inter">
            {data?.price} DA
          </p>
          {/* <button */}
          {/*   className="text-[12px] px-2 rounded-full border-1 border-black uppercase font-semibold font-inter" */}
          {/* > */}
          {/*   voir rapidement */}
          {/* </button> */}
        </div>
        <p className="font-bold lg:text-[14px] leading-[1] uppercase tracking-wider font-inter">
          {data?.title}
        </p>
        <p className="text-black/50 text-[12px] leading-[1] font-semibold uppercase tracking-wider font-inter">
          3 couleurs
        </p>
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
  data: Doc<"products"> | undefined;
}) {
  const visibleImages =
    data?.images
      ?.filter((img) => !img.hidden && img.url)
      .sort((a, b) => a.order - b.order) || [];
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const navigate = useNavigate();

  // Cycle through images on hover
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

  const picture_url =
    visibleImages[currentImageIndex]?.url ?? visibleImages[0]?.url;

  return (
    <div className="flex flex-col gap-3 shrink-0">
      <div className="">
        <button
          className="border-white border"
          onClick={() =>
            navigate({ to: `/products/${data?._id}`, search: { source } })
          }
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          <img
            className="flex-1 ratio-3/4 object-cover w-[250px] lg:w-[400px]"
            src={picture_url}
          />
        </button>
      </div>
      <div className="flex flex-col gap-1.5">
        <div className="flex justify-between items-start">
          <p className="font-black text-[20px] leading-[1] font-inter">
            {data?.price} DA
          </p>
          {/* <button */}
          {/*   className="text-[12px] px-2 rounded-full border-1 border-black uppercase font-semibold font-inter" */}
          {/* > */}
          {/*   voir rapidement */}
          {/* </button> */}
        </div>
        <p className="font-bold lg:text-[14px] leading-[1] uppercase tracking-wider font-inter mt-1">
          {data?.title}
        </p>
        <p className="text-black/50 text-[12px] leading-[1] font-semibold uppercase tracking-wider font-inter">
          3 couleurs
        </p>
      </div>
    </div>
  );
}
