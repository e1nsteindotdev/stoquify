import type { Doc } from "api/data-model";

export function Product({ data }: { data: Doc<'products'> | undefined }) {
  return (
    <div className="flex flex-col gap-3 shrink-0">
      <img className="w-[320px] lg:w-[500px] border-[1px] border-white" src={data?.images?.[0]?.url} />
      <div className="flex flex-col gap-1.5">
        <div className="w-full flex justify-between items-start">
          <p className="font-black text-[20px] leading-[1] font-inter">{data?.price} DA</p>
          <button className="text-[12px] px-2 rounded-full border-1 border-black uppercase font-semibold font-inter">voir rapidement</button>
        </div>
        <p className="font-bold lg:text-[14px] leading-[1] uppercase tracking-wider font-inter">{data?.title}</p>
        <p className="text-black/50 text-[12px] leading-[1] font-semibold uppercase tracking-wider font-inter">3 couleurs</p>
      </div>
    </div>
  )
}
