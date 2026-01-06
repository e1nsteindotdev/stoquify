import { Events, Schema, State } from "@livestore/livestore";

export const ordersTable = State.SQLite.table({
  name: "orders",
  columns: {
    id: State.SQLite.text({ primaryKey: true }),
    shop_id: State.SQLite.text(),
    address: State.SQLite.text(),
    status: State.SQLite.text(),
    createdAt: State.SQLite.integer({ schema: Schema.DateFromNumber }),
    deletedAt: State.SQLite.integer({
      nullable: true,
      schema: Schema.DateFromNumber,
    }),
  },
});

const orderPartialSchema = ordersTable.rowSchema.pipe(Schema.partial);
const deletedSchema = Schema.Struct({
  id: Schema.String,
  deletedAt: Schema.Date,
});

export const ordersEvents = {
  orderCreated: Events.synced({
    name: "v1.OrderCreated",
    schema: ordersTable.rowSchema,
  }),
  orderUpdated: Events.synced({
    name: "v1.OrderUpdated",
    schema: orderPartialSchema,
  }),

  orderDeleted: Events.synced({
    name: "v1.OrderDeleted",
    schema: deletedSchema,
  }),
};

export const ordersMaterializers = State.SQLite.materializers(ordersEvents, {
  "v1.OrderCreated": ({ id, shop_id, address, status, createdAt }) =>
    ordersTable.insert({ id, shop_id, address, status, createdAt }),
  "v1.OrderUpdated": ({ id, shop_id, address, status }) =>
    ordersTable.update({ shop_id, address, status }).where({ id }),
  "v1.OrderDeleted": ({ id, deletedAt }) =>
    ordersTable.update({ deletedAt }).where({ id }),
});
