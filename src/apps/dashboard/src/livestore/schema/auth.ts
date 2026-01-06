import { Events, Schema, State } from "@livestore/livestore";

const organizationsTable = State.SQLite.table({
  name: "organizations",
  columns: {
    id: State.SQLite.text({ primaryKey: true }),
    organization_name: State.SQLite.text(),
    createdAt: State.SQLite.integer({ schema: Schema.DateFromNumber }),
    deletedAt: State.SQLite.integer({
      nullable: true,
      schema: Schema.DateFromNumber,
    }),
  },
});

const usersTable = State.SQLite.table({
  name: "users",
  columns: {
    id: State.SQLite.text({ primaryKey: true }),
    first_name: State.SQLite.text(),
    last_name: State.SQLite.text(),
    phone_number: State.SQLite.text(),
    email: State.SQLite.text({ nullable: true }),
    role: State.SQLite.text(),
    createdAt: State.SQLite.integer({ schema: Schema.DateFromNumber }),
    deletedAt: State.SQLite.integer({
      nullable: true,
      schema: Schema.DateFromNumber,
    }),
  },
});

const shopsTable = State.SQLite.table({
  name: "shops",
  columns: {
    id: State.SQLite.text({ primaryKey: true }),
    name: State.SQLite.text(),
    organization_id: State.SQLite.text(),
    createdAt: State.SQLite.integer({ schema: Schema.DateFromNumber }),
    deletedAt: State.SQLite.integer({
      nullable: true,
      schema: Schema.DateFromNumber,
    }),
  },
});

export const authTables = {
  organizationsTable,
  usersTable,
  shopsTable,
};

const orgPartialSchema = organizationsTable.rowSchema.pipe(Schema.partial);
const userPartialSchema = usersTable.rowSchema.pipe(Schema.partial);
const shopPartialSchema = shopsTable.rowSchema.pipe(Schema.partial);
const deletedSchema = Schema.Struct({
  id: Schema.String,
  deletedAt: Schema.Date,
});

export const authEvents = {
  orgCreated: Events.synced({
    name: "v1.OrgCreated",
    schema: organizationsTable.rowSchema,
  }),
  orgUpdated: Events.synced({
    name: "v1.OrgUpdated",
    schema: orgPartialSchema,
  }),
  orgDeleted: Events.synced({
    name: "v1.OrgDeleted",
    schema: deletedSchema,
  }),
  userCreated: Events.synced({
    name: "v1.UserCreated",
    schema: usersTable.rowSchema,
  }),
  userUpdated: Events.synced({
    name: "v1.UserUpdated",
    schema: userPartialSchema,
  }),
  userDeleted: Events.synced({
    name: "v1.UserDeleted",
    schema: deletedSchema,
  }),
  shopCreated: Events.synced({
    name: "v1.ShopCreated",
    schema: shopsTable.rowSchema,
  }),
  shopUpdated: Events.synced({
    name: "v1.ShopUpdated",
    schema: shopPartialSchema,
  }),
  shopDeleted: Events.synced({
    name: "v1.ShopDeleted",
    schema: deletedSchema,
  }),
};

export const authMaterializers = State.SQLite.materializers(authEvents, {
  "v1.OrgCreated": ({ id, organization_name, createdAt }) =>
    authTables.organizationsTable.insert({ id, organization_name, createdAt }),
  "v1.OrgUpdated": ({ id, organization_name }) =>
    authTables.organizationsTable.update({ organization_name }).where({ id }),
  "v1.OrgDeleted": ({ id, deletedAt }) =>
    authTables.organizationsTable.update({ deletedAt }).where({ id }),
  "v1.UserCreated": ({
    id,
    first_name,
    last_name,
    phone_number,
    email,
    role,
    createdAt,
  }) =>
    authTables.usersTable.insert({
      id,
      first_name,
      last_name,
      phone_number,
      email,
      role,
      createdAt,
    }),
  "v1.UserUpdated": ({
    id,
    first_name,
    last_name,
    phone_number,
    email,
    role,
  }) =>
    authTables.usersTable
      .update({ first_name, last_name, phone_number, email, role })
      .where({ id }),
  "v1.UserDeleted": ({ id, deletedAt }) =>
    authTables.usersTable.update({ deletedAt }).where({ id }),
  "v1.ShopCreated": ({ id, name, organization_id, createdAt }) =>
    authTables.shopsTable.insert({ id, name, organization_id, createdAt }),
  "v1.ShopUpdated": ({ id, name, organization_id }) =>
    authTables.shopsTable.update({ name, organization_id }).where({ id }),
  "v1.ShopDeleted": ({ id, deletedAt }) =>
    authTables.shopsTable.update({ deletedAt }).where({ id }),
});
