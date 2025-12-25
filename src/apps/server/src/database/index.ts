import { D1 } from "@/services/d1"
import { drizzle } from "drizzle-orm/d1"
import { Effect } from "effect"

export const getDb = Effect.gen(function*() {
  const d1 = yield* D1
  return drizzle(d1)
})
