import { createFileRoute } from '@tanstack/react-router'
import logo from '../logo.svg'
import '../App.css'
import { useLiveQuery, usePGlite } from '@electric-sql/pglite-react'
import { useState } from 'react'

type Todo = {
  id: number
  text: string
  completed: boolean
}

export const Route = createFileRoute('/')({
  component: App,
})

function App() {
  const [input, setInput] = useState("")
  const db = usePGlite()

  const addTodo = () => {
    const trimmed = input.trim()
    if (!trimmed) return
    db.query('insert into todos (todo) values ($1)', [trimmed])
    setInput("")
  }


  const todos = useLiveQuery<string[]>("select todo from todos;")
  console.log('live query :', todos?.rows)
  return (
    <div className="max-w-md mx-auto mt-10 p-4 border rounded-xl shadow space-y-4">
      <h1 className="text-2xl font-bold text-center">Todo List</h1>

      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && addTodo()}
          className="flex-1 border px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
          placeholder="Add a new task..."
        />
        <button
          onClick={addTodo}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Add
        </button>
      </div>

      <ul className="space-y-2">
        {todos?.rows.map((todo, i) => (
          <li
            key={i}
            className={`cursor-pointer px-3 py-2 rounded bg-gray-100 hover:bg-gray-200}`} >
            {todo.todo}
          </li>
        ))}
      </ul>
    </div>
  )
}
