import { Events, Schema, State } from '@livestore/livestore'

export const ordersTable = State.SQLite.table({
  name: "orders",
  columns: {
    id: State.SQLite.text({ primaryKey: true }),
    address: State.SQLite.text(),
    status: State.SQLite.text(),
    deletedAt: State.SQLite.integer({ nullable: true, schema: Schema.DateFromNumber }),
  }
})

export const ordersEvents = {
  orderCreated: Events.synced({
    name: 'v1.OrderCreated',
    schema: Schema.Struct({ id: Schema.String, address: Schema.String, status: Schema.String }),
  }),
  orderUpdated: Events.synced({
    name: 'v1.OrderUpdated',
    schema: Schema.Struct({ id: Schema.String, address: Schema.String, status: Schema.String }),
  }),

  todoDeleted: Events.synced({
    name: 'v1.OrderDeleted',
    schema: Schema.Struct({ id: Schema.String, deletedAt: Schema.Date }),
  }),

}

export const ordersMaterializers = State.SQLite.materializers(ordersEvents, {
  'v1.OrderCreated': ({ id, address, status }) => ordersTable.insert({ id, address, status }),
  'v1.OrderUpdated': ({ id, address, status }) => ordersTable.update({ address, status }).where({ id }),
  'v1.OrderDeleted': ({ id, deletedAt }) => ordersTable.update({ deletedAt }).where({ id }),
})

