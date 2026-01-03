import { DownChevron } from "./icons/down-chevron"
import { useQuery } from "convex/react"
import { api } from "api/convex"

import { smoothScrollTo } from "../lib/scroll"

export function CTA() {
  const collections = useQuery(api.collections.listAllCollections);
  const collectionsCount = (collections?.length ?? 0).toString().padStart(2, '0');

  const handleScrollToCollections = () => {
    const element = document.getElementById("collections");
    if (element) {
      smoothScrollTo(element, 150);
    }
  };

  return (
    <div className="border-b-1 border-t-1 border-white flex justify-center">

      <div className="flex flex-col items-center gap-3 px-4 lg:px-20 border-l-1 border-r-1 border-seperator h-full pt-5 pb-7">
        <div className="flex flex-col items-center gap-1">
          <div className="flex gap-4 items-center text-[10px] lg:text-[12px] text-black/50">
            <p className="font-inter font-bold  tracking-[0.07em] uppercase">[{collectionsCount} collections]</p>
            <p className="font-inter text-[10px]">X</p>
            <p className="font-inter font-bold  tracking-[0.07em] uppercase">[{collectionsCount} collections]</p>
          </div>
          <p className="text-[20px] uppercase lg:max-w-[424px] text-center leading-tight">La collection MAMMA MIA 2025 s'inspire de la chanson vidéo d'Abba de 1975</p>
        </div>

        <button
          onClick={handleScrollToCollections}
          className="flex items-center text-[12px] lg:text-[16px] font-[600] gap-4 border-2
          border-primary py-2.5 lg:pb-1.5 lg:pt-2 lg:py-3 px-8 lg:px-5 uppercase tracking-[0.1em] text-nowrap text-white mt-3 cursor-pointer hover:opacity-80 transition-opacity">
          <p className="leading-[1] pt-0.75 lg:pb-2 lg:pt-1.5 text-primary">
            Découvrez NOS collections
          </p>
          <DownChevron color="#684FCA" size={16} className="hidden lg:inline" />
          <DownChevron color="#684FCA" size={12} className="lg:hidden" />
        </button>
      </div>

    </div>
  )
}
