import { Effect } from 'effect/index'
import Fastify from 'fastify'

function test() {
  //const newDate = Effect.succeed(new Date())
  const newDate = Effect.sync(() => Math.random())
  console.log(Effect.runSync(newDate))
  console.log(Effect.runSync(newDate))
  console.log(Effect.runSync(newDate))
  console.log(Effect.runSync(newDate))
}
test()


const fastify = Fastify({
  logger: true
})

fastify.get('/', async (request, reply) => {
  return { hello: 'world' }
})

const start = () => { fastify.listen({ port: 8888, host: '0.0.0.0' }) }

export default start
