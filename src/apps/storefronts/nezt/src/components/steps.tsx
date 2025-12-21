import { AddToCartIcon } from "./icons/add-to-cart";
import { ClickIcon } from "./icons/click-icon";
import { OrderIcon } from "./icons/order-icon";

export function Steps() {
  return (

    <div className="w-full flex flex-col gap-4 lg:gap-8">
      <div className="flex justify-center ">
        <p className="relative uppercase text-primary text-[41px] lg:text-[103px] font-display tracking-tighter inline">COMMENT ACHETER
          <span
            className="absolute font-display -left-8 lg:-left-18 lg:bottom-[22px] bottom-[8px] text-[19px] lg:text-[47px] text-black/20 font-bold tracking-[-0.06em]">03</span>
        </p>
      </div>
      <div className="flex flex-col lg:flex-row border-t-1 border-b-1 border-seperator -mt-[1px] bg-white/40">

        <div className="flex flex-col gap-4 lg:gap-7 flex-1  items-start p-4 lg:p-6 border-b-1 lg:border-b-0 lg:border-r-1 border-seperator">

          <div className="flex flex-col w-full">
            <p className="uppercase font-bold leading-[1] tracking-tighter text-[22px] lg:text-[45px] text-primary">ÉTAPE 01</p>
            <div className="w-full h-[4px] lg:h-[8px] bg-primary"></div>
          </div>

          <div className="flex justify-between items-center lg:items-start gap-4 lg:gap-7">
            <div className="border-r-1 flex items-center justify-center border-black/20 pr-4 lg:pr-7 pl-2 h-full">
              <AddToCartIcon size={32} />
            </div>
            <p className="text-[14px] lg:text-[18px] font-semibold font-inter tracking-[0.06em] uppercase">Ajoutez vos produits préférés à votre panier</p>
          </div>

        </div>

        <div className="flex flex-col gap-4 lg:gap-7 flex-1 items-start p-4 lg:p-6 border-b-1 lg:border-b-0 lg:border-r-1 border-seperator">

          <div className="flex flex-col w-full">
            <p className="uppercase font-bold leading-[1] tracking-tighter text-[22px] lg:text-[45px] text-primary">ÉTAPE 02</p>
            <div className="w-full h-[4px] lg:h-[8px] bg-primary"></div>
          </div>

          <div className="flex justify-between items-center lg:items-start gap-4 lg:gap-7">
            <div className="border-r-1 flex items-center justify-center border-black/20 pr-4 lg:pr-7 pl-2 h-full">
              <ClickIcon size={32} />
            </div>
            <p className="text-[14px] lg:text-[18px] font-semibold font-inter tracking-[0.06em] uppercase">Cliquez sur votre panier pour confirmer l'achat</p>
          </div>

        </div>

        <div className="flex flex-col gap-4 lg:gap-7 flex-1  items-start p-4 lg:p-6 border-b-1 lg:border-b-0 lg:border-r-1 border-seperator">

          <div className="flex flex-col w-full">
            <p className="uppercase font-bold leading-[1] tracking-tighter text-[22px] lg:text-[45px] text-primary">ÉTAPE 03</p>
            <div className="w-full h-[4px] lg:h-[8px] bg-primary"></div>
          </div>

          <div className="flex justify-between items-center lg:items-start gap-4 lg:gap-7">
            <div className="border-r-1 flex items-center justify-center border-black/20 pr-4 lg:pr-7 pl-2 h-full">
              <OrderIcon size={32} className="hidden" color="black" />
            </div>
            <p className="text-[14px] lg:text-[18px] font-semibold font-inter tracking-[0.06em] uppercase">Recevez votre commande, payez, savourez.</p>
          </div>

        </div>

      </div>
    </div>
  )
}

function Step() {
  return (
    <div className="flex flex-col flex-1 justify-between items-start gap-6 lg:min-h-[200px] p-6 border-b-1 lg:border-b-0 lg:border-r-1 border-seperator">
      <div className="flex justify-center items-center gap-4">
        <div className="rounded-full p-5 border-1 border-seperator">
          <AddToCartIcon />
        </div>
        <p className="text-[20px] font-semibold font-inter tracking-[0.06em] uppercase">Ajoutez vos produits préférés à votre panier</p>
      </div>
      <div className="flex gap-3 items-center">
        <div className="w-[20px] h-[2px] bg-black" />
        <p className="uppercase font-inter font-semibold text-[18px]">ÉTAPE 01</p>
      </div>
    </div>
  )
}
