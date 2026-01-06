import { Events, Schema, State } from "@livestore/livestore";

export const notificationsTable = State.SQLite.table({
  name: "notifications",
  columns: {
    id: State.SQLite.text({ primaryKey: true }),
    shop_id: State.SQLite.text(),
    type: State.SQLite.text(),
    title: State.SQLite.text(),
    message: State.SQLite.text(),
    data: State.SQLite.text(),
    read: State.SQLite.integer({ default: 0 }),
    createdAt: State.SQLite.integer({ schema: Schema.DateFromNumber }),
    deletedAt: State.SQLite.integer({
      nullable: true,
      schema: Schema.DateFromNumber,
    }),
  },
});

export const notificationsPartialSchema = notificationsTable.rowSchema.pipe(
  Schema.partial,
);

export const deletedSchema = Schema.Struct({
  id: Schema.String,
  deletedAt: Schema.Date,
});

export const notificationEvents = {
  notificationInserted: Events.synced({
    name: "v1.NotificationInserted",
    schema: notificationsTable.rowSchema,
  }),
  notificationPartialUpdated: Events.synced({
    name: "v1.NotificationPartialUpdated",
    schema: notificationsPartialSchema,
  }),
  notificationDeleted: Events.synced({
    name: "v1.NotificationDeleted",
    schema: deletedSchema,
  }),
};

export const notificationMaterializers = State.SQLite.materializers(
  notificationEvents,
  {
    "v1.NotificationInserted": (notification) =>
      notificationsTable.insert(notification),
    "v1.NotificationPartialUpdated": (changes) =>
      notificationsTable.update(changes).where({ id: changes.id }),
    "v1.NotificationDeleted": ({ id, deletedAt }) =>
      notificationsTable.update({ deletedAt }).where({ id }),
  },
);
