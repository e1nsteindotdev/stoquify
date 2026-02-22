// store.ts
import { QueryClient } from "@tanstack/react-query";
import { createCollection } from "@tanstack/db";
import { queryCollectionOptions } from "@tanstack/query-db-collection";
import { openDB } from "idb";

type Todos = Array<{ id: string; todo: string; completed: boolean }>;

export const queryClient = new QueryClient();

export const dbPromise = openDB("app-db", 1, {
  upgrade(db) {
    db.createObjectStore("todos");
  },
});

export async function getTodosFromIDB(): Promise<Todos> {
  const db = await dbPromise;
  return (await db.get("todos", "all")) ?? [];
}

export async function saveTodosToIDB(todos) {
  const db = await dbPromise;
  await db.put("todos", todos, "all");
}

export async function addTodoToIDB(todo: {
  id: string;
  todo: string;
  completed: boolean;
}) {
  const db = await dbPromise;
  const todos = await getTodosFromIDB();
  todos.push(todo);
  await db.put("todos", todos, "all");
}

export async function updateTodoInIDB(
  id: string,
  updates: Partial<{ todo: string; completed: boolean }>,
) {
  const db = await dbPromise;
  const todos = await getTodosFromIDB();
  const index = todos.findIndex((t) => t.id === id);
  if (index !== -1) {
    todos[index] = { ...todos[index], ...updates };
    await db.put("todos", todos, "all");
  }
}

export async function deleteTodoFromIDB(id: string) {
  const db = await dbPromise;
  const todos = await getTodosFromIDB();
  const filtered = todos.filter((t) => t.id !== id);
  await db.put("todos", filtered, "all");
}

export const todosCollection = createCollection(
  queryCollectionOptions({
    queryKey: ["todos"],
    queryFn: async () => {
      await new Promise(resolve => setTimeout(() => resolve(1), 10000))
      const data = [
        { id: '1', todo: "first dumb todo", completed: false, },
        { id: '1', todo: "second dumb todo", completed: true, }
      ]
      // update the local db.
      await saveTodosToIDB(data);
      return data as Todos;
    },
    getKey: (todo) => todo.id,
    queryClient,
  }),
);

export async function initilizeDb() {
  // this function needs to be callled before todosCollection gets initiated.
  const localTodos = await getTodosFromIDB();
  queryClient.setQueryData(["todos"], localTodos);
}
