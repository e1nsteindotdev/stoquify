import { Context } from "effect"

export class D1 extends Context.Tag("D1")<
  D1,
  D1Database
>() { }
