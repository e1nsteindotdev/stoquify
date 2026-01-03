import { createFileRoute } from '@tanstack/react-router'
import { Todos } from '../components/todos'

export const Route = createFileRoute('/todos')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div className="min-h-screen bg-white">
    <Todos />
  </div>
}
