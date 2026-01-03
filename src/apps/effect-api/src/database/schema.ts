import * as D from "drizzle-orm/sqlite-core"

const timestamp = (name: string) => D.integer(name, { mode: "timestamp_ms" })

const common = {
  id: D.integer("id").primaryKey(),
  createdAt: timestamp("created_at").$default(() => new Date()).notNull(),
  updatedAt: timestamp("updated_at").$default(() => new Date()).notNull()
}

export const todos = D.sqliteTable("todos_table", {
  ...common,
  text: D.text().notNull(),
  completed: D.int().notNull().default(0)
})
