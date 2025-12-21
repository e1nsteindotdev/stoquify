import { ChevronDown } from "lucide-react"
import { DownChevron } from "./icons/down-chevron"

function smoothScrollTo(element: HTMLElement, offset: number = 100) {
  const startY = window.scrollY;
  const targetY = element.offsetTop - offset;
  const distance = targetY - startY;
  const duration = 800; // milliseconds
  let start: number | null = null;

  function step(timestamp: number) {
    if (!start) start = timestamp;
    const progress = timestamp - start;
    const progressPercent = Math.min(progress / duration, 1);
    
    // Easing function: ease-in-out cubic
    const easeInOutCubic = (t: number) =>
      t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    
    const easedProgress = easeInOutCubic(progressPercent);
    window.scrollTo(0, startY + easedProgress * distance);

    if (progress < duration) {
      requestAnimationFrame(step);
    }
  }

  requestAnimationFrame(step);
}

export function CTA() {
  const handleScrollToCollections = () => {
    const element = document.getElementById("collections");
    if (element) {
      smoothScrollTo(element, 100);
    }
  };

  return (
    <div className="border-b-1 border-t-1 border-white flex justify-center">

      <div className="flex flex-col items-center gap-3 px-4 lg:px-20 border-l-1 border-r-1 border-seperator h-full pt-5 pb-7">
        <div className="flex flex-col items-center gap-1">
          <div className="flex gap-4 items-center text-[10px] lg:text-[12px] text-black/50">
            <p className="font-inter font-bold  tracking-[0.07em] uppercase">[05 collections]</p>
            <p className="font-inter text-[10px]">X</p>
            <p className="font-inter font-bold  tracking-[0.07em] uppercase">[05 collections]</p>
          </div>
          <p className="text-[20px] uppercase lg:max-w-[424px] text-center leading-tight">La collection MAMMA MIA 2025 s'inspire de la chanson vidéo d'Abba de 1975</p>
        </div>

        <button
          onClick={handleScrollToCollections}
          className="flex items-center text-[12px] lg:text-[16px] font-[600] gap-4 border-2
          border-primary py-2.5 lg:pb-1.5 lg:pt-2 lg:py-3 px-8 lg:px-5 uppercase tracking-[0.1em] text-nowrap text-white mt-3 cursor-pointer hover:opacity-80 transition-opacity">
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
