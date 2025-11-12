import { DownChevron } from "./icons/down-chevron"

export function FAQs() {
  return (
    <div className="w-full py-6  flex flex-col gap-4 lg:gap-8">
      <div className="flex justify-center">
        <p className="relative uppercase text-primary text-[35px] lg:text-[103px] font-display tracking-tighter inline">Questions fréquentes
          <span
            className="absolute font-display -left-8 lg:-left-18 lg:bottom-[22px] bottom-[8px] text-[19px] lg:text-[47px] text-black/20 font-bold hidden lg:inline tracking-[-0.06em]">04</span>
        </p>
      </div>
      <div className="flex flex-col w-full border-1 border-white bg-white/40">
        <Question>what sizing options do you offer</Question>
        <div className="h-[1px] w-full bg-white" />
        <Question>HOW CAN I TRACK MY ORDER</Question>
        <div className="h-[1px] w-full bg-white" />
        <Question> DO YOU OFFER INTERNATIONAL SHOPPING </Question>
      </div>
    </div>
  )
}

function Question({ children }: { children: string }) {
  return (
    <div className="flex items-center w-full justify-between py-3 px-4">
      <p className="uppercase text-black text-[14px] lg:text-[18px] font-semibold font-inter">{children}</p>
      <div className="border-[1.5px] border-black px-1.5 py-2"><DownChevron color={"black"} size={10} /></div>
    </div>
  )
}
