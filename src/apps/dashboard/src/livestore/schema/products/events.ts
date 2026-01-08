import { Events, Schema } from "@livestore/livestore";
import {
  productsTable,
  categoriesTable,
  productImagesTable,
  variantsTable,
  variantOptionsTable,
  skusTable,
  skuOptionsTable,
  collectionsTable,
  collectionProductsTable,
  productPartialSchema,
  categoryPartialSchema,
  productImagePartialSchema,
  variantPartialSchema,
  skuPartialSchema,
  collectionPartialSchema,
  deletedSchema,
} from "./tables";

const variantInsertedSchema = Schema.Struct({
  id: Schema.String,
  shop_id: Schema.String,
  product_id: Schema.String,
  name: Schema.String,
  createdAt: Schema.Date,
  options: Schema.Array(
    Schema.Struct({
      id: Schema.String,
      value: Schema.String,
      createdAt: Schema.Date,
    }),
  ),
  skus: Schema.Array(
    Schema.Struct({
      id: Schema.String,
      quantity: Schema.Number,
      createdAt: Schema.Date,
      option_ids: Schema.Array(Schema.String),
    }),
  ),
});

export const productEvents = {
  productInserted: Events.synced({
    name: "v1.ProductInserted",
    schema: productsTable.rowSchema,
  }),
  productPartialUpdated: Events.synced({
    name: "v1.ProductPartialUpdated",
    schema: productPartialSchema,
  }),
  productDeleted: Events.synced({
    name: "v1.ProductDeleted",
    schema: deletedSchema,
  }),
  categoryInserted: Events.synced({
    name: "v1.CategoryInserted",
    schema: categoriesTable.rowSchema,
  }),
  categoryPartialUpdated: Events.synced({
    name: "v1.CategoryPartialUpdated",
    schema: categoryPartialSchema,
  }),
  categoryDeleted: Events.synced({
    name: "v1.CategoryDeleted",
    schema: deletedSchema,
  }),
  productImageInserted: Events.synced({
    name: "v1.ProductImageInserted",
    schema: productImagesTable.rowSchema,
  }),
  productImagePartialUpdated: Events.synced({
    name: "v1.ProductImagePartialUpdated",
    schema: productImagePartialSchema,
  }),
  productImageDeleted: Events.synced({
    name: "v1.ProductImageDeleted",
    schema: deletedSchema,
  }),
  variantOptionInserted: Events.synced({
    name: "v1.VariantOptionInserted",
    schema: variantOptionsTable.rowSchema,
  }),
  variantOptionDeleted: Events.synced({
    name: "v1.VariantOptionDeleted",
    schema: deletedSchema,
  }),
  skuOptionInserted: Events.synced({
    name: "v1.SkuOptionInserted",
    schema: skuOptionsTable.rowSchema,
  }),
  skuOptionDeleted: Events.synced({
    name: "v1.SkuOptionDeleted",
    schema: deletedSchema,
  }),
  variantInserted: Events.synced({
    name: "v1.VariantInserted",
    schema: variantInsertedSchema,
  }),
  variantPartialUpdated: Events.synced({
    name: "v1.VariantPartialUpdated",
    schema: variantPartialSchema,
  }),
  variantOrderUpdated: Events.clientOnly({
    name: "v1.VariantOrderUpdated",
    schema: Schema.Struct({
      id: Schema.String,
      displayOrder: Schema.Number,
    }),
  }),
  variantDeleted: Events.synced({
    name: "v1.VariantDeleted",
    schema: deletedSchema,
  }),
  skuInserted: Events.synced({
    name: "v1.SkuInserted",
    schema: skusTable.rowSchema,
  }),
  skuPartialUpdated: Events.synced({
    name: "v1.SkuPartialUpdated",
    schema: skuPartialSchema,
  }),
  skuDeleted: Events.synced({
    name: "v1.SkuDeleted",
    schema: deletedSchema,
  }),
  collectionInserted: Events.synced({
    name: "v1.CollectionInserted",
    schema: collectionsTable.rowSchema,
  }),
  collectionPartialUpdated: Events.synced({
    name: "v1.CollectionPartialUpdated",
    schema: collectionPartialSchema,
  }),
  collectionDeleted: Events.synced({
    name: "v1.CollectionDeleted",
    schema: deletedSchema,
  }),
  collectionProductInserted: Events.synced({
    name: "v1.CollectionProductInserted",
    schema: collectionProductsTable.rowSchema,
  }),
  collectionProductDeleted: Events.synced({
    name: "v1.CollectionProductDeleted",
    schema: deletedSchema,
  }),
  productImagesProductIdSet: Events.clientOnly({
    name: "v1.ProductImagesProductIdSet",
    schema: Schema.Struct({
      imageIds: Schema.Array(Schema.String),
      productId: Schema.String,
    }),
  }),
  productImagesReordered: Events.clientOnly({
    name: "v1.ProductImagesReordered",
    schema: Schema.Array(
      Schema.Struct({
        id: Schema.String,
        displayOrder: Schema.Number,
      }),
    ),
  }),
};
