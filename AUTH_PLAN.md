# Authentication Implementation Plan

---

## Overview

| Aspect            | Value                                     |
| ----------------- | ----------------------------------------- |
| **Primary ID**    | Phone number                              |
| **Secondary**     | Email (optional)                          |
| **Auth Method**   | Magic link + password                     |
| **Password**      | Required, bcrypt hashed (min 4 chars)     |
| **Session**       | Lifetime (no expiry, until disabled)      |
| **Auth Storage**  | KV (server) + localStorage (client)       |
| **Event Storage** | D1 (Livestore)                            |
| **Permissions**   | Per-shop (different permissions per shop) |

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Cloudflare Workers                        │
│  ┌─────────────────┐        ┌─────────────────────────────┐ │
│  │   Auth (KV)     │        │   Sync (D1)               │ │
│  │  - sessions     │        │  - eventlog_{shopId}        │ │
│  │  - magic_links  │        │  - materialized_*           │ │
│  │  - users        │        │                              │ │
│  │  - shops        │        │                              │ │
│  │  - shop_members │        │                              │ │
│  └─────────────────┘        └─────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
         ▲                                           ▲
         │ Sync: login/logout/permission change      │ Sync: push/pull
         │                                           │
┌─────────────────────────────────────────────────────────────┐
│                   Client (localStorage)                      │
│  { user, organization, shop, member, session }            │
└─────────────────────────────────────────────────────────────┘
```

---

## User Types

| Role        | Description                                           |
| ----------- | ----------------------------------------------------- |
| **Founder** | Creates org, full access, can create other users      |
| **Admin**   | Full access to their shop (created by founder)        |
| **Staff**   | Restricted access based on per-shop permissions array |

---

## Data Models (Effect Schema)

### User

```typescript
{
  id: string;
  phone: string;
  name: string;
  email: string | null;
  passwordHash: string;
  role: "founder" | "admin" | "staff";
  enabled: boolean;
  confirmed: boolean;
  createdAt: number;
  updatedAt: number;
}
```

### Organization

```typescript
{
  id: string;
  name: string;
  ownerId: string;
  createdAt: number;
}
```

### Shop

```typescript
{
  id: string; // equals Livestore storeId
  organizationId: string;
  name: string;
  createdAt: number;
}
```

### ShopMember (per-shop permissions)

```typescript
{
  userId: string;
  shopId: string;
  role: "admin" | "staff";
  permissions: string[];  // e.g., ["products:read", "orders:write"]
}
```

### Session

```typescript
{
  userId: string;
  organizationId: string;
  createdAt: number; // no expiry - lifetime
}
```

### MagicLink

```typescript
{
  id: string;
  organizationId: string;
  shopId: string | null;     // optional: link for specific shop
  role: "admin" | "staff";
  permissions: string[];
  createdAt: number;
  usedByUserId: string | null;
  enabled: boolean;
}
```

---

## KV Key Patterns

| Key Pattern             | Value                                     |
| ----------------------- | ----------------------------------------- |
| `user:{userId}`         | User data                                 |
| `user_by_phone:{phone}` | User data (for quick lookup)              |
| `organization:{orgId}`  | Organization data                         |
| `shop:{shopId}`         | Shop data                                 |
| `shops_by_org:{orgId}`  | List of shops for org                     |
| `shop_members:{shopId}` | List of members with per-shop permissions |
| `session:{token}`       | Session data                              |
| `magic_link:{token}`    | Magic link data                           |

---

## Auth Flows

### 1. Founder Signup (`/api/auth/signup`)

```
User enters: phone, name, email (optional), password, organization name
    ↓
Create: organization, first shop, user (founder role)
Hash: password with bcrypt
    ↓
KV: user, organization, shop, shop_members, session
localStorage: { user, organization, shop, member, session }
Cookie: HttpOnly session token
    ↓
Redirect to app
```

### 2. Login (`/api/auth/login`) - Existing User

```
User enters: phone, password
    ↓
Validate password hash
Get user's shop and permissions
    ↓
KV: session
localStorage: { user, organization, shop, member, session }
Cookie: HttpOnly session token
    ↓
Redirect to app
```

### 3. Magic Link Creation (`/api/auth/create-magic-link`)

```
Admin creates magic link
    ↓
Sets: shop, role (admin/staff), permissions (one by one)
    ↓
Returns: /signup?token=xxx link
    ↓
Admin sends link to staff member
```

### 4. Staff Signup via Magic Link (`/api/auth/login-magic`)

```
Staff visits /signup?token=xxx
    ↓
Enters: phone, name, password
    ↓
Validates: magic link (not used, enabled)
Creates: user, adds to shop_members
    ↓
KV: user, shop_members (with permissions), session
localStorage: { user, organization, shop, member, session }
Cookie: HttpOnly session token
    ↓
Magic link marked as used (one-time)
    ↓
