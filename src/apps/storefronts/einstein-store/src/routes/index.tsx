import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from "convex/react"
import { api } from "api/convex"

export const Route = createFileRoute('/')({
  component: Home,
})

function Home() {
  const products = useQuery(api.products.getTestProducts)
  console.log(products)
  return (
    <div className="p-2 h-screen bg-neutral-950 flex items-center justify-center">
      <div className="flex flex-col gap-8">
        {products?.map((p, i) => (
          <div className="flex flex-col gap-1">
            <p className="text-xl text-white">{p.title}</p>
            <p className="text-sm text-white italic">{p.desc}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
