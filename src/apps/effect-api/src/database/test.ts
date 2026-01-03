import { Effect } from "effect";
import { Database } from "./index.js";

const program = Effect.gen(function*() {
  const { query, schema } = yield* Database
  return yield* query(db => db.select().from(schema.todos))
})
