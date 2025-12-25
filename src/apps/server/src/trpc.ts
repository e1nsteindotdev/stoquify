import { Context, Layer, ManagedRuntime } from "effect"
import { initEffectTRPC } from "./lib/effect-trpc-adapter/trpcWrapper"
import { UserServiceLive } from "./modules/users/services"
import { D1 } from "./services/d1"
import { MyService } from "./services/my-service"

export interface TRPCContextShape {
  d1: D1Database
  my_service: { message: string }
}

export class TRPCContext extends Context.Tag("TRPCContext")<TRPCContext, TRPCContextShape>() {}

const D1Live = Layer.succeed(D1, {} as D1Database)
// const MyServiceLive = Layer.succeed(MyService, { message: "hello world" })

const runtime = ManagedRuntime.make(UserServiceLive.pipe(
  Layer.merge(D1Live),
  // Layer.merge(MyServiceLive)
))

export const t = initEffectTRPC.context<TRPCContextShape>().create({
  runtime,
  contextTag: TRPCContext
})
