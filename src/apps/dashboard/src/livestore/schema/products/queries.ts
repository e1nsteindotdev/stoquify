import { queryDb, Schema } from "@livestore/livestore";
import { shopId$ } from "../index";
import { productImagesTable, skusTable } from "./tables";
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
        SELECT id, url, indexedDBId, "displayOrder", hidden
        FROM product_images
        WHERE product_id = ? AND deletedAt IS NULL
        ORDER BY "displayOrder"
      `,
      schema: Schema.Array(
        Schema.Struct({
          id: Schema.String,
          url: Schema.String,
          indexedDBId: Schema.NullOr(Schema.Number),
          displayOrder: Schema.Number,
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
      const conditions = ["p.shop_id = ?", "p.deletedAt IS NULL"];
      const bindValues: import("@livestore/livestore").Bindable = id
        ? [shopId, id]
        : [shopId];
      if (id) {
        conditions.push("p.id = ?");
      }
      return {
        query: `
          SELECT 
            p.*,
            c.id as category_id,
            c.name as category_name,
            c.createdAt as category_createdAt,
            COALESCE((
              SELECT json_group_array(json_object(
                'id', pi.id,
                'shop_id', pi.shop_id,
                'product_id', pi.product_id,
                'url', pi.url,
                'indexedDBId', pi.indexedDBId,
                'displayOrder', pi."displayOrder",
                'hidden', pi.hidden,
                'createdAt', pi.createdAt
              )) FROM product_images pi 
              WHERE pi.product_id = p.id AND pi.deletedAt IS NULL
            ), '[]') as images,
            COALESCE((
              SELECT json_group_array(json_object(
                'id', col.id,
                'shop_id', col.shop_id,
                'name', col.name,
                'createdAt', col.createdAt,
                'deletedAt', col.deletedAt,
                'collection_product_id', cp.id
              )) FROM collections col
              INNER JOIN collection_products cp ON cp.collection_id = col.id
              WHERE cp.product_id = p.id AND col.deletedAt IS NULL
            ), '[]') as collections,
            COALESCE((
              SELECT json_group_array(json_object(
                'id', v.id,
                'shop_id', v.shop_id,
                'product_id', v.product_id,
                'name', v.name,
                'displayOrder', v."displayOrder",
                'createdAt', v.createdAt,
                'options', (
                  SELECT COALESCE(json_group_array(CAST(vo.value AS TEXT)), '[]')
                  FROM variant_options vo
                  WHERE vo.variant_id = v.id AND vo.shop_id = v.shop_id AND vo.deletedAt IS NULL AND vo.value IS NOT NULL
                ),
                'skus', (
                  SELECT COALESCE(json_group_array(json_object(
                    'id', s.id,
                    'shop_id', s.shop_id,
                    'product_id', s.product_id,
                    'quantity', s.quantity,
                    'options', json(s.options),
                    'createdAt', s.createdAt
                  )), '[]')
                  FROM product_skus s
                  WHERE s.product_id = p.id AND s.deletedAt IS NULL
                )
              )) FROM variants v
              WHERE v.product_id = p.id AND v.deletedAt IS NULL
            ), '[]') as variants
          FROM products p
          LEFT JOIN categories c ON c.id = p.category_id
          WHERE ${conditions.join(" AND ")}
        `,
        schema: Schema.Array(
          Schema.Struct({
            id: Schema.String,
            shop_id: Schema.String,
            title: Schema.String,
            desc: Schema.NullOr(Schema.String),
            price: Schema.Number,
            cost: Schema.NullOr(Schema.Number),
            status: Schema.String,
            discount: Schema.NullOr(Schema.Number),
            oldPrice: Schema.NullOr(Schema.Number),
            stockingStrategy: Schema.String,
            quantity: Schema.NullOr(Schema.Number),
            createdAt: Schema.DateFromNumber,
            category_id: Schema.NullOr(Schema.String),
            category_name: Schema.NullOr(Schema.String),
            category_createdAt: Schema.NullOr(Schema.DateFromNumber),
            images: Schema.parseJson(Schema.Array(Schema.Any)),
            collections: Schema.parseJson(
              Schema.Array(
                Schema.Struct({
                  id: Schema.String,
                  shop_id: Schema.String,
                  name: Schema.String,
                  createdAt: Schema.DateFromNumber,
                  deletedAt: Schema.NullOr(Schema.DateFromNumber),
                  collection_product_id: Schema.String,
                }),
              ),
            ),
            variants: Schema.parseJson(
              Schema.Array(
                Schema.Struct({
                  id: Schema.String,
                  shop_id: Schema.String,
                  product_id: Schema.String,
                  name: Schema.String,
                  displayOrder: Schema.Number,
                  createdAt: Schema.DateFromNumber,
                  options: Schema.Array(Schema.String),
                  skus: Schema.Array(skusTable.rowSchema),
                }),
              ),
            ),
          }),
        ),
        bindValues,
      };
    },
    {
      label: id
        ? `productsWithDetailsAndVariants-${id}`
        : "productsWithDetailsAndVariants-all",
      deps: [id],
      map: (rows) => {
        if (rows.length === 0) {
          return null;
        } else {
          return rows;
        }
      },
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
            v."displayOrder" as variant_displayOrder,
            v.createdAt as variant_createdAt,
            vo.id as option_id,
            vo.value as option_value,
            vo.createdAt as option_createdAt,
            s.id as sku_id,
            s.quantity,
            s.options as sku_options,
            s.createdAt as sku_createdAt
          FROM variants v
          LEFT JOIN variant_options vo ON vo.variant_id = v.id
          LEFT JOIN product_skus s ON s.product_id = v.product_id
          WHERE v.shop_id = ? AND v.product_id = ?
          ORDER BY v."displayOrder", v.id, vo.id, s.id
        `,
        schema: Schema.Array(
          Schema.Struct({
            variant_id: Schema.String,
            shop_id: Schema.String,
            product_id: Schema.String,
            variant_name: Schema.String,
            variant_displayOrder: Schema.Number,
            variant_createdAt: Schema.Date,
            option_id: Schema.String,
            option_value: Schema.String,
            option_createdAt: Schema.Date,
            sku_id: Schema.String,
            quantity: Schema.Number,
            sku_options: Schema.NullOr(
              Schema.parseJson(
                Schema.Record({
                  key: Schema.String,
                  value: Schema.Struct({
                    id: Schema.String,
                    value: Schema.String,
                  }),
                }),
              ),
            ),
            sku_createdAt: Schema.Date,
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
              (skuRows) => {
                const firstSku = skuRows[0];
                const skuOptions = firstSku.sku_options ?? {};

                return {
                  id: firstSku.sku_id!,
                  quantity: firstSku.quantity!,
                  createdAt: firstSku.sku_createdAt!,
                  hierarchy: Object.entries(skuOptions).map(
                    ([variantId, optionData]) => ({
                      option_id: optionData.id,
                      option_name: optionData.value,
                    }),
                  ),
                };
              },
            );

            return {
              variant_id: first.variant_id,
              shop_id: first.shop_id,
              product_id: first.product_id,
              variant_name: first.variant_name,
              variant_displayOrder: first.variant_displayOrder,
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
