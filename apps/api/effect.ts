import { Effect, pipe } from "effect/index"

class FourError {
  readonly _tag = "4 sucks"
}

function waitFor(n: number) {
  return new Promise((resolve) => {
    setTimeout(() => resolve(n), n * 1000)
  })
}

async function Work(n: number) {
  console.log('running for :', n)
  if (n == 4) {
    return Effect.failSync(() => new FourError)
  } else {
    Effect.promise(() => waitFor(n))
  }
  // return an Effect<never, FourError, Number>
  pipe(
    Effect.fail(new FourError())
  )
}
