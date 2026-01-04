import { Events, Schema, State } from '@livestore/livestore'



const users = State.SQLite.table({
  name: "users",
  columns: {
    id: State.SQLite.text({ primaryKey: true }),
  }
})

const shops = State.SQLite.table({
  name: "organizations",
  columns: {
    id: State.SQLite.text({ primaryKey: true }),
  }
})

export const authTables = {
  users,
  shops
}

// Events describe data changes (https://docs.livestore.dev/reference/events)
export const authEvents = {
  todoCreated: Events.synced({
    name: 'v1.TodoCreated',
    schema: Schema.Struct({ id: Schema.String, text: Schema.String }),
  }),
  todoCompleted: Events.synced({
    name: 'v1.TodoCompleted',
    schema: Schema.Struct({ id: Schema.String }),
  }),
  todoUncompleted: Events.synced({
    name: 'v1.TodoUncompleted',
    schema: Schema.Struct({ id: Schema.String }),
  }),
  todoDeleted: Events.synced({
    name: 'v1.TodoDeleted',
    schema: Schema.Struct({ id: Schema.String, deletedAt: Schema.Date }),
  }),
  todoClearedCompleted: Events.synced({
    name: 'v1.TodoClearedCompleted',
    schema: Schema.Struct({ deletedAt: Schema.Date }),
  }),
}

export const authMaterializers = State.SQLite.materializers(authEvents, {
  'v1.OrgCreated': ({ id, text }) => authTables.organizations.insert({ id }),
})

