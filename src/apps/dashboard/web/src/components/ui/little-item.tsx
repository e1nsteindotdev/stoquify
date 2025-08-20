export function LittleItem({ children }: { children: string }) {
  return (
    <span className="rounded-[6px] uppercase bg-primary/10 px-3 py-1.5 text-primary text-[14px]" >
      {children}
    </span>
  )
}