Redirect to app
```

### 5. Account Disable (`/api/auth/disable-user`)

```
Admin clicks "Disable" on user
    ↓
KV: user.enabled = false
    ↓
User's next push/pull → 403 Forbidden
```

---

## API Endpoints

| Endpoint                      | Method   | Auth          | Description                           |
| ----------------------------- | -------- | ------------- | ------------------------------------- |
| `/api/auth/signup`            | POST     | None          | Founder creates org + first shop      |
| `/api/auth/login`             | POST     | None          | Login with phone + password           |
| `/api/auth/login-magic`       | POST     | None          | Login via magic link                  |
| `/api/auth/create-magic-link` | POST     | Founder/Admin | Create staff invite                   |
| `/api/auth/logout`            | POST     | Session       | Clear session                         |
| `/api/auth/me`                | GET      | Session       | Get current user + shop + permissions |
| `/api/auth/disable-user`      | POST     | Founder       | Disable a user                        |
| `/api/auth/switch-shop`       | POST     | Session       | Switch current shop                   |
| `/api/events` (push)          | POST     | Session       | Push events (auth checked)            |
| `/api/pull`                   | GET/POST | Session       | Pull events (auth checked)            |

---

## Permission System

### Permissions are per-shop

- Admin: full access to their shop
- Staff: restricted based on `shop_members.permissions` array

### Permission Check (Server)

```typescript
const canPerform = (member: ShopMember, action: string): boolean => {
  if (member.role === "admin") return true;
  return member.permissions.includes(action);
};
```

### Common Actions

```
products:read, products:write
orders:read, orders:write
customers:read, customers:write
```

---

## Security

| Aspect         | Implementation                               |
| -------------- | -------------------------------------------- |
| **Password**   | bcrypt hash                                  |
| **Session**    | Opaque token (random 32 chars), stored in KV |
| **Cookie**     | HttpOnly, Secure, SameSite=Lax               |
| **Disable**    | KV flag `enabled: false`                     |
| **Magic link** | One-time use, can be disabled                |

---

## File Structure

```
src/apps/dashboard/src/cf-worker/
├── index.ts              # Main worker, routes to auth/events
├── actions.ts            # Event handlers (push/pull) - existing
├── auth/
│   ├── index.ts         # Re-exports
│   ├── types.ts         # Effect schemas (User, Organization, Shop, etc.)
│   ├── kv-service.ts    # AuthStorage interface (Effect Context)
│   ├── kv-kv.ts         # KV implementation of AuthStorage
│   ├── service.ts       # Business logic (signup, login, etc.)
│   ├── middleware.ts    # Auth middleware for events
│   └── routes.ts       # HTTP endpoint handlers

src/apps/dashboard/src/
├── hooks/
│   └── useAuth.ts      # Client auth hook + state
└── lib/
    └── permissions.ts  # Client permission helpers
```

---

## Implementation Order

| Order | Task                                     | Files                        |
| ----- | ---------------------------------------- | ---------------------------- |
| 1     | Add KV to wrangler.toml + install bcrypt | wrangler.toml, package.json  |
| 2     | Create auth types                        | cf-worker/auth/types.ts      |
| 3     | Create AuthStorage interface             | cf-worker/auth/kv-service.ts |
| 4     | Create KV implementation                 | cf-worker/auth/kv-kv.ts      |
| 5     | Create auth service                      | cf-worker/auth/service.ts    |
| 6     | Create auth routes                       | cf-worker/auth/routes.ts     |
| 7     | Create auth middleware                   | cf-worker/auth/middleware.ts |
| 8     | Update worker entry                      | cf-worker/index.ts           |
| 9     | Add auth to events/pull                  | cf-worker/actions.ts         |
| 10    | Create client hook                       | hooks/useAuth.ts             |
| 11    | Create permission helpers                | lib/permissions.ts           |

---

## Dependencies

```bash
# Install
pnpm add bcryptjs
pnpm add -D @types/bcryptjs

# wrangler.toml additions
[[kv_namespaces]]
binding = "AUTH_KV"
id = "<create-in-cloudflare-dashboard>"
```

---

## Client localStorage Structure

```typescript
{
  user: {
    id: string;
    phone: string;
    name: string;
    role: "founder" | "admin" | "staff";
    confirmed: boolean;
  },
  organization: {
    id: string;
    name: string;
  },
  shop: {
    id: string;
    name: string;
  },
  member: {
    role: "admin" | "staff";
    permissions: string[];
  },
  session: {
    token: string;
  }
}
```

---

## URL Routes

| Route               | Description                   |
| ------------------- | ----------------------------- |
| `/signup`           | Founder signup page           |
| `/login`            | Login page (phone + password) |
| `/signup?token=xxx` | Staff signup via magic link   |

---

## Notes

- Permissions are added one by one by admin in dashboard (not implemented in MVP)
- Password minimum 4 characters, no other constraints
- Sessions never expire automatically
- User can login from new device with phone + password
- Admin can disable user to revoke access
