import {
  HttpApi,
  HttpApiBuilder,
  HttpApiEndpoint,
  HttpApiGroup,
  HttpServer,
  HttpApiError,
} from "@effect/platform";
import { Layer, Schema, Effect } from "effect";
import { D1 } from "./services/d1.js";
import { ApiConfig, EnvVarsLayer } from "./services/api-config.js";
import {
  TodosPushPayloadSchema,
  TodosPushHandler,
  TodosPullHandler,
  TodoSchema,
} from "./handlers/todos.js";
import { Database, DatabaseLayer } from "./database/index.js";

const test = HttpApiEndpoint.get("test", "/test").addSuccess(Schema.String);

const todosPush = HttpApiEndpoint.post("todosPush", "/todosPush")
  .setPayload(TodosPushPayloadSchema)
  .addSuccess(Schema.Void)
  .addError(HttpApiError.InternalServerError);

const todosPull = HttpApiEndpoint.get("todosPull", "/todosPull")
  .addSuccess(Schema.Array(TodoSchema))

const group = HttpApiGroup.make("MainGroup")
  .add(test)
  .add(todosPush)
  .add(todosPull);

const api = HttpApi.make("MyApi").add(group);

const TestEndpoint = Effect.gen(function*() {
  const config = yield* ApiConfig;
  const { query, schema } = yield* Database
  const todos = yield* query(db =>
    db.select().from(schema.todos)
  )
  console.log('todos :', todos)
  return config.testValue;
}).pipe(
  Effect.catchAll((e) => {
    console.log('error runnging test :', e)
    return Effect.succeed('failed')
  })
)

const RootLive = HttpApiBuilder.group(api, "MainGroup", (handlers) =>
  handlers
    .handle("test", () => TestEndpoint)
    .handle("todosPush", TodosPushHandler)
    .handle("todosPull", TodosPullHandler),
);

const MyApiLive = HttpApiBuilder.api(api).pipe(Layer.provide(RootLive));

const API = Layer.mergeAll(
  MyApiLive,
  HttpApiBuilder.middlewareCors(),
  HttpServer.layerContext,
);

export default {
  fetch: (request: Request, env: any) => {
    const D1Layer = Layer.succeed(D1, env.D1);
    const DatabaseWithD1 = DatabaseLayer.pipe(Layer.provide(D1Layer));
    const APIWithEnv = API.pipe(
      Layer.provide(DatabaseWithD1),
      Layer.provide(EnvVarsLayer(env)),
    );
    const { handler } = HttpApiBuilder.toWebHandler(APIWithEnv);
    return handler(request);
  },
};
