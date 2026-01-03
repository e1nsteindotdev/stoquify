import { useState } from 'react'
import { useGetTodos, db } from '../database/todos'

export function Todos() {
  const query = useGetTodos()
  const todos = query.data || []
  const [newTodo, setNewTodo] = useState('')

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTodo.trim()) return
    const id = Math.random().toString(36).substring(7)
    await db.todos.insert({
      id,
      text: newTodo,
      completed: false,
    })
    setNewTodo('')
  }

  // Correction: db.todos.insert({ id, text: newTodo, completed: false })

  const toggleTodo = async (todo: any) => {
    // RxDB docs: use upsert or find().update()
    // db.todos.upsert works if the plugin is there, but core rxdb needs upsert plugin?
    // standard way:
    const doc = await db.todos.findOne(todo.id).exec()
    if (doc) {
      await doc.patch({ completed: !todo.completed })
    }
  }

  const deleteTodo = async (id: string) => {
    const doc = await db.todos.findOne(id).exec()
    if (doc) {
      await doc.remove()
    }
  }

  return (
    <div className="max-w-md mx-auto mt-20 p-6 bg-white border border-black shadow-none">
      <h1 className="text-3xl font-bold mb-8 uppercase tracking-tighter">Tasks</h1>

      <form onSubmit={handleAdd} className="mb-8 flex gap-0">
        <input
          type="text"
          value={newTodo}
          onChange={(e) => setNewTodo(e.target.value)}
          placeholder="New task..."
          className="flex-1 p-3 border-2 border-black focus:outline-none placeholder-gray-500 rounded-none bg-transparent text-sm font-medium"
        />
        <button
          type="submit"
          className="bg-black text-white px-6 py-3 font-bold hover:bg-gray-800 transition-colors uppercase text-sm tracking-wider rounded-none"
        >
          Add
        </button>
      </form>

      <div className="space-y-0 border-t-2 border-black">
        {todos.map((todo: any) => (
          <div
            key={todo.id}
            className="group flex items-center justify-between p-4 border-b border-gray-200 hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-4">
              <button
                onClick={() => toggleTodo(todo)}
                className={`w-5 h-5 border-2 border-black flex items-center justify-center transition-all rounded-none ${todo.completed ? 'bg-black' : 'bg-transparent'
                  }`}
              >
                {todo.completed && (
                  <svg
                    className="w-3 h-3 text-white"
                    fill="none"
                    strokeWidth="3"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </button>
              <span
                className={`text-sm font-medium transition-colors ${todo.completed ? 'text-gray-400 line-through' : 'text-black'
                  }`}
              >
                {todo.text}
              </span>
            </div>
            <button
              onClick={() => deleteTodo(todo.id)}
              className="text-gray-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-all font-bold px-2"
            >
              ✕
            </button>
          </div>
        ))}
        {todos.length === 0 && (
          <div className="p-8 text-center text-gray-400 text-sm">
            No tasks yet.
          </div>
        )}
      </div>
    </div>
  )
}
