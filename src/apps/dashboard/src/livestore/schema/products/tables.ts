import { Schema, State } from "@livestore/livestore";

export const productsTable = State.SQLite.table({
  name: "products",
  columns: {
    id: State.SQLite.text({ primaryKey: true }),
    shop_id: State.SQLite.text(),
    title: State.SQLite.text(),
    desc: State.SQLite.text({ nullable: true }),
    category_id: State.SQLite.text(),
    price: State.SQLite.real({ default: 0 }),
    cost: State.SQLite.real({ nullable: true }),
    status: State.SQLite.text({ default: "incomplete" }),
    discount: State.SQLite.real({ nullable: true }),
    oldPrice: State.SQLite.real({ nullable: true }),
    stockingStrategy: State.SQLite.text({ default: "by_variants" }),
    quantity: State.SQLite.integer({ nullable: true }),
    createdAt: State.SQLite.integer({ schema: Schema.DateFromNumber }),
    deletedAt: State.SQLite.integer({
      nullable: true,
      schema: Schema.DateFromNumber,
    }),
  },
});

export const categoriesTable = State.SQLite.table({
  name: "categories",
  columns: {
    id: State.SQLite.text({ primaryKey: true }),
    shop_id: State.SQLite.text(),
    name: State.SQLite.text(),
    createdAt: State.SQLite.integer({ schema: Schema.DateFromNumber }),
    deletedAt: State.SQLite.integer({
      nullable: true,
      schema: Schema.DateFromNumber,
    }),
  },
});

export const productImagesTable = State.SQLite.table({
  name: "product_images",
  columns: {
    id: State.SQLite.text({ primaryKey: true }),
    shop_id: State.SQLite.text(),
    product_id: State.SQLite.text(),
    url: State.SQLite.text(),
    localUrl: State.SQLite.text({ nullable: true }),
    order: State.SQLite.integer(),
    hidden: State.SQLite.integer({ default: 0 }),
    createdAt: State.SQLite.integer({ schema: Schema.DateFromNumber }),
    deletedAt: State.SQLite.integer({
      nullable: true,
      schema: Schema.DateFromNumber,
    }),
  },
});

export const variantsTable = State.SQLite.table({
  name: "variants",
  columns: {
    id: State.SQLite.text({ primaryKey: true }),
    shop_id: State.SQLite.text(),
    product_id: State.SQLite.text(),
    name: State.SQLite.text(),
    order: State.SQLite.integer({ default: 0 }),
    createdAt: State.SQLite.integer({ schema: Schema.DateFromNumber }),
    deletedAt: State.SQLite.integer({
      nullable: true,
      schema: Schema.DateFromNumber,
    }),
  },
});

export const variantOptionsTable = State.SQLite.table({
  name: "variant_options",
  columns: {
    id: State.SQLite.text({ primaryKey: true }),
    shop_id: State.SQLite.text(),
    variant_id: State.SQLite.text(),
    value: State.SQLite.text(),
    createdAt: State.SQLite.integer({ schema: Schema.DateFromNumber }),
    deletedAt: State.SQLite.integer({
      nullable: true,
      schema: Schema.DateFromNumber,
    }),
  },
});

export const skusTable = State.SQLite.table({
  name: "product_skus",
  columns: {
    id: State.SQLite.text({ primaryKey: true }),
    shop_id: State.SQLite.text(),
    product_id: State.SQLite.text(),
    quantity: State.SQLite.integer(),
    createdAt: State.SQLite.integer({ schema: Schema.DateFromNumber }),
    deletedAt: State.SQLite.integer({
      nullable: true,
      schema: Schema.DateFromNumber,
    }),
  },
});

export const skuOptionsTable = State.SQLite.table({
  name: "sku_options",
  columns: {
    id: State.SQLite.text({ primaryKey: true }),
    shop_id: State.SQLite.text(),
    sku_id: State.SQLite.text(),
    option_id: State.SQLite.text(),
    createdAt: State.SQLite.integer({ schema: Schema.DateFromNumber }),
    deletedAt: State.SQLite.integer({
      nullable: true,
      schema: Schema.DateFromNumber,
    }),
  },
});

export const collectionsTable = State.SQLite.table({
  name: "collections",
  columns: {
    id: State.SQLite.text({ primaryKey: true }),
    shop_id: State.SQLite.text(),
    name: State.SQLite.text(),
    createdAt: State.SQLite.integer({ schema: Schema.DateFromNumber }),
    deletedAt: State.SQLite.integer({
      nullable: true,
      schema: Schema.DateFromNumber,
    }),
  },
});

export const collectionProductsTable = State.SQLite.table({
  name: "collection_products",
  columns: {
    id: State.SQLite.text({ primaryKey: true }),
    shop_id: State.SQLite.text(),
    collection_id: State.SQLite.text(),
    product_id: State.SQLite.text(),
    createdAt: State.SQLite.integer({ schema: Schema.DateFromNumber }),
    deletedAt: State.SQLite.integer({
      nullable: true,
      schema: Schema.DateFromNumber,
    }),
  },
});

export const productPartialSchema = productsTable.rowSchema.pipe(
  Schema.partial,
);
export const categoryPartialSchema = categoriesTable.rowSchema.pipe(
  Schema.partial,
);
export const productImagePartialSchema = productImagesTable.rowSchema.pipe(
  Schema.partial,
);
export const variantPartialSchema = variantsTable.rowSchema.pipe(
  Schema.partial,
);
export const skuPartialSchema = skusTable.rowSchema.pipe(Schema.partial);
export const collectionPartialSchema = collectionsTable.rowSchema.pipe(
  Schema.partial,
);
export const deletedSchema = Schema.Struct({
  id: Schema.String,
  deletedAt: Schema.Date,
});
