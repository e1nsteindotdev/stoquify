export function Bande({ children }: { children: string }) {
  return (<div className="py-2 border-t-1 border-b-1 border-white">
    <div className="py-1.5 lg:py-2 bg-primary flex overflow-clip px-4 gap-4">
      {Array.from({ length: 10 }, (_, i) => i).map((_, i) => (
        <div className="flex gap-4 items-center">
          <div className="rounded-full size-1.25 bg-white" />
          <p className="font-inter font-medium text-white text-[9px] lg:text-[13px] uppercase text-nowrap">DÉCOUVREZ LES NOUVEAUTÉS</p>
        </div>
      ))}
    </div>
  </div>
  )
}
