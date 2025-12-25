import { useQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { trpc } from "server/lib/client"

export const Route = createFileRoute('/_dashboard/hello')({
  component: RouteComponent,
})

function RouteComponent() {
  const { data } = useQuery({
    queryKey: ['users'],
    queryFn: () => trpc.users.list.query()
  })

  console.log('users :', data)

  return <div>Hello "/_dashboard/hello"!</div>
}
