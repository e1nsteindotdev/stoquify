import { eq } from "drizzle-orm";
import { Effect, Schema } from "effect";
import { Database } from "src/database/index.js";
import { HttpApiError } from "@effect/platform";

const deleted = Schema.Struct({
  _deleted: Schema.optional(Schema.Boolean),
});

export const TodoSchema = Schema.Struct({
  id: Schema.Number,
  text: Schema.String,
  completed: Schema.Number,
  createdAt: Schema.Date,
  updatedAt: Schema.Date,
});

export const TodosPushPayloadSchema = Schema.extend(deleted, TodoSchema);

export const TodosPushHandler = ({
  payload,
}: {
  payload: Schema.Schema.Type<typeof TodosPushPayloadSchema>;
}) =>
  Effect.withLogSpan("todos-push")(
    Effect.gen(function*() {
      const { query, schema: dbSchema } = yield* Database;
      const { _deleted, id, ...data } = payload;
      if (_deleted) {
        yield* query((db) =>
          db.delete(dbSchema.todos).where(eq(dbSchema.todos.id, id)),
        );
      } else {
        const todo = yield* query((db) =>
          db.select().from(dbSchema.todos).where(eq(dbSchema.todos.id, id)),
        );
        if (todo[0]) {
          yield* query((db) =>
            db
              .update(dbSchema.todos)
              .set({ ...data })
              .where(eq(dbSchema.todos.id, id)),
          );
        } else {
          yield* query((db) => db.insert(dbSchema.todos).values({ ...data }));
        }
      }
    }).pipe(
      Effect.catchTag("DatabaseError", () =>
        Effect.fail(new HttpApiError.InternalServerError()),
      ),
    ),
  );

export const TodosPullHandler = () =>
  Effect.withLogSpan("todos-pull")(Effect.gen(function*() {
    const { query, schema: dbSchema } = yield* Database;
    const todos = yield* query((db) => db.select().from(dbSchema.todos));
    return todos ?? [];
  })).pipe(
    Effect.catchTag("DatabaseError", (e) => {
      console.log('endpoint /todosPull errored :', e)
      return Effect.succeed([])
    }))

