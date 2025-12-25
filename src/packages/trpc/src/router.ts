import { Effect, Layer, ManagedRuntime } from "effect"
import * as z from "zod"
import { initEffectTRPC } from "./lib/effect-trpc-adapter/trpcWrapper"

type User = { id: string; name: string }

const users: Array<User> = []

// Define your services
class UserService extends Effect.Tag("UserService")<
  UserService,
  {
    findById: (id: string) => Effect.Effect<User | undefined>
    findAll: () => Effect.Effect<Array<User>>
    create: (name: string) => Effect.Effect<User>
  }
>() { }

// Create service implementation
const UserServiceLive = Layer.succeed(UserService, {
  findById: (id) => Effect.succeed(users.find((u) => u.id === id)),
  findAll: () => Effect.succeed(users),
  create: (name) => Effect.succeed({ id: String(crypto.randomUUID()), name })
})

// Create runtime with your services
const runtime = ManagedRuntime.make(UserServiceLive)

// Create Effect-aware tRPC instance
const t = initEffectTRPC.create({ runtime })

// Define your router
export const appRouter = t.router({
  // Standard tRPC procedure
  health: t.procedure.query(() => "ok"),

  // Effect procedure with service injection
  users: {
    getById: t.effect
      .input(z.object({ id: z.string() }))
      .query(function*({ input }) {
        const userService = yield* UserService
        return yield* userService.findById(input.id)
      }),

    list: t.effect.query(function*() {
      const userService = yield* UserService
      return yield* userService.findAll()
    }),

    create: t.effect
      .input(z.object({ name: z.string() }))
      .mutation(function*({ input }) {
        const userService = yield* UserService
        return yield* userService.create(input.name)
      })
  }
})

export type AppRouter = typeof appRouter
