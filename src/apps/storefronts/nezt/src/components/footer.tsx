import { UpArrow } from "./icons/up-arrow";
import { useQuery } from "convex/react";
import { api } from "api/convex";

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

export function Footer() {
  const settings = useQuery(api.settings.getSettings);
  const instagramLink = settings?.instagramLink || "";
  const facebookLink = settings?.facebookLink || "";
  const tiktokLink = settings?.tiktokLink || "";
  const locationLink = settings?.locationLink || "";

  return (
    <div className="pb-2 flex flex-1 w-full bg-primary relative">
      <div className="absolute h-full pt-8 w-[5000px] bg-primary -left-[1000px] z-10" />
      <div className="flex flex-col w-full gap-40 border-l-1 border-r-1 border-black/20 z-50 px-3 lg:px-6">
        <div className="flex flex-col gap-8 lg:gap-4 pt-8 z-20">
          <div className="flex w-full justify-between items-start">
            <div className="flex gap-3 lg:gap-6">
              {instagramLink && (
                <Social
                  href={
                    instagramLink.startsWith("http")
                      ? instagramLink
                      : `https://${instagramLink}`
                  }
                >
                  Instagram
                </Social>
              )}
              {facebookLink && (
                <Social
                  href={
                    facebookLink.startsWith("http")
                      ? facebookLink
                      : `https://${facebookLink}`
                  }
                >
                  Facebook
                </Social>
              )}
              {tiktokLink && (
                <Social
                  href={
                    tiktokLink.startsWith("http")
                      ? tiktokLink
                      : `https://${tiktokLink}`
                  }
                >
                  Tik Tok
                </Social>
              )}
            </div>
            <img
              src="/images/barcode.png"
              className="max-h-[77px] hidden lg:inline"
            />
          </div>
          <div className="flex items-start gap-4 lg:gap-10 flex-wrap">
            <div className="flex flex-col gap-3">
              <p className="font-[600] uppercase text-[20px]">CONTACT</p>
              <div>
                {" "}
                <p className="text-[12px]">+213 557 10 23 63</p>{" "}
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <p className="font-[600] uppercase text-[20px]">LOCALISATION</p>
              <div className="text-[12px] uppercase flex flex-col gap-1">
                <p className="">Rue freres-odek</p>
                <p className="">el harrach</p>
                <p className="">alger</p>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <p className="font-[600] uppercase text-[20px]">SHOP</p>
              <div className="text-[12px] uppercase  flex flex-col gap-1">
                <button
                  onClick={() => {
                    const element = document.getElementById("categories");
                    if (element) {
                      smoothScrollTo(element, 100);
                    }
                  }}
                  className="flex justify-between items-center cursor-pointer hover:opacity-70 transition-opacity"
                >
                  <p className="uppercase">nos catégories</p>
                  <UpArrow />
                </button>
                <button
                  onClick={() => {
                    const element = document.getElementById("collections");
                    if (element) {
                      smoothScrollTo(element, 100);
                    }
                  }}
                  className="flex justify-between items-center gap-4 cursor-pointer hover:opacity-70 transition-opacity"
                >
                  <p className="uppercase">nos collections</p>
                  <UpArrow />
                </button>
              </div>
            </div>
            {locationLink && (
              <div className="flex flex-col gap-3">
                <p className="font-[600] uppercase text-[20px]">GOOGLE MAPS</p>
                <div className="text-[12px] uppercase">
                  <a
                    className="underline"
                    href={
                      locationLink.startsWith("http")
                        ? locationLink
                        : `https://${locationLink}`
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Voir sur Google Maps
                  </a>
                </div>
              </div>
            )}
          </div>
          <img
            src="/images/barcode.png"
            className="h-[90px] pt-6 self-end object-contain lg:hidden"
          />
        </div>
        <img
          src="/images/big-nezt.png"
          className="max-h-[250px] lg:max-h-[511px] w-full z-30"
        />
      </div>
    </div>
  );
}

function Social({ children, href }: { children: string; href: string }) {
  return (
    <a
      href={href}
      className="font-inter flex items-center text-[14px] lg:text-[24px] leading-[1] font-[500] uppercase px-2 lg:px-4 py-1 lg:py-1.5 rounded-[34px] border-black border-[1.5px]"
    >
      {children}
    </a>
  );
}
