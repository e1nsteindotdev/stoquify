import { useQuery } from "convex/react"
import { api } from "api/convex"
import { RightChevron } from "./icons/right-chevron"
import { DownChevron } from "./icons/down-chevron"
import type { Doc } from "api/data-model"
import { useState } from "react"

export function OurCategories() {
  const categories = useQuery(api.categories.listCategories)
  const products = useQuery(api.products.listProduts)
  return (
    <div className="flex flex-col pt-6">
      <div className="relative mx-auto">
        <p className="uppercase text-primary text-[41px] lg:text-[103px] font-display tracking-tighter mx-auto">NOS catégorés</p>
        <p className="absolute font-display -left-6 lg:-left-14 lg:bottom-[22px] bottom-[10px] text-[19px] lg:text-[47px] text-black/20 font-bold tracking-[-0.06em]">01</p>
      </div>
      <div className={`grid lg:grid-cols-2 border-t-1 border-white`}>
        {categories?.map((c, i) => (
          <Category
            length={categories.length}
            index={i}
            category={c}
            products={products?.filter(p => p.categoryId === c._id)} />
        ))}
      </div>
    </div>
  )
}


function Category({ category, products, index, length }:
  { length: number, index: number, products: Doc<'products'>[] | undefined | null, category: Doc<'categories'> }) {
  const [selected, setSelected] = useState(0)
  const selectedProduct = products ? products[selected] : null
  const imgUrl = selectedProduct?.images?.[0]?.url
  console.log('url :', imgUrl)
  return (
    <div className={`flex flex-col lg:flex-row w-full lg:border-b-1 lg:border-white ${index % 2 === 0 && "justify-end"}`}>
      <div className="flex xs:justify-between gap-3 lg:gap-5 py-5 px-3 lg:px-5">
        <div className={`flex flex-col gap-1.5 lg:gap-3 w-[200px] lg:w-full  ${index % 2 === 0 ? "order-1 items-end" : "order-2 item-start"}`}>
          <div className="flex flex-col gap-0.5">
            <p className={`text-[23px] font-[500] lg:text-[35px] tracking-[0.04em] uppercase leading-[1] 
                              ${index % 2 === 0 ? 'text-end' : 'text-start'}`}>{category.name}</p>
            <p className={`text-primary italic text-[12px] lg:text-[16px] font-medium uppercase font-inter ${index % 2 === 0 ? 'text-end' : 'text-start'}`}>
              16 produits</p>
          </div>
          <div className="flex flex-col justify-between gap-2 h-full">
            <div className={`text-black/20 font-inter font-semibold text-[10px] lg:text-[16px] flex flex-col gap-0.25 uppercase h-[160px] lg:h-[300px] overflow-clip
              ${index % 2 === 0 ? 'text-end' : 'text-start'}`}
            >
              {products?.map((p, i) => p.categoryId === category._id && <p
                className={`${selectedProduct?._id === p._id && 'text-black'}`}
              >{p.title}</p>)}
            </div>
            <div className={`flex flex-col gap-3 mt-auto lg:pb-2 ${index % 2 === 0 ? 'items-end' : 'items-start'}`}>
              <div className="border-[1.5px] border-black py-2 px-1"> <DownChevron color="black" size={12} /> </div>
              <div className="border-[1.5px] border-black py-2 px-1"> <DownChevron color="black" size={12} className="rotate-180" /> </div>
            </div>
          </div>
        </div>

        <div className={`relative bg-[#F1F1F1] h-[230px] w-[184px] xs:h-full xs:w-full lg:w-[600px] lg:h-[490px] border-1 border-white ${index % 2 === 0 ? "order-2" : "order-1"}`}>
          <img className="w-full h-full" src={imgUrl} alt="no image" />
          <div className="absolute w-[90%] bottom-2.25 lg:bottom-3.5 left-1/2 -translate-x-1/2 lg:px-4 px-2  py-1.5 flex justify-between items-center border-black border-1">
            <p className="text-black uppercase font-inter font-semibold text-[8px] lg:text-[12px]">touts les "{category.name}"</p>
            <RightChevron size={10} />
          </div>
        </div>
      </div>
      {index < length && <div className="w-full lg:hidden h-[1px] bg-white" />}
      {index % 2 == 0 && <div className="h-full hidden lg:flex w-[1px] bg-white" />}
    </div>
  )

}
