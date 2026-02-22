import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";

import { useLiveQuery } from "@tanstack/react-db";
import {
  todosCollection,
  addTodoToIDB,
  updateTodoInIDB,
  deleteTodoFromIDB,
  queryClient,
  getTodosFromIDB,
} from "@/database/test-2";

type Todo = { id: string; todo: string; completed: boolean };

export const Route = createFileRoute("/test")({
  loader: async () => {
    const result = await getTodosFromIDB();
    queryClient.setQueryData(["todos"], result);
  },
  component: RouteComponent,
});

function RouteComponent() {
  const todosQuery = useLiveQuery((q) => q.from({ todos: todosCollection }));
  const todos: Todo[] = todosQuery?.data ?? [];

  console.log("todos from live query :", todos);
  const [newTodo, setNewTodo] = useState("");

  const handleAdd = async () => {
    if (!newTodo.trim()) return;
    await addTodoToIDB({
      id: crypto.randomUUID(),
      todo: newTodo.trim(),
      completed: false,
    });
    setNewTodo("");
    queryClient.invalidateQueries({ queryKey: ["todos"] });
  };

  const handleToggle = async (id: string, completed: boolean) => {
    await updateTodoInIDB(id, { completed: !completed });
    queryClient.invalidateQueries({ queryKey: ["todos"] });
  };

  const handleDelete = async (id: string) => {
    await deleteTodoFromIDB(id);
    queryClient.invalidateQueries({ queryKey: ["todos"] });
  };

  const handleUpdate = async (id: string, todo: string) => {
    await updateTodoInIDB(id, { todo });
    queryClient.invalidateQueries({ queryKey: ["todos"] });
  };

  return (
    <div style={{ padding: "20px", maxWidth: "600px", margin: "0 auto" }}>
      <h1>Todos</h1>

      <div style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
        <input
          type="text"
          value={newTodo}
          onChange={(e) => setNewTodo(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAdd()}
          placeholder="Add a new todo..."
          style={{ flex: 1, padding: "8px", fontSize: "16px" }}
        />
        <button onClick={handleAdd} style={{ padding: "8px 16px" }}>
          Add
        </button>
      </div>

      <ul style={{ listStyle: "none", padding: 0 }}>
        {todos?.map((todo) => (
          <TodoItem
            key={todo.id}
            todo={todo}
            onToggle={handleToggle}
            onDelete={handleDelete}
            onUpdate={handleUpdate}
          />
        ))}
      </ul>

      {todos?.length === 0 && <p>No todos yet.</p>}
    </div>
  );
}

function TodoItem({
  todo,
  onToggle,
  onDelete,
  onUpdate,
}: {
  todo: { id: string; todo: string; completed: boolean };
  onToggle: (id: string, completed: boolean) => void;
  onDelete: (id: string) => void;
  onUpdate: (id: string, todo: string) => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(todo.todo);

  const handleSave = () => {
    if (editValue.trim()) {
      onUpdate(todo.id, editValue.trim());
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditValue(todo.todo);
    setIsEditing(false);
  };

  return (
    <li
      style={{
        display: "flex",
        alignItems: "center",
        gap: "10px",
        padding: "10px",
        borderBottom: "1px solid #eee",
        textDecoration: todo.completed ? "line-through" : "none",
        opacity: todo.completed ? 0.6 : 1,
      }}
    >
      <input
        type="checkbox"
        checked={todo.completed}
        onChange={() => onToggle(todo.id, todo.completed)}
      />

      {isEditing ? (
        <>
          <input
            type="text"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSave()}
            style={{ flex: 1, padding: "4px" }}
          />
          <button onClick={handleSave}>Save</button>
          <button onClick={handleCancel}>Cancel</button>
        </>
      ) : (
        <>
          <span style={{ flex: 1 }}>{todo.todo}</span>
          <button onClick={() => setIsEditing(true)}>Edit</button>
        </>
      )}

      <button onClick={() => onDelete(todo.id)}>Delete</button>
    </li>
  );
}
