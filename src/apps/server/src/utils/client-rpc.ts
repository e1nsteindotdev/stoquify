import { Api } from "../index.js"
import { HttpApiClient } from "@effect/platform"

export const api = HttpApiClient.make(Api, { baseUrl: "http://localhost:3000" })
