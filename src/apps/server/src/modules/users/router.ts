import * as z from "zod"

import { t } from "../../trpc"
import { UserService } from "./services"

export const usersRouter = {
  getById: t.effect
    .input(z.object({ id: z.string() }))
    .query(function*({ input }) {
      //      const db = yield* D1
      const userService = yield* UserService
      return yield* userService.findById(input.id)
    }),

  list: t.effect.query(function*() {
    // const userService = yield* UserService
    // const result = yield* userService.list()
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
