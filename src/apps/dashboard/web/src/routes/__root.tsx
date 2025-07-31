import { Outlet, createRootRoute } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools'
import { PGliteProvider } from "@electric-sql/pglite-react"
import { PGlite } from "@electric-sql/pglite"
import { live } from "@electric-sql/pglite/live"

const db = await PGlite.create({
  extensions: { live }
})
await db.exec(`
CREATE TABLE IF NOT EXISTS todos (
  id serial PRIMARY KEY,
  todo text
)`)

const todos = await db.exec(`SELECT * FROM todos`)
console.log("todos : ", todos)

export const Route = createRootRoute({
  component: () => (
    <>
      <PGliteProvider db={db}>
        <Outlet />
        <TanStackRouterDevtools />
      </PGliteProvider>
    </>
  ),
})
