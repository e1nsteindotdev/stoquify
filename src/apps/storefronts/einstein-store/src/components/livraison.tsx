export function Livraison() {
  return (<div className="font-inter leading-[1] mx-auto flex flex-col lg:flex-row gap-1 lg:gap-6 text-[30px] lg:text-[80px] uppercase font-black text-nowrap overflow-clip border-b-1 border-b-white p-3 items-start lg:items-center">
    <div className="flex gap-2.5">
      <img className="h-[22.5px] lg:h-[60px] object-contain" src={"/images/livraison.png"} />
    </div>
    <div className="flex gap-2.5 mt-1">
      <img className="h-[30px] object-contain lg:h-[60px]" src={"/images/58.png"} />
    </div>

    <div className="flex gap-2.5">
      <img className="h-[30px] object-contain lg:h-[60px]" src={"/images/time.png"} />
    </div>
    {/* <span className="text-black font-inter">48 heures maximum</span> */}
  </div>)
}
