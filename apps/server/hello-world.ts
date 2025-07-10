import { Effect } from "effect/index";

export function test() {
  const suc = Effect.succeed(33);
  console.log(suc)

}
