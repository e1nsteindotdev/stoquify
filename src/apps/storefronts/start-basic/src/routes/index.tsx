import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from "convex/react"
import { api } from "api/convex"
import { useState } from 'react'

export const Route = createFileRoute('/')({
  component: Home,
})

function Home() {
  const products = useQuery(api.products.getTestProducts)
  //console.log(products)
  const [count, setCount] = useState(0)
  console.log(count)
  return (
    <div className="p-2 h-screen flex items-center justify-center">
    </div>
  )
}
