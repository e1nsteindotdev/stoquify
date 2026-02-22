import { Schema } from "effect";

export const PingSuccessSchema = Schema.Struct({ ok: Schema.Boolean });

export const SignupPayloadSchema = Schema.Struct({
  phone: Schema.String,
  name: Schema.String,
  email: Schema.optional(Schema.String),
  password: Schema.String,
  organizationName: Schema.String,
  shopName: Schema.String,
});

export const SignupSuccessSchema = Schema.Struct({
  user: Schema.Struct({
    id: Schema.String,
    phone: Schema.String,
    name: Schema.String,
    role: Schema.String,
    confirmed: Schema.Boolean,
  }),
  organization: Schema.Struct({
    id: Schema.String,
    name: Schema.String,
  }),
  shop: Schema.Struct({
    id: Schema.String,
    name: Schema.String,
  }),
  storeId: Schema.String,
});

export const LoginPayloadSchema = Schema.Struct({
  phone: Schema.String,
  password: Schema.String,
});

export const AuthSuccessSchema = SignupSuccessSchema;

export const MeSuccessSchema = Schema.Struct({
  user: Schema.Struct({
    id: Schema.String,
    phone: Schema.String,
    name: Schema.String,
    role: Schema.String,
    confirmed: Schema.Boolean,
  }),
  organization: Schema.Struct({
    id: Schema.String,
    name: Schema.String,
  }),
  shop: Schema.Struct({
    id: Schema.String,
    name: Schema.String,
  }),
  storeId: Schema.String,
  member: Schema.Struct({
    role: Schema.String,
    permissions: Schema.Array(Schema.String),
  }),
});

export const LogoutSuccessSchema = Schema.Struct({ ok: Schema.Boolean });

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

export const DisableUserSuccessSchema = Schema.Struct({ ok: Schema.Boolean });

export type SignupPayload = {
  phone: string;
  name: string;
  email?: string;
  password: string;
  organizationName: string;
  shopName: string;
};

export type SignupSuccess = {
  user: {
    id: string;
    phone: string;
    name: string;
    role: string;
    confirmed: boolean;
  };
  organization: {
    id: string;
    name: string;
  };
  shop: {
    id: string;
    name: string;
  };
  storeId: string;
};

export type LoginPayload = {
  phone: string;
  password: string;
};

export type AuthSuccess = SignupSuccess & {
  member?: {
    role: string;
    permissions: string[];
  };
};

export type MeSuccess = {
  user: {
    id: string;
    phone: string;
    name: string;
    role: string;
    confirmed: boolean;
  };
  organization: {
    id: string;
    name: string;
  };
  shop: {
    id: string;
    name: string;
  };
  storeId: string;
  member: {
    role: string;
    permissions: string[];
  };
};

export type LogoutSuccess = { ok: boolean };

export type CreateMagicLinkPayload = {
  role?: string;
  permissions?: string[];
  shopId?: string;
};

export type MagicLinkSuccess = {
  magicLink: string;
};

export type DisableUserPayload = {
  userId: string;
};

export type DisableUserSuccess = { ok: boolean };

export type PingSuccess = { ok: boolean };
