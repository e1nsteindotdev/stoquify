// store.ts
import { QueryClient } from "@tanstack/react-query";
import { createCollection } from "@tanstack/db";
import { queryCollectionOptions } from "@tanstack/query-db-collection";
import { idbGet, idbPut } from "@/lib/idb";

export const queryClient = new QueryClient();

type Todos = Array<{ id: string; todo: string; completed: boolean }>;

export async function getTodosFromIDB(): Promise<Todos> {
  return (await idbGet("todos")) ?? [];
}

export async function saveTodosToIDB(todos: Todos) {
  await idbPut("todos", todos);
}

export async function addTodoToIDB(todo: {
  id: string;
  todo: string;
  completed: boolean;
}) {
  const todos = await getTodosFromIDB();
  todos.push(todo);
  await idbPut("todos", todos);
}

export async function updateTodoInIDB(
  id: string,
  updates: Partial<{ todo: string; completed: boolean }>,
) {
  const todos = await getTodosFromIDB();
  const index = todos.findIndex((t) => t.id === id);
  if (index !== -1) {
    todos[index] = { ...todos[index], ...updates };
    await idbPut("todos", todos);
  }
}

export async function deleteTodoFromIDB(id: string) {
  const todos = await getTodosFromIDB();
  const filtered = todos.filter((t) => t.id !== id);
  await idbPut("todos", filtered);
}

export const todosCollection = createCollection(
  queryCollectionOptions({
    queryKey: ["todos"],
    queryFn: async () => {
      const data = [
        { id: "1", todo: "first dumb todo", completed: false },
        { id: "2", todo: "second dumb todo", completed: true },
      ];
      await saveTodosToIDB(data);
      return data as Todos;
    },
    getKey: (todo) => todo.id,
    queryClient,
  }),
);
