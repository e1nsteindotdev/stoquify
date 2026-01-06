import { queryDb, Schema } from "@livestore/livestore";
import { shopId$ } from "../index";
import type { ProductWithDetails, VariantWithDetails } from "./types";
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
import { groupRows } from "../utils";

export const categories$ = queryDb(
  (get) => {
    const shopId = get(shopId$);
    return {
      query: `
        SELECT
          id,
          shop_id,
          name,
          createdAt
        FROM categories
        WHERE shop_id = ? AND deletedAt IS NULL
        ORDER BY name ASC
      `,
      schema: Schema.Array(
        Schema.Struct({
          id: Schema.String,
          shop_id: Schema.String,
          name: Schema.String,
          createdAt: Schema.DateFromNumber,
        }),
      ),
      bindValues: [shopId],
    };
  },
  { label: "categories" },
);

export const collections$ = queryDb(
  (get) => {
    const shopId = get(shopId$);
    return {
      query: `
        SELECT
          id,
          shop_id,
          name,
          createdAt
        FROM collections
        WHERE shop_id = ? AND deletedAt IS NULL
        ORDER BY name ASC
      `,
      schema: Schema.Array(
        Schema.Struct({
          id: Schema.String,
          shop_id: Schema.String,
          name: Schema.String,
          createdAt: Schema.DateFromNumber,
        }),
      ),
      bindValues: [shopId],
    };
  },
  { label: "collections" },
);

export const productImages$ = (productId: string) =>
  queryDb(
    () => ({
      query: `
        SELECT id, url, localUrl, "order", hidden
        FROM product_images
        WHERE product_id = ? AND deletedAt IS NULL
        ORDER BY "order"
      `,
      schema: Schema.Array(
        Schema.Struct({
          id: Schema.String,
          url: Schema.String,
          localUrl: Schema.String,
          order: Schema.Number,
          hidden: Schema.Number,
        }),
      ),
      bindValues: [productId],
    }),
    { label: `productImages-${productId}` },
  );

export const products$ = (id?: string) =>
  queryDb(
    (get) => {
      const shopId = get(shopId$);
      const conditions = ["p.shop_id = ?"];
      const bindValues: import("@livestore/livestore").Bindable = id
        ? [shopId, id]
        : [shopId];

      return {
        query: `
          SELECT 
            p.id as product_id,
            p.shop_id,
            p.title,
            p.desc,
            p.category_id as product_category_id,
            p.price,
            p.cost,
            p.status,
            p.discount,
            p.oldPrice,
            p.stockingStrategy,
            p.quantity,
            p.createdAt as product_createdAt,
            c.id as category_id,
            c.name as category_name,
            c.createdAt as category_createdAt,
            pi.id as image_id,
            pi.url as image_url,
            pi.localUrl as image_localUrl,
            pi."order" as image_order,
            pi.hidden as image_hidden,
            pi.createdAt as image_createdAt,
            col.id as collection_id,
            cp.id as collection_product_id,
            col.name as collection_name,
            v.id as variant_id,
            v.name as variant_name,
            v.createdAt as variant_createdAt,
            vo.id as option_id,
            vo.value as option_value,
            vo.createdAt as option_createdAt,
            s.id as sku_id,
            s.quantity as sku_quantity,
            s.createdAt as sku_createdAt,
            so.id as sku_option_id,
            so.option_id as sku_option_option_id
          FROM products p
          LEFT JOIN categories c ON c.id = p.category_id
          LEFT JOIN product_images pi ON pi.product_id = p.id
          LEFT JOIN collection_products cp ON cp.product_id = p.id
          LEFT JOIN collections col ON col.id = cp.collection_id
          LEFT JOIN variants v ON v.product_id = p.id
          LEFT JOIN variant_options vo ON vo.variant_id = v.id
          LEFT JOIN sku_options so ON so.option_id = vo.id
          LEFT JOIN product_skus s ON s.id = so.sku_id
          WHERE ${conditions.join(" AND ")}
          ORDER BY p.id, pi."order", v.id, vo.id, s.id
        `,
        schema: Schema.Array(
          Schema.Struct({
            product_id: Schema.String,
            shop_id: Schema.String,
            title: Schema.String,
            desc: Schema.String,
            product_category_id: Schema.String,
            price: Schema.Number,
            cost: Schema.Number,
            status: Schema.String,
            discount: Schema.NullOr(Schema.Number),
            oldPrice: Schema.NullOr(Schema.Number),
            stockingStrategy: Schema.String,
            quantity: Schema.Number,
            product_createdAt: Schema.Number,
            category_id: Schema.String,
            category_name: Schema.String,
            category_createdAt: Schema.Number,
            image_id: Schema.String,
            image_url: Schema.String,
            image_localUrl: Schema.String,
            image_order: Schema.Number,
            image_hidden: Schema.Number,
            image_createdAt: Schema.Number,
            collection_id: Schema.String,
            collection_product_id: Schema.String,
            collection_name: Schema.String,
            variant_id: Schema.String,
            variant_name: Schema.String,
            variant_order: Schema.Number,
            variant_createdAt: Schema.Number,
            option_id: Schema.String,
            option_value: Schema.String,
            option_createdAt: Schema.Number,
            sku_id: Schema.String,
            sku_quantity: Schema.Number,
            sku_createdAt: Schema.Number,
            sku_option_id: Schema.String,
            sku_option_option_id: Schema.String,
          }),
        ),
        bindValues,
      };
    },
    {
      map: (rows) => {
        return groupRows(
          rows,
          (r) => r.product_id,
          (productRows) => {
            const first = productRows[0];

            const images = groupRows(
              productRows.filter((r) => r.image_id),
              (r) => r.image_id,
              (imageRows) => {
                return {
                  id: imageRows[0].image_id!,
                  url: imageRows[0].image_url!,
                  localUrl:
                    imageRows[0].image_localUrl || imageRows[0].image_url!,
                  order: imageRows[0].image_order!,
                  hidden: imageRows[0].image_hidden!,
                }
              },
            ).sort((a, b) => a.order - b.order);

            const collections = groupRows(
              productRows.filter((r) => r.collection_id),
              (r) => r.collection_id,
              (colRows) => ({
                id: colRows[0].collection_id!,
                name: colRows[0].collection_name!,
                collection_product_id: colRows[0].collection_product_id!,
              }),
            );

            const variants = groupRows(
              productRows.filter((r) => r.variant_id),
              (r) => r.variant_id,
              (variantRows) => {
                const options = [
                  ...new Set(
                    variantRows.map((r) => r.option_value).filter(Boolean),
                  ),
                ];

                const skus = groupRows(
                  variantRows.filter((r) => r.sku_id),
                  (r) => r.sku_id,
                  (skuRows) => ({
                    id: skuRows[0].sku_id!,
                    quantity: skuRows[0].sku_quantity!,
                    createdAt: skuRows[0].sku_createdAt!,
                    hierarchy: skuRows
                      .filter((r) => r.sku_option_option_id)
                      .map((r) => ({
                        option_id: r.sku_option_option_id!,
                        option_name: r.option_value!,
                      })),
                  }),
                );

                return {
                  id: variantRows[0].variant_id!,
                  name: variantRows[0].variant_name!,
                  order: variantRows[0].variant_order!,
                  createdAt: variantRows[0].variant_createdAt!,
                  options,
                  skus,
                };
              },
            );

            return {
              id: first.product_id,
              shop_id: first.shop_id,
              title: first.title,
              desc: first.desc,
              category_id: first.product_category_id,
              price: first.price,
              cost: first.cost,
              status: first.status,
              discount: first.discount,
              oldPrice: first.oldPrice,
              stockingStrategy: first.stockingStrategy,
              quantity: first.quantity,
              createdAt: first.product_createdAt,
              category: first.category_id ? { id: first.category_id, name: first.category_name } : null,
              images,
              collections,
              variants,
            };
          },
        );
      },
      label: "productsWithDetailsAndVariants",
    },
  );

