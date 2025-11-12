import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/categories/')({
  component: RouteComponent,
  loader: () => {
    throw redirect({
      to: '/',
    })
  }
})

function RouteComponent() {
  return <div></div>
}
