import { internalMutation } from "./_generated/server";

const BATCH_SIZE = 4096;

async function deleteAllPaginated(db: any, tableName: string): Promise<number> {
  const { page }: { page: any[] } = await db
    .query(tableName)
    .paginate({ cursor: null, numItems: BATCH_SIZE });

  for (const item of page) {
    await db.delete(item._id);
  }
  return page.length;
}

export const cleanSkus = internalMutation({
  handler: async (ctx): Promise<void> => {
    const deleted = await deleteAllPaginated(ctx.db, "skus");
    console.log(`Cleaned ${deleted} skus`);
  },
});

export const cleanVariantOptions = internalMutation({
  handler: async (ctx): Promise<void> => {
    const deleted = await deleteAllPaginated(ctx.db, "variantOptions");
    console.log(`Cleaned ${deleted} variantOptions`);
  },
});

export const cleanVariants = internalMutation({
  handler: async (ctx): Promise<void> => {
    const deleted = await deleteAllPaginated(ctx.db, "variants");
    console.log(`Cleaned ${deleted} variants`);
  },
});
