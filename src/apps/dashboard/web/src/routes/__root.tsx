import { Outlet, createRootRoute } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools'
import { PGliteProvider } from "@electric-sql/pglite-react"
import { live } from "@electric-sql/pglite/live"
import { PGliteWorker } from '@electric-sql/pglite/worker'

const db = await PGliteWorker.create(
  new Worker(new URL('../db/pglite-worker.ts', import.meta.url), {
    type: 'module',
  }),
  { extensions: { live } }
)
await db.exec(`
CREATE TABLE IF NOT EXISTS products (
  id serial PRIMARY KEY,
  title varchar(255)
)`)


export const Route = createRootRoute({
  component: () => (
    <>
      <PGliteProvider db={db}>
        <Outlet />
      </PGliteProvider>
    </>
  ),
})