export const variants$ = (productId: string) =>
  queryDb(
    (get) => {
      const shopId = get(shopId$);

      return {
        query: `
          SELECT 
            v.id as variant_id,
            v.shop_id,
            v.product_id,
            v.name as variant_name,
            v."order" as variant_order,
            v.createdAt as variant_createdAt,
            vo.id as option_id,
            vo.value as option_value,
            vo.createdAt as option_createdAt,
            s.id as sku_id,
            s.quantity,
            s.createdAt as sku_createdAt,
            so.id as sku_option_id,
            so.option_id as sku_option_option_id
          FROM variants v
          LEFT JOIN variant_options vo ON vo.variant_id = v.id
          LEFT JOIN sku_options so ON so.option_id = vo.id
          LEFT JOIN product_skus s ON s.id = so.sku_id
          WHERE v.shop_id = ? AND v.product_id = ?
          ORDER BY v."order", v.id, vo.id, s.id
        `,
        schema: Schema.Array(
          Schema.Struct({
            variant_id: Schema.String,
            shop_id: Schema.String,
            product_id: Schema.String,
            variant_name: Schema.String,
            variant_order: Schema.Number,
            variant_createdAt: Schema.Date,
            option_id: Schema.String,
            option_value: Schema.String,
            option_createdAt: Schema.Date,
            sku_id: Schema.String,
            quantity: Schema.Number,
            sku_createdAt: Schema.Date,
            sku_option_id: Schema.String,
            sku_option_option_id: Schema.String,
          }),
        ),
        bindValues: [shopId, productId],
      };
    },
    {
      map: (rows) => {
        return groupRows(
          rows,
          (r) => r.variant_id,
          (variantRows) => {
            const first = variantRows[0];

            const options = groupRows(
              variantRows.filter((r) => r.option_id),
              (r) => r.option_id,
              (optionRows) => ({
                id: optionRows[0].option_id!,
                value: optionRows[0].option_value!,
                createdAt: optionRows[0].option_createdAt!,
              }),
            );

            const skus = groupRows(
              variantRows.filter((r) => r.sku_id),
              (r) => r.sku_id,
              (skuRows) => ({
                id: skuRows[0].sku_id!,
                quantity: skuRows[0].quantity!,
                createdAt: skuRows[0].sku_createdAt!,
                hierarchy: skuRows
                  .filter((r) => r.sku_option_option_id)
                  .map((r) => {
                    const option = options.find(
                      (o) => o.id === r.sku_option_option_id,
                    );
                    return {
                      option_id: r.sku_option_option_id!,
                      option_name: option?.value ?? "",
                    };
                  }),
              }),
            );

            return {
              variant_id: first.variant_id,
              shop_id: first.shop_id,
              product_id: first.product_id,
              variant_name: first.variant_name,
              variant_order: first.variant_order,
              variant_createdAt: first.variant_createdAt,
              options: options.map((o) => o.value),
              skus,
            };
          },
        );
      },
      label: "variantsWithSkus",
    },
  );
