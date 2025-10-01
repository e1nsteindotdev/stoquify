import { useQuery } from "convex/react"
import { api } from "api/convex"
import { SimpleChevronDownIcon } from "./icons/simple-down-chevron"
import { Product } from "./products"

export function OurCollections() {
  const collections = useQuery(api.collections.listAllCollections)?.filter(c => c.productIds?.length !== 0)
  const products = useQuery(api.products.listProducts)
  return (
    <div className="flex flex-col gap-4 py-3">
      <div className="relative mx-auto">
        <p className="uppercase text-primary text-[41px] lg:text-[103px] font-display tracking-tighter mx-auto">NOS COLLECTIONS</p>
        <p className="absolute -left-8 lg:-left-18 lg:bottom-[18px] bottom-[8px] text-[19px] lg:text-[47px] text-black/20 font-bold tracking-[-0.06em]">02</p>
      </div>
      <div className="flex flex-col border-t-1 border-b-1 border-white bg-white/40 px-3 lg:px-4">
        {collections?.map(c => {
          const ids = c?.productIds
          const collection_products = ids?.map(id => products?.find(p => p._id == id))
          const collectionProducts = c?.productIds?.map(id => products?.filter(p => p._id === id))
          return (<div key={c._id} className="flex flex-col gap-7 py-6">
            <div className="flex items-center gap-10 lg:gap-20">
              <div className="relative">
                <p className="text-[27px] lg:text-[60px] tracking-[0.04em] uppercase leading-[1]">{c.title}</p>
                <p className="absolute text-[14px] font-thin -right-5 top-2">{collectionProducts?.length}</p>
              </div>
              <div className="rounded-full border-gray-300 border-1 p-2.5 lg:p-4">
                <SimpleChevronDownIcon size={24} className="hidden lg:inline" />
                <SimpleChevronDownIcon size={16} className="lg:hidden" />
              </div>
            </div>
            <div className="flex gap-8 flex-wrap">
              {collection_products?.map(p => <Product key={p?._id} data={p} />)}
            </div>
            <div className="w-full h-[1px] bg-white" />
          </div>)
        })}
      </div>
    </div >
  )
}



