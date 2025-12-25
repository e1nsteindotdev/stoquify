import { usersRouter } from "./modules/users/router"
import { t } from "./trpc"

export const appRouter = t.router({
  users: usersRouter
})

export type AppRouter = typeof appRouter