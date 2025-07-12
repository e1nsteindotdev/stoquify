import { Effect } from 'effect/index'
import Fastify from 'fastify'

async function test() {
  //const newDate = Effect.succeed(new Date())
  const newDate = Effect.sync(() => Math.random())
  const value = await Promise.resolve(32)
  console.log(value)
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
