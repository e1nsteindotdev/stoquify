import { t } from "./trpc"
import { usersRouter } from "./modules/users/router"

export const appRouter = t.router({
  users: usersRouter
})

export type AppRouter = typeof appRouter
