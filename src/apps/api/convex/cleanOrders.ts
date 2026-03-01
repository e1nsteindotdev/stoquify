import { internalMutation } from "./_generated/server";

async function deleteAllPaginated(db: any, tableName: string): Promise<number> {
  const batchSize = 128;
  const maxDelete = 1000;
  let deleted = 0;

  while (deleted < maxDelete) {
    const items = await db.query(tableName).take(batchSize);
    if (items.length === 0) break;

    for (const item of items) {
      await db.delete(item._id);
    }
    deleted += items.length;
  }

  return deleted;
}

export const cleanOrders = internalMutation({
  handler: async (ctx): Promise<void> => {
    const deleted = await deleteAllPaginated(ctx.db, "orders");
    console.log(`Cleaned ${deleted} orders`);
  },
});

export const cleanSales = internalMutation({
  handler: async (ctx): Promise<void> => {
    const deleted = await deleteAllPaginated(ctx.db, "sales");
    console.log(`Cleaned ${deleted} sales`);
  },
});
