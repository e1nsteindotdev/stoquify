import { Config, Context, Effect, Layer } from "effect";

export class ApiConfig extends Context.Tag("ApiConfig")<
  ApiConfig,
  {
    readonly testValue: string;
    readonly dbShouldMigrate: boolean
  }
>() {
  static readonly layer = Layer.effect(
    ApiConfig,
    Effect.gen(function*() {
      const testValue = yield* Config.string("TEST_VALUE");
      const dbShouldMigrate = yield* Config.boolean("DB_SHOULD_MIGRATE");
      return ApiConfig.of({ testValue, dbShouldMigrate });
    }),
  );
  // For tests - hardcoded values
  // static readonly testLayer = Layer.succeed(
  //   ApiConfig,
  //   ApiConfig.of({
  //     apiKey: Redacted.make("test-key"),
  //     baseUrl: "https://test.example.com",
  //     timeout: 5000,
  //   })
  // )
}

export const EnvVarsLayer = (env: any) =>
  Layer.succeed(ApiConfig, ApiConfig.of({ testValue: env.TEST_VALUE, dbShouldMigrate: true }));
