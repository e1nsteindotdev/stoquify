import { Effect, Layer } from "effect"

type User = { id: string; name: string }

const users: Array<User> = []

// Define your services
export class UserService extends Effect.Tag("UserService")<
  UserService,
  {
    findById: (id: string) => Effect.Effect<User | undefined>
    list: () => Effect.Effect<Array<User>>
    create: (name: string) => Effect.Effect<User>
  }
>() { }

// Create service implementation
export const UserServiceLive = Layer.succeed(UserService, {
  findById: (id) => Effect.succeed(users.find((u) => u.id === id)),
  list: () => Effect.succeed(users),
  create: (name) => Effect.succeed({ id: String(crypto.randomUUID()), name })
})
