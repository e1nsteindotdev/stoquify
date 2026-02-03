import { State } from "@livestore/livestore";
import { productEvents } from "./events";
import {
  productsTable,
  categoriesTable,
  productImagesTable,
  variantsTable,
  variantOptionsTable,
  skusTable,
  collectionsTable,
  collectionProductsTable,
} from "./tables";

export const productMaterializers = State.SQLite.materializers(productEvents, {
  "v1.ProductInserted": (product, { query }) => {
    const existing = query(productsTable.select().where({ id: product.id }));
    if (existing.length > 0) {
      const result = productsTable.update(product).where({ id: product.id });
      return result;
    }
    const result = productsTable.insert(product);
    return result;
  },
  "v1.ProductPartialUpdated": (changes) =>
    productsTable.update(changes).where({ id: changes.id }),
  "v1.ProductDeleted": ({ id, deletedAt }) =>
    productsTable.update({ deletedAt }).where({ id }),
  "v1.CategoryInserted": (category) => categoriesTable.insert(category),
  "v1.CategoryPartialUpdated": (changes) =>
    categoriesTable.update(changes).where({ id: changes.id }),
  "v1.CategoryDeleted": ({ id, deletedAt }) =>
    categoriesTable.update({ deletedAt }).where({ id }),
  "v1.ProductImageInserted": (image, { query }) => {
    const existing = query(productImagesTable.select().where({ id: image.id }));
    if (existing.length > 0) {
      return productImagesTable.update(image).where({ id: image.id });
    }
    return productImagesTable.insert(image);
  },
  "v1.ProductImagePartialUpdated": (changes) =>
    productImagesTable.update(changes).where({ id: changes.id }),
  "v1.ProductImageDeleted": ({ id, deletedAt }) =>
    productImagesTable.update({ deletedAt }).where({ id }),
  "v1.VariantOptionInserted": (option) => variantOptionsTable.insert(option),
  "v1.VariantOptionDeleted": ({ id, deletedAt }) =>
    variantOptionsTable.update({ deletedAt }).where({ id }),
  "v1.VariantInserted": (data) => {
    const { options, skus, ...variant } = data;
    const operations: any[] = [variantsTable.insert(variant)];

    for (const opt of options ?? []) {
      operations.push(
        variantOptionsTable.insert({
          id: opt.id,
          shop_id: variant.shop_id,
          variant_id: variant.id,
          value: opt.value,
          createdAt: opt.createdAt,
        }),
      );
    }

    for (const sku of skus ?? []) {
      operations.push(
        skusTable.insert({
          id: sku.id,
          shop_id: variant.shop_id,
          product_id: variant.product_id,
          quantity: sku.quantity,
          options: sku.options, // JSON object: { "variantKey": { "id": "optionId", "value": "Red" }, ... }
          createdAt: sku.createdAt,
        }),
      );
    }

    return operations;
  },
  "v1.VariantPartialUpdated": (changes) =>
    variantsTable.update(changes).where({ id: changes.id }),
  "v1.VariantOrderUpdated": ({ id, displayOrder }) =>
    variantsTable.update({ displayOrder }).where({ id }),
  "v1.VariantDeleted": ({ id, deletedAt }) =>
    variantsTable.update({ deletedAt }).where({ id }),
  "v1.SkuInserted": (sku) => skusTable.insert(sku),
  "v1.SkuPartialUpdated": (changes) =>
    skusTable.update(changes).where({ id: changes.id }),
  "v1.SkuDeleted": ({ id, deletedAt }) =>
    skusTable.update({ deletedAt }).where({ id }),
  "v1.CollectionInserted": (collection) => collectionsTable.insert(collection),
  "v1.CollectionPartialUpdated": (changes) =>
    collectionsTable.update(changes).where({ id: changes.id }),
  "v1.CollectionDeleted": ({ id, deletedAt }) =>
    collectionsTable.update({ deletedAt }).where({ id }),
  "v1.CollectionProductInserted": (cp) => collectionProductsTable.insert(cp),
  "v1.CollectionProductDeleted": ({ id, deletedAt }) =>
    collectionProductsTable.update({ deletedAt }).where({ id }),
  "v1.ProductImagesProductIdSet": ({ imageIds, productId }) => {
    return imageIds.map((id) =>
      productImagesTable.update({ product_id: productId }).where({ id }),
    );
  },
  "v1.ProductImagesReordered": (updates) => {
    return updates.map(({ id, displayOrder }) =>
      productImagesTable.update({ displayOrder }).where({ id }),
    );
  },
});
