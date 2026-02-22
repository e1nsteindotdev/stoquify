import { HttpApi, HttpApiGroup, HttpApiEndpoint } from "@effect/platform";
import { Schema } from "effect";

export class NotFoundError extends Schema.Class<NotFoundError>("NotFoundError")(
  { message: Schema.String },
) {}

export class UnauthorizedError extends Schema.Class<UnauthorizedError>(
  "UnauthorizedError",
)({ message: Schema.String }) {}

export class ForbiddenError extends Schema.Class<ForbiddenError>(
  "ForbiddenError",
)({ message: Schema.String }) {}

export class ValidationErrorSchema extends Schema.Class<ValidationErrorSchema>(
  "ValidationError",
)({ message: Schema.String }) {}

export class InternalErrorSchema extends Schema.Class<InternalErrorSchema>(
  "InternalError",
)({ message: Schema.String }) {}

export const SignupPayloadSchema = Schema.Struct({
  phone: Schema.String,
  name: Schema.String,
  email: Schema.optional(Schema.String),
  password: Schema.String,
  organizationName: Schema.String,
  shopName: Schema.String,
});

export const UserSchema = Schema.Struct({
  id: Schema.String,
  phone: Schema.String,
  name: Schema.String,
  role: Schema.String,
  confirmed: Schema.Boolean,
});

export const OrganizationSchema = Schema.Struct({
  id: Schema.String,
  name: Schema.String,
});

export const ShopSchema = Schema.Struct({
  id: Schema.String,
  name: Schema.String,
});

export const MemberSchema = Schema.Struct({
  role: Schema.String,
  permissions: Schema.Array(Schema.String),
});

export const AuthSuccessSchema = Schema.Struct({
  user: UserSchema,
  organization: OrganizationSchema,
  shop: ShopSchema,
  storeId: Schema.String,
  member: Schema.optional(MemberSchema),
  sessionToken: Schema.String,
});

export const LoginPayloadSchema = Schema.Struct({
  phone: Schema.String,
  password: Schema.String,
});

export const MagicLinkLoginPayloadSchema = Schema.Struct({
  token: Schema.String,
  phone: Schema.String,
  name: Schema.String,
  password: Schema.String,
});

export const CreateMagicLinkPayloadSchema = Schema.Struct({
  role: Schema.optional(Schema.String),
  permissions: Schema.optional(Schema.Array(Schema.String)),
  shopId: Schema.optional(Schema.String),
});

export const MagicLinkSuccessSchema = Schema.Struct({
  magicLink: Schema.String,
});

export const DisableUserPayloadSchema = Schema.Struct({
  userId: Schema.String,
});

export const LogoutSuccessSchema = Schema.Struct({ ok: Schema.Boolean });

export const PingSuccessSchema = Schema.Struct({ ok: Schema.Boolean });

const CatalogProductSchema = Schema.Struct({
  id: Schema.String,
  name: Schema.String,
  description: Schema.optional(Schema.String),
  price: Schema.Number,
  imageUrl: Schema.optional(Schema.String),
  categoryId: Schema.optional(Schema.String),
  categoryName: Schema.optional(Schema.String),
});

export const CatalogSuccessSchema = Schema.Struct({
  products: Schema.Array(CatalogProductSchema),
});

export const CategorySchema = Schema.Struct({
  id: Schema.String,
  name: Schema.String,
});

export const CategoriesSuccessSchema = Schema.Struct({
  categories: Schema.Array(CategorySchema),
});

export const CollectionSchema = Schema.Struct({
  id: Schema.String,
  name: Schema.String,
});

export const CollectionsSuccessSchema = Schema.Struct({
  collections: Schema.Array(CollectionSchema),
});

const EventItemSchema = Schema.Struct({
  name: Schema.String,
  args: Schema.String,
  seqNum: Schema.optional(Schema.Number),
  parentSeqNum: Schema.optional(Schema.Number),
  clientId: Schema.optional(Schema.String),
  sessionId: Schema.optional(Schema.String),
});

export const EventsPayloadSchema = Schema.Struct({
  storeId: Schema.String,
  events: Schema.Array(EventItemSchema),
});

export const EventsSuccessSchema = Schema.Struct({
  events: Schema.optional(Schema.Array(Schema.Unknown)),
  checkpoint: Schema.optional(Schema.Unknown),
  lastSeqNum: Schema.optional(Schema.Number),
});

export const PullPayloadSchema = Schema.Struct({
  storeId: Schema.String,
  afterSeq: Schema.optional(Schema.Number),
});

export const PullSuccessSchema = Schema.Struct({
  events: Schema.Array(Schema.Unknown),
  checkpoint: Schema.Unknown,
});

const OrderItemSchema = Schema.Struct({
  productId: Schema.String,
  quantity: Schema.Number,
  price: Schema.Number,
  selection: Schema.Array(
    Schema.Struct({
      variantId: Schema.String,
      variantOptionId: Schema.String,
    }),
  ),
});

export const CreateOrderPayloadSchema = Schema.Struct({
  shopId: Schema.String,
  storeId: Schema.optional(Schema.String),
  order: Schema.Struct({
    firstName: Schema.String,
    lastName: Schema.String,
    phoneNumber: Schema.String,
    wilaya: Schema.String,
    address: Schema.String,
    items: Schema.Array(OrderItemSchema),
  }),
});

