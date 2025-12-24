import { Api } from "../index.js"
import { HttpApiClient, FetchHttpClient } from "@effect/platform"
import { Effect } from "effect"

// // Re-export the API groups (schema only, no handlers)
// export class GreetGroup extends
//   HttpApiGroup.make("greet")
//     .add(
//       HttpApiEndpoint.post("sayHi", "/")
//         .setPayload(Schema.Struct({ name: Schema.NonEmptyString }))
//         .addSuccess(Schema.String)
//     ).prefix("/greet") { }
//
// // The API definition (combines all groups)
// export class Api extends HttpApi.make("Api").add(GreetGroup) { }

// Pre-configured client for use in frontend apps
// We provide the FetchHttpClient layer and run it synchronously to give the frontend a ready-to-use client object
export const api = HttpApiClient.make(Api, { baseUrl: "http://localhost:3000" }).pipe(
  Effect.provide(FetchHttpClient.layer),
  Effect.runSync

)

