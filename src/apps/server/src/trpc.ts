import { Layer, ManagedRuntime } from "effect"
import { initEffectTRPC } from "./lib/effect-trpc-adapter/trpcWrapper"
import { UserServiceLive } from "./modules/users/services"
import { D1 } from "./services/d1"

export type Context = {
  d1: D1Database
}

const D1Live = Layer.succeed(D1, {} as D1Database)

const runtime = ManagedRuntime.make(UserServiceLive.pipe(Layer.merge(D1Live)))

export const t = initEffectTRPC.context<Context>().create({ runtime })
