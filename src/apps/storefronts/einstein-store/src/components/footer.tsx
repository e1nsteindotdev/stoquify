import { Barcode } from "./icons/barcode"
import { UpArrow } from "./icons/up-arrow"

export function Footer() {
  return (
    <div className="pb-2 flex flex-1 w-full bg-primary relative">
      <div className="absolute h-full pt-8 w-[5000px] bg-primary -left-[1000px] z-10" />
      <div className="flex flex-col w-full gap-80 border-l-1 border-r-1 border-black/20 z-50 px-6">
        <div className="flex flex-col gap-4 pt-8 z-20">
          <div className="flex w-full justify-between items-start">
            <div className="flex gap-6">
              <Social href="www.instagram.com">Instagram</Social>
              <Social href="www.instagram.com">Facebook</Social>
              <Social href="www.instagram.com">Tik Tok</Social>
            </div>
            <img src="/images/barcode.png" className="max-h-[77px]" />
          </div>
          <div className="flex items-start gap-10">

            <div className="flex flex-col gap-3">
              <p className="font-[600] uppercase text-[20px]">CONTACT</p>
              <div> <p className="text-[16px]">+213 557 10 23 63</p> </div>
            </div>

            <div className="flex flex-col gap-3">
              <p className="font-[600] uppercase text-[20px]">LOCALISTION</p>
              <div className="text-[16px] uppercase">
                <p className="">Rue freres-odek</p>
                <p className="">el harrach</p>
                <p className="">alger</p>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <p className="font-[600] uppercase text-[20px]">SHOP</p>
              <div className="text-[16px] uppercase">
                <div className="flex justify-between items-center">
                  <p className="">nos categores</p>
                  <UpArrow />
                </div>
                <div className="flex justify-between items-center gap-4">
                  <p className="">nos collections</p>
                  <UpArrow />
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-3">
              <p className="font-[600] uppercase text-[20px]">GOOGLE MAPS</p>
              <div className="text-[16px] uppercase">
                <a className="underline" href="#" target="_blank">LIEN</a>
              </div>
            </div>
          </div>
        </div>
        <img src="/images/big-nezt.png" className="max-h-[511px] w-full z-30" />
      </div>
    </div>
  )
}

function Social({ children, href }: { children: string, href: string }) {
  return (
    <a href={href} className="font-inter text-[24px] leading-[1] font-[500] uppercase px-4 py-1.5 rounded-[34px] border-black border-[1.5px]">{children}</a>
  )
}
