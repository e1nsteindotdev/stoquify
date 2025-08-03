import { CreateProductForm } from '@/components/forms/products/create'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/products/create')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div className="h-screen w-screen flex items-center justify-center">
    <CreateProductForm />
  </div>
}
