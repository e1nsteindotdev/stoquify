import { queryDb, Schema } from "@livestore/livestore";
import { shopId$ } from "../index";

export const orders$ = () =>
  queryDb(
    (get) => {
      const shopId = get(shopId$);
      return {
        query: `
          SELECT 
            id,
            shop_id,
            address,
            status,
            createdAt,
            deletedAt
          FROM orders
          WHERE shop_id = ? AND deletedAt IS NULL
          ORDER BY createdAt DESC
        `,
        schema: Schema.Array(
          Schema.Struct({
            id: Schema.String,
            shop_id: Schema.String,
            address: Schema.parseJson(
              Schema.Struct({
                firstName: Schema.String,
                lastName: Schema.String,
                phoneNumber: Schema.Number,
                wilaya: Schema.String,
                address: Schema.String,
              }),
            ),
            status: Schema.String,
            createdAt: Schema.DateFromNumber,
            deletedAt: Schema.optional(Schema.NullOr(Schema.DateFromNumber)),
          }),
        ),
        bindValues: [shopId],
      };
    },
    {
      label: "orders-all",
    },
  );
