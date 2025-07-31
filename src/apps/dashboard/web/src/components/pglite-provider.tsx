import { PGlite } from "@electric-sql/pglite"
import { live } from "@electric-sql/pglite/live"
import { PGliteProvider } from "@electric-sql/pglite-react"

const db = await PGlite.create({
  extensions: { live }
})
export function MyPGliteProvier({ children }: { children: React.ReactNode }) {
  return (
    <PGliteProvider db={db}>
      {children}
    </PGliteProvider>
  )
}
