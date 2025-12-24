import { Layer, Effect } from "effect"
import { HttpApi, HttpApiClient, HttpServer } from "@effect/platform"
import { D1 } from "@/services/d1.js"
import * as HttpApiBuilder from "@effect/platform/HttpApiBuilder";
import { GreetGroup } from "./handlers/greet/handler.js"

// Combines all groups into one API definition. This single object:
// Is imported by the server to know what routes to create
// Is imported by the client to generate a typed client
export class Api extends HttpApi.make("Api").add(GreetGroup) { }


// HttpApiBuild implements the defined endpoints in the sever by providing the handlers.
const GreetRpcLive = HttpApiBuilder.group(Api, "greet", (handlers) =>
  Effect.succeed(
    handlers.handle("sayHi", ({ payload }) =>
      Effect.succeed(`Hi ${payload.name}`)
    )
  )
);

const ApiLive = HttpApiBuilder.api(Api).pipe(Layer.provide(GreetRpcLive))

const API = Layer.mergeAll(
  ApiLive,
  HttpApiBuilder.middlewareCors(),
  HttpServer.layerContext
)

type Env = {
  D1: D1Database
}

export default {
  fetch: (request: Request, env: Env) => {
    const APIWithEnv = API.pipe(
      Layer.provide(Layer.succeed(D1, env.D1 as D1Database)),
    )
    const { handler } = HttpApiBuilder.toWebHandler(APIWithEnv)
    return handler(request)
  }
}


export const effectClient = HttpApiClient.make(Api, { baseUrl: "http://localhost:3000" })
