import * as z from "zod"

import { users } from "@/database/schema"
import { D1 } from "@/services/d1"
import { drizzle } from "drizzle-orm/d1"
import { Effect } from "effect"
import { t, TRPCContext } from "../../trpc"
import { UserService } from "./services"

export const usersRouter = {
  getById: t.effect
    .input(z.object({ id: z.string() }))
    .query(function*({ input }) {
      const userService = yield* UserService
      return yield* userService.findById(input.id)
    }),

  list: t.effect.query(function*() {
    // const userService = yield* UserService
    // const result = yield* userService.list()
    const db = drizzle(yield* D1)

    const dbTest = Effect.tryPromise({
      try: () => db.select().from(users).all(),
      catch: () => console.log("got error getting users")
    })
    Effect.runPromise(dbTest)

    const ctx = yield* TRPCContext
    const message = ctx.my_service
    console.log("the message :", message)

    const result = [{ name: "ahmed", id: "1" }, { name: "fateh", id: "2" }]
    return result
  }),

  create: t.effect
    .input(z.object({ name: z.string() }))
    .mutation(function*({ input }) {
      const userService = yield* UserService
      return yield* userService.create(input.name)
    })
}
