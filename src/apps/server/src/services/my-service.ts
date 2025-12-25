import { Context } from "effect"

export class MyService extends Context.Tag("MyService")<MyService, { readonly message: string }>() { }
