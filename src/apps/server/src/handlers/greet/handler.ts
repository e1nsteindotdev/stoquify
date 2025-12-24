import { HttpApiEndpoint, HttpApiGroup } from "@effect/platform";
import { Schema } from "effect";


// defines a group 
export class GreetGroup extends
  HttpApiGroup.make("greet")
    .add(
      //  defines an endpiont
      HttpApiEndpoint.post("sayHi", "/")
        .setPayload(Schema.Struct({ name: Schema.NonEmptyString }))
        .addSuccess(Schema.String)
    ).prefix("/greet") { }
