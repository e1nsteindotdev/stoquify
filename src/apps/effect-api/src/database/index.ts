import { drizzle } from "drizzle-orm/d1";
import { Data, Effect, Layer, Context } from "effect";
import { D1 } from "src/services/d1.js";
import * as schema from "./schema.js";

export const getDb = Effect.gen(function*() {
  const d1 = yield* D1;
  return drizzle(d1);
});

export class DatabaseError extends Data.TaggedError("DatabaseError")<{
  message?: string;
  readonly cause: unknown;
}> { }

interface DatabaseService {
  readonly db: ReturnType<typeof drizzle>;
  readonly query: <T>(
    fn: (client: ReturnType<typeof drizzle>) => Promise<T>,
  ) => Effect.Effect<T, DatabaseError>;
  readonly schema: typeof schema;
}

class Database extends Context.Tag("Database")<Database, DatabaseService>() { }

export const DatabaseLayer = Layer.effect(
  Database,
  Effect.gen(function*() {
    const db = yield* getDb;
    // const env_vars = yield* ApiConfig;
    // const shouldMigrate = env_vars.dbShouldMigrate;
    // if (shouldMigrate) {
    //   yield* Effect.tryPromise({
    //     try: async () => {
    //       return migrate(db, { migrationsFolder: "./drizzle" });
    //     },
    //     catch: (e) => {
    //       console.error("Migration error:", e);
    //       return new DatabaseError({
    //         message: `Migration Failed: ${e instanceof Error ? e.message : String(e)}`,
    //         cause: e,
    //       });
    //     },
    //   });
    //   yield* Effect.log("Migrations completed.");
    // }

    const query = <T>(fn: (client: typeof db) => Promise<T>) =>
      Effect.tryPromise({
        try: () => fn(db),
        catch: (cause) => {
          return new DatabaseError({ message: "Query failed", cause });
        },
      });

    return { db, query, schema };
  }),
);

export { Database };
