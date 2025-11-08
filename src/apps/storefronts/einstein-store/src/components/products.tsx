import { useNavigate } from "@tanstack/react-router";
import type { Doc } from "api/data-model";

export function Product({ data, source, imgWidth }: { imgWidth?: { sm: number, large: number }, source?: { sourceName: string, sourceType: string }, data: Doc<'products'> | undefined }) {
  const picture_url = data?.images?.find(img => img.order === 1)?.url ?? data?.images?.[0].url
  const navigate = useNavigate()
  return (
    <div className="flex flex-col gap-3 shrink-0">
      <button onClick={() => navigate({ to: `/products/${data?._id}`, search: { source } })}>
        <img className="border-[1px] lg:w-[420px] border-white object-cover" src={picture_url} />
      </button>
      <div className="flex flex-col gap-1.5">
        <div className="flex justify-between items-start">
          <p className="font-black text-[20px] leading-[1] font-inter">{data?.price} DA</p>
          <button className="text-[12px] px-2 rounded-full border-1 border-black uppercase font-semibold font-inter">voir rapidement</button>
        </div>
        <p className="font-bold lg:text-[14px] leading-[1] uppercase tracking-wider font-inter">{data?.title}</p>
        <p className="text-black/50 text-[12px] leading-[1] font-semibold uppercase tracking-wider font-inter">3 couleurs</p>
      </div>
    </div>
  )
}
