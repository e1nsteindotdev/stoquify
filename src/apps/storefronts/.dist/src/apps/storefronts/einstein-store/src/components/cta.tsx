import { ChevronDown } from "lucide-react"
import { DownChevron } from "./icons/down-chevron"
export function CTA() {
  return (
    <div className="border-b-1 border-t-1 border-white flex justify-center">

      <div className="flex flex-col items-center gap-3 px-4 lg:px-20 border-l-1 border-r-1 border-seperator h-full pt-5 pb-7">
        <div className="flex flex-col items-center gap-1">
          <div className="flex gap-4 items-center text-[10px] lg:text-[12px] text-black/50">
            <p className="font-inter font-bold  tracking-[0.07em] uppercase">[05 collections]</p>
            <p className="font-inter text-[10px]">X</p>
            <p className="font-inter font-bold  tracking-[0.07em] uppercase">[05 collections]</p>
          </div>
          <p className="text-[20px] uppercase lg:max-w-[424px] text-center leading-tight">The 2025 MAMMA MIA Collection was inspired by Abba’s 1975 video song</p>
        </div>

        <button
          className="flex items-center text-[12px] lg:text-[16px] font-[600] gap-4 border-2
          border-primary py-2.5 lg:pb-1.5 lg:pt-2 lg:py-3 px-8 lg:px-5 uppercase tracking-[0.1em] text-nowrap text-white mt-3">
          <p className="leading-[1] pt-0.75 lg:pb-1 lg:pt-1.5 text-primary">
            Découvrez NOS collections
          </p>
          <DownChevron color="#684FCA" size={16} className="hidden lg:inline" />
          <DownChevron color="#684FCA" size={12} className="lg:hidden" />
        </button>
      </div>

    </div>
  )
}
