import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/products/')({
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
