import "./App.css";
import { AddProduct } from "./add-product";
import { PGliteProvider } from "@electric-sql/pglite-react"
import { live } from "@electric-sql/pglite/live"
import { PGliteWorker } from '@electric-sql/pglite/worker'
import PGWorker from "./db/pglite-worker.ts?worker"


export const db = await PGliteWorker.create(
  new PGWorker({
    name: 'pglite-worker',
  }),
  { extensions: { live } })

await db.exec(`
  CREATE TABLE IF NOT EXISTS products (
    id serial PRIMARY KEY,
    title varchar(255)
)`)

function App() {

  return (
    <PGliteProvider db={db}>
      <main className="flex items-center justify-center h-screen">
        <AddProduct />
      </main>
    </PGliteProvider>
  );
}

export default App;
