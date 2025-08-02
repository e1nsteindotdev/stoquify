import { useLiveQuery, usePGlite } from '@electric-sql/pglite-react'
import { useState } from 'react'

export function AddProduct() {
  const [input, setInput] = useState("")
  const db = usePGlite()

  const addProduct = () => {
    const trimmed = input.trim()
    if (!trimmed) return
    db.query('insert into products (title) values ($1)', [trimmed])
    setInput("")
  }
  const products = useLiveQuery<{ title: string }>("select title from products;")

  return (
    <div className="max-w-md mx-auto mt-10 p-4 border rounded-xl shadow space-y-4">
      <h1 className="text-2xl font-bold text-center">Todo List</h1>
      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && addProduct()}
          className="flex-1 border px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
          placeholder="Add a new task..."
        />
        <button
          onClick={addProduct}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Add
        </button>
      </div>

      <ul className="space-y-2">
        {products?.rows.map((p, i) => (
          <li
            key={i}
            className={`cursor-pointer px-3 py-2 rounded bg-slate-900 hover:bg-gray-200}`} >
            {p.title}
          </li>
        ))}
      </ul>
    </div>
  )
}
