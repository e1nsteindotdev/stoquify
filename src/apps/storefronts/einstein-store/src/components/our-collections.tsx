import { useQuery } from "convex/react"
import { api } from "api/convex"
import { SimpleChevronDownIcon } from "./icons/simple-down-chevron"
import { Product } from "./products"

export function OurCollections() {
  const collections = useQuery(api.products.listCollections)
  const products = useQuery(api.products.listProduts)
  return (
    <div className="flex flex-col gap-4 lg:gap-6 py-3">
      <div className="relative mx-auto">
        <p className="uppercase text-primary text-[41px] lg:text-[103px] font-display tracking-tighter mx-auto">NOS COLLECTIONS</p>
        <p className="absolute -left-8 lg:-left-18 lg:bottom-[18px] bottom-[8px] text-[19px] lg:text-[47px] text-black/20 font-bold tracking-[-0.06em]">02</p>
      </div>
      <div className="flex flex-col border-t-1 border-b-1 border-white bg-white/40">
        <div className="flex items-center gap-10 lg:gap-20 px-4 py-2">
          <div className="relative">
            <p className="text-[27px] lg:text-[60px] tracking-[0.04em]">TENDANCES</p>
            <p className="absolute text-[14px] font-thin -right-5 top-2">05</p>
          </div>
          <div className="rounded-full border-gray-300 border-1 p-2.5 lg:p-4">
            <SimpleChevronDownIcon size={24} className="hidden lg:inline" />
            <SimpleChevronDownIcon size={16} className="lg:hidden" />
          </div>
          <div className="flex gap-8">
            <Product />
            <Product />
            <Product />
            <Product />
          </div>
        </div>
        <div className="w-full h-[1px] bg-white" />
        <Collection />
        <div className="w-full h-[1px] bg-white" />
        <Collection />
      </div>
    </div>
  )
}

function Collection() {
  return (
    <div className="flex items-center gap-10 lg:gap-20 px-4 py-2">
      <div className="relative">
        <p className="text-[27px] lg:text-[60px] tracking-[0.04em]">TENDANCES</p>
        <p className="absolute text-[14px] font-thin -right-5 top-2">05</p>
      </div>
      <div className="rounded-full border-gray-300 border-1 p-2.5 lg:p-4">
        <SimpleChevronDownIcon size={24} className="hidden lg:inline" />
        <SimpleChevronDownIcon size={16} className="lg:hidden" />
      </div>
    </div>
  )

}