export const CreateOrderSuccessSchema = Schema.Struct({
  orderId: Schema.String,
  lastSeqNum: Schema.Number,
});

class AuthApi extends HttpApiGroup.make("auth")
  .add(
    HttpApiEndpoint.post("signup", "/api/auth/signup")
      .setPayload(SignupPayloadSchema)
      .addSuccess(AuthSuccessSchema)
      .addError(ValidationErrorSchema, { status: 400 })
      .addError(InternalErrorSchema, { status: 500 }),
  )
  .add(
    HttpApiEndpoint.post("login", "/api/auth/login")
      .setPayload(LoginPayloadSchema)
      .addSuccess(AuthSuccessSchema)
      .addError(ValidationErrorSchema, { status: 400 })
      .addError(UnauthorizedError, { status: 401 })
      .addError(InternalErrorSchema, { status: 500 }),
  )
  .add(
    HttpApiEndpoint.post("loginMagic", "/api/auth/login-magic")
      .setPayload(MagicLinkLoginPayloadSchema)
      .addSuccess(AuthSuccessSchema)
      .addError(ValidationErrorSchema, { status: 400 })
      .addError(UnauthorizedError, { status: 401 })
      .addError(InternalErrorSchema, { status: 500 }),
  )
  .add(
    HttpApiEndpoint.post("createMagicLink", "/api/auth/create-magic-link")
      .setPayload(CreateMagicLinkPayloadSchema)
      .addSuccess(MagicLinkSuccessSchema)
      .addError(UnauthorizedError, { status: 401 })
      .addError(ForbiddenError, { status: 403 })
      .addError(InternalErrorSchema, { status: 500 }),
  )
  .add(
    HttpApiEndpoint.post("logout", "/api/auth/logout").addSuccess(
      LogoutSuccessSchema,
    ),
  )
  .add(
    HttpApiEndpoint.get("me", "/api/auth/me")
      .addSuccess(AuthSuccessSchema)
      .addError(UnauthorizedError, { status: 401 }),
  )
  .add(
    HttpApiEndpoint.post("disableUser", "/api/auth/disable-user")
      .setPayload(DisableUserPayloadSchema)
      .addSuccess(LogoutSuccessSchema)
      .addError(UnauthorizedError, { status: 401 })
      .addError(ForbiddenError, { status: 403 })
      .addError(InternalErrorSchema, { status: 500 }),
  )
  .prefix("/api/auth")
  .addError(UnauthorizedError, { status: 401 }) {}

class DataApi extends HttpApiGroup.make("data")
  .add(
    HttpApiEndpoint.get("catalog", "/catalog")
      .setUrlParams(Schema.Struct({ shopId: Schema.String }))
      .addSuccess(CatalogSuccessSchema)
      .addError(ValidationErrorSchema, { status: 400 })
      .addError(InternalErrorSchema, { status: 500 }),
  )
  .add(
    HttpApiEndpoint.get("categories", "/categories")
      .setUrlParams(Schema.Struct({ shopId: Schema.String }))
      .addSuccess(CategoriesSuccessSchema)
      .addError(ValidationErrorSchema, { status: 400 })
      .addError(InternalErrorSchema, { status: 500 }),
  )
  .add(
    HttpApiEndpoint.get("collections", "/collections")
      .setUrlParams(Schema.Struct({ shopId: Schema.String }))
      .addSuccess(CollectionsSuccessSchema)
      .addError(ValidationErrorSchema, { status: 400 })
      .addError(InternalErrorSchema, { status: 500 }),
  )
  .prefix("/")
  .addError(InternalErrorSchema, { status: 500 }) {}

class SyncApi extends HttpApiGroup.make("sync")
  .add(
    HttpApiEndpoint.post("events", "/events")
      .setPayload(EventsPayloadSchema)
      .addSuccess(EventsSuccessSchema)
      .addError(ValidationErrorSchema, { status: 400 })
      .addError(InternalErrorSchema, { status: 500 }),
  )
  .add(
    HttpApiEndpoint.post("pull", "/pull")
      .setPayload(PullPayloadSchema)
      .addSuccess(PullSuccessSchema)
      .addError(ValidationErrorSchema, { status: 400 })
      .addError(InternalErrorSchema, { status: 500 }),
  )
  .add(
    HttpApiEndpoint.post("orders", "/orders")
      .setPayload(CreateOrderPayloadSchema)
      .addSuccess(CreateOrderSuccessSchema)
      .addError(ValidationErrorSchema, { status: 400 })
      .addError(NotFoundError, { status: 404 })
      .addError(InternalErrorSchema, { status: 500 }),
  )
  .prefix("/")
  .addError(InternalErrorSchema, { status: 500 }) {}

class PingApi extends HttpApiGroup.make("ping")
  .add(HttpApiEndpoint.get("ping", "/ping").addSuccess(PingSuccessSchema))
  .prefix("/") {}

export const StoquifyApi = HttpApi.make("stoquifyApi")
  .add(AuthApi)
  .add(DataApi)
  .add(SyncApi)
  .add(PingApi)
  .addError(InternalErrorSchema, { status: 500 });

export type StoquifyApi = typeof StoquifyApi;
