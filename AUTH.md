# Auth Architecture - Implementation Plan

## Overview

Multi-tenant SaaS authentication system built on Convex Auth with:

- **Organization → Store → Users** hierarchy
- **Roles**: founder, admin, staff
- **Magic links via QR codes** (custom implementation)
- **Permissions**: predefined list, assignable per user via magic links

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                        Convex Auth                          │
│  ┌──────────┐  ┌────────────┐  ┌────────────────────────┐ │
│  │ sessions │  │ authAccounts│  │  users (extended)      │ │
│  └──────────┘  └────────────┘  └────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                           │
                           │ userId reference
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                     Custom Convex Tables                     │
│  ┌───────────────┐  ┌───────────┐  ┌───────────────────┐  │
│  │ organizations │  │  stores   │  │   permissions      │  │
│  │  - name       │  │  - name   │  │  - key             │  │
│  │  - owner      │  │  - orgId  │  │  - description     │  │
│  └───────────────┘  └───────────┘  └───────────────────────┘│
│                                                                  │
│  ┌───────────────┐                                             │
│  │  magicLinks   │                                             │
│  │  - email     │                                             │
│  │  - token     │                                             │
│  │  - role      │                                             │
│  │  - permissions│                                            │
│  │  - organizationId │                                        │
│  │  - storeId    │                                             │
│  │  - expiresAt │                                             │
│  └───────────────┘                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Data Model

### 1. users Table (Extend Convex Auth)

The `users` table extends Convex Auth's built-in table with custom fields:

```typescript
users: defineTable({
  // Auth.js / Convex Auth fields
  name: v.optional(v.string()),
  image: v.optional(v.string()),
  email: v.optional(v.string()),
  emailVerificationTime: v.optional(v.number()),
  phone: v.optional(v.string()),
  phoneVerificationTime: v.optional(v.number()),
  isAnonymous: v.optional(v.boolean()),

  // Custom fields for multi-tenant SaaS
  organizationId: v.optional(v.id("organizations")),
  storeId: v.optional(v.id("stores")),
  role: v.optional(
    v.union(v.literal("founder"), v.literal("admin"), v.literal("staff")),
  ),
  permissions: v.optional(v.array(v.string())),
  joinedAt: v.optional(v.number()),
})
  .index("email", ["email"])
  .index("by_organization", ["organizationId"])
  .index("by_store", ["storeId"]);
```

### 2. organizations Table

```typescript
organizations: defineTable({
  name: v.string(),
  owner: v.id("users"),
});
```

### 3. stores Table

```typescript
stores: defineTable({
  name: v.string(),
  organizationId: v.id("organizations"),
}).index("by_organization", ["organizationId"]);
```

### 4. permissions Table (Predefined)

```typescript
permissions: defineTable({
  key: v.string(), // e.g., "read_products", "write_products"
  description: v.optional(v.string()),
  createdAt: v.number(),
}).index("by_key", ["key"]);
```

### 5. magicLinks Table

```typescript
magicLinks: defineTable({
  email: v.string(),
  token: v.string(),
  role: v.union(v.literal("admin"), v.literal("staff")),
  permissions: v.array(v.string()),
  organizationId: v.id("organizations"),
  storeId: v.id("stores"),
  expiresAt: v.number(),
  usedAt: v.optional(v.number()),
  createdAt: v.number(),
})
  .index("by_token", ["token"])
  .index("by_email", ["email"]);
```

---

## Phase 1: Schema Updates

### 1.1 Updated schema.ts

```typescript
// convex/schema.ts
import { defineSchema, defineTable } from "convex/server";
import { authTables } from "@convex-dev/auth/server";
import { v } from "convex/values";

const schema = defineSchema({
  ...authTables,

  // Extend users table
  users: defineTable({
    name: v.optional(v.string()),
    image: v.optional(v.string()),
    email: v.optional(v.string()),
    emailVerificationTime: v.optional(v.number()),
    phone: v.optional(v.string()),
    phoneVerificationTime: v.optional(v.number()),
    isAnonymous: v.optional(v.boolean()),

    // Custom multi-tenant fields
    organizationId: v.optional(v.id("organizations")),
    storeId: v.optional(v.id("stores")),
    role: v.optional(
      v.union(v.literal("founder"), v.literal("admin"), v.literal("staff")),
    ),
    permissions: v.optional(v.array(v.string())),
    joinedAt: v.optional(v.number()),
  })
    .index("email", ["email"])
    .index("by_organization", ["organizationId"])
    .index("by_store", ["storeId"]),

  // Organizations
  organizations: defineTable({
    name: v.string(),
    owner: v.id("users"),
  }),

  // Stores
  stores: defineTable({
    name: v.string(),
    organizationId: v.id("organizations"),
  }).index("by_organization", ["organizationId"]),

  // Permissions (predefined, managed via Convex Dashboard)
  permissions: defineTable({
    key: v.string(),
    description: v.optional(v.string()),
    createdAt: v.number(),
  }).index("by_key", ["key"]),

  // Magic links for invitations
  magicLinks: defineTable({
    email: v.string(),
    token: v.string(),
    role: v.union(v.literal("admin"), v.literal("staff")),
    permissions: v.array(v.string()),
    organizationId: v.id("organizations"),
    storeId: v.id("stores"),
    expiresAt: v.number(),
    usedAt: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index("by_token", ["token"])
    .index("by_email", ["email"]),

  // ... existing tables (categories, products, etc.)
});

export default schema;
```

---

## Phase 2: Auth Configuration

### 2.1 Configure Convex Auth with Custom Magic Link Provider

```typescript
// convex/auth.ts
import { Password } from "@convex-dev/auth/providers/Password";
import { ConvexCredentials } from "@convex-dev/auth/providers/ConvexCredentials";
import { convexAuth } from "@convex-dev/auth/server";

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [
    Password,

    // Custom magic-link provider for QR code invites
    ConvexCredentials({
      id: "magic-link",
      authorize: async (params, ctx) => {
        const { token, name, phone } = params;

        if (!token) {
          throw new Error("Token is required");
        }

        // 1. Find and validate token
        const magicLink = await ctx.db
          .query("magicLinks")
          .withIndex("by_token", (q) => q.eq("token", token))
          .unique();

        if (!magicLink) {
          throw new Error("Invalid token");
        }

        if (magicLink.usedAt) {
          throw new Error("Token already used");
        }

        if (Date.now() > magicLink.expiresAt) {
          throw new Error("Token expired");
        }

        // 2. Find or create user by email
        let user = await ctx.db
          .query("users")
          .withIndex("email", (q) => q.eq("email", magicLink.email))
          .unique();

        if (!user) {
          // New user - create with provided name and phone
          if (!name || !phone) {
            throw new Error("Name and phone are required");
          }

          user = await ctx.db.insert("users", {
            name,
            email: magicLink.email,
            phone,
            organizationId: magicLink.organizationId,
            storeId: magicLink.storeId,
            role: magicLink.role,
            permissions: magicLink.permissions,
            joinedAt: Date.now(),
          });
        } else {
          // Existing user - update their org association
          await ctx.db.patch(user._id, {
            organizationId: magicLink.organizationId,
            storeId: magicLink.storeId,
            role: magicLink.role,
            permissions: magicLink.permissions,
            joinedAt: Date.now(),
          });
        }

        // 3. Mark token as used
        await ctx.db.patch(magicLink._id, { usedAt: Date.now() });

        // 4. Return user identity
        return {
          subject: user._id,
          email: magicLink.email,
          name: user.name,
        };
      },
    }),
  ],

  callbacks: {
    async createOrUpdateUser(ctx, args) {
      // Handle custom fields on password signup
      if (args.existingUserId) {
        await ctx.db.patch(args.existingUserId, {
          email: args.profile.email,
          name: args.profile.name,
        });
        return args.existingUserId;
      }
      return undefined;
    },
  },

  session: {
    totalDurationMs: 1000 * 60 * 60 * 24 * 30, // 30 days
    inactiveDurationMs: 1000 * 60 * 60 * 24 * 7, // 7 days
  },
});
```

---

## Phase 3: Backend Actions

### 3.1 Organizations

```typescript
// convex/organizations.ts
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Founder creates organization + first store + founder membership
export const create = mutation({
  args: {
    organizationName: v.string(),
    storeName: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");
    if (!identity.email) throw new Error("Email required");

    // Get or create user document
    let user = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", identity.email!))
      .unique();

    if (!user) {
      user = await ctx.db.insert("users", {
        name: identity.name,
        email: identity.email,
        image: identity.picture,
        role: "founder",
        permissions: ["*"], // All permissions
        joinedAt: Date.now(),
      });
    }

    // Create organization
    const org = await ctx.db.insert("organizations", {
      name: args.organizationName,
      owner: user._id,
    });

    // Create first store
    const store = await ctx.db.insert("stores", {
      name: args.storeName,
      organizationId: org,
    });

    // Update user with org and store
    await ctx.db.patch(user._id, {
      organizationId: org,
      storeId: store,
    });

    return { organizationId: org, storeId: store };
  },
});

// Get current user's organization
export const getMyOrganization = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const user = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", identity.email!))
      .unique();

    if (!user?.organizationId) return null;

    const org = await ctx.db.get(user.organizationId);
    return org;
  },
});

// Get user's role
export const getMyRole = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const user = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", identity.email!))
      .unique();

    return user?.role || null;
  },
});
```

### 3.2 Stores

```typescript
// convex/stores.ts
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Create new store (founder/admin only)
export const create = mutation({
  args: {
    name: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", identity.email!))
      .unique();

    if (!user?.organizationId) {
      throw new Error("No organization found");
    }

    if (!user.role || user.role === "staff") {
      throw new Error("Not authorized");
    }

    const store = await ctx.db.insert("stores", {
      name: args.name,
      organizationId: user.organizationId,
    });

    return store;
  },
});

// List stores by organization
export const list = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const user = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", identity.email!))
      .unique();

    if (!user?.organizationId) return [];

    return await ctx.db
      .query("stores")
      .withIndex("by_organization", (q) =>
        q.eq("organizationId", user.organizationId),
      )
      .collect();
  },
});

// Get current user's store
export const getMyStore = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const user = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", identity.email!))
      .unique();

    if (!user?.storeId) return null;

    return await ctx.db.get(user.storeId);
  },
});

// Switch current store
export const setCurrentStore = mutation({
  args: {
    storeId: v.id("stores"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", identity.email!))
      .unique();

    if (!user) throw new Error("User not found");

    // Verify store belongs to user's organization
    const store = await ctx.db.get(args.storeId);
    if (!store) throw new Error("Store not found");

    if (store.organizationId !== user.organizationId) {
      throw new Error("Store does not belong to your organization");
    }

    await ctx.db.patch(user._id, { storeId: args.storeId });

    return args.storeId;
  },
});
```

### 3.3 Magic Links & Invitations

```typescript
// convex/magicLinks.ts
import { mutation, query, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { nanoid } from "nanoid";

// Generate magic link for invitation
export const invite = mutation({
  args: {
    email: v.string(),
    role: v.union(v.literal("admin"), v.literal("staff")),
    permissions: v.array(v.string()),
    storeId: v.optional(v.id("stores")),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", identity.email!))
      .unique();

    if (!user?.organizationId) {
      throw new Error("No organization found");
    }

    if (!user.role || user.role === "staff") {
      throw new Error("Not authorized to invite");
    }

    // Generate token
    const token = nanoid(32);
    const expiresAt = Date.now() + 1000 * 60 * 60 * 24 * 7; // 7 days

    // Create magic link record
    const magicLink = await ctx.db.insert("magicLinks", {
      email: args.email,
      token,
      role: args.role,
      permissions: args.permissions,
      organizationId: user.organizationId,
      storeId: args.storeId || user.storeId!,
      expiresAt,
      createdAt: Date.now(),
    });

    // Return token for QR code generation
    return { token, expiresAt };
  },
});

// List pending invitations
export const listPending = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const user = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", identity.email!))
      .unique();

    if (!user?.organizationId) return [];

    // Only founder/admin can view invites
    if (!user.role || user.role === "staff") return [];

    const invites = await ctx.db
      .query("magicLinks")
      .filter((q) =>
        q.and(
          q.eq(q.field("organizationId"), user.organizationId),
          q.eq(q.field("usedAt"), undefined),
        ),
      )
      .collect();

    return invites;
  },
});

// Revoke invitation
export const revoke = mutation({
  args: {
    invitationId: v.id("magicLinks"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", identity.email!))
      .unique();

    if (!user?.organizationId || !user.role || user.role === "staff") {
      throw new Error("Not authorized");
    }

    const invite = await ctx.db.get(args.invitationId);
    if (!invite || invite.organizationId !== user.organizationId) {
      throw new Error("Invitation not found");
    }

    await ctx.db.delete(args.invitationId);
  },
});
```

### 3.4 Permissions Helpers

```typescript
// convex/permissions.ts
import { QueryCtx } from "./_generated/server";

type Role = "founder" | "admin" | "staff";

const ROLE_HIERARCHY: Record<Role, number> = {
  founder: 3,
  admin: 2,
  staff: 1,
};

export async function getUserPermissions(
  ctx: QueryCtx,
  userId: string,
): Promise<string[]> {
  const user = await ctx.db.get(userId as any);
  if (!user) return [];

  // Founder and admin have all permissions
  if (user.role === "founder" || user.role === "admin") {
    // Fetch all available permissions
    const allPerms = await ctx.db.query("permissions").collect();
    return allPerms.map((p) => p.key);
  }

  return user.permissions || [];
}

export async function hasPermission(
  ctx: QueryCtx,
  userId: string,
  requiredPermission: string,
): Promise<boolean> {
  const user = await ctx.db.get(userId as any);
  if (!user) return false;

  // Founder and admin have all permissions
  if (user.role === "founder" || user.role === "admin") {
    return true;
  }

  const userPerms = user.permissions || [];
  return userPerms.includes("*") || userPerms.includes(requiredPermission);
}

export async function requirePermission(
  ctx: QueryCtx,
  userId: string,
  requiredPermission: string,
): Promise<void> {
  const hasIt = await hasPermission(ctx, userId, requiredPermission);
  if (!hasIt) {
    throw new Error("Not authorized");
  }
}

export function canInvite(role: Role): boolean {
  return ROLE_HIERARCHY[role] >= ROLE_HIERARCHY.admin;
}

export function canManageStore(role: Role): boolean {
  return ROLE_HIERARCHY[role] >= ROLE_HIERARCHY.admin;
}
```

---

## Phase 4: Frontend Implementation

### 4.1 Hooks

```typescript
// dashboard/src/hooks/use-auth.ts
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";

export function useCurrentUser() {
  const user = useQuery(api.users.get);
  return user;
}

export function useOrganization() {
  const org = useQuery(api.organizations.getMyOrganization);
  const role = useQuery(api.organizations.getMyRole);
  const createOrg = useMutation(api.organizations.create);

  return { org, role, createOrg };
}

export function useStore() {
  const store = useQuery(api.stores.getMyStore);
  const stores = useQuery(api.stores.list);
  const setCurrentStore = useMutation(api.stores.setCurrentStore);
  const createStore = useMutation(api.stores.create);

  return { store, stores, setCurrentStore, createStore };
}

export function usePermissions() {
  const user = useQuery(api.users.get);
  return {
    permissions: user?.profile?.permissions || [],
    role: user?.profile?.role,
    isFounder: user?.profile?.role === "founder",
    isAdmin:
      user?.profile?.role === "admin" || user?.profile?.role === "founder",
    isStaff: user?.profile?.role === "staff",
  };
}
```

### 4.2 Invite Modal with QR Code

```typescript
// dashboard/src/components/invite-modal.tsx
import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import QRCode from "react-qr-code";

export function InviteStaffModal() {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"admin" | "staff">("staff");
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [generatedLink, setGeneratedLink] = useState<string | null>(null);

  const invite = useMutation(api.magicLinks.invite);
  const availablePermissions = useQuery(api.permissions.list);
  const currentStore = useQuery(api.stores.getMyStore);

  const handleGenerateLink = async () => {
    const result = await invite({
      email,
      role,
      permissions: selectedPermissions,
      storeId: currentStore?._id,
    });

    const link = `${window.location.origin}/auth/verify?token=${result.token}`;
    setGeneratedLink(link);
  };

  const togglePermission = (perm: string) => {
    setSelectedPermissions(prev =>
      prev.includes(perm)
        ? prev.filter(p => p !== perm)
        : [...prev, perm]
    );
  };

  if (generatedLink) {
    return (
      <div className="p-6 text-center">
        <h3 className="text-lg font-semibold mb-4">Scan to Join</h3>
        <div className="bg-white p-4 inline-block rounded-lg">
          <QRCode value={generatedLink} size={200} />
        </div>
        <p className="text-sm text-gray-500 mt-4">
          This QR code expires in 7 days
        </p>
        <p className="text-xs text-gray-400 mt-2">
          Or share this link: {generatedLink.substring(0, 50)}...
        </p>
        <button
          onClick={() => setGeneratedLink(null)}
          className="mt-4 text-sm underline"
        >
          Generate New
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">Email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full border rounded px-3 py-2"
          placeholder="staff@example.com"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Role</label>
        <select
          value={role}
          onChange={(e) => setRole(e.target.value as "admin" | "staff")}
          className="w-full border rounded px-3 py-2"
        >
          <option value="staff">Staff</option>
          <option value="admin">Admin</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Permissions</label>
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {availablePermissions?.map((perm) => (
            <label key={perm.key} className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={selectedPermissions.includes(perm.key)}
                onChange={() => togglePermission(perm.key)}
                disabled={role === "admin"} // Admin gets all permissions
              />
              <span>{perm.key}</span>
              {perm.description && (
                <span className="text-gray-500 text-sm">- {perm.description}</span>
              )}
            </label>
          ))}
        </div>
      </div>

      <button
        onClick={handleGenerateLink}
        disabled={!email || (role === "staff" && selectedPermissions.length === 0)}
        className="w-full bg-blue-600 text-white py-2 rounded disabled:opacity-50"
      >
        Generate Invite
      </button>
    </div>
  );
}
```

### 4.3 Verify Page (Magic Link Landing)

```typescript
// dashboard/src/routes/auth/verify.tsx
import { useEffect, useState } from "react";
import { useAuthActions } from "@convex-dev/auth/react";
import { useNavigate, useSearchParams } from "@tanstack/react-router";

export function VerifyPage() {
  const { signIn } = useAuthActions();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [step, setStep] = useState<"loading" | "form" | "error">("loading");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = searchParams.get("token");
    if (!token) {
      setError("No token provided");
      setStep("error");
      return;
    }
    setStep("form");
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = searchParams.get("token");

    try {
      await signIn("magic-link", { token, name, phone });
      navigate({ to: "/dashboard" });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Verification failed");
      setStep("error");
    }
  };

  if (step === "loading") {
    return <div>Loading...</div>;
  }

  if (step === "error") {
    return (
      <div className="p-6 text-center">
        <h2 className="text-red-600 text-lg mb-2">Error</h2>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h1 className="text-2xl font-bold mb-6">Complete Your Profile</h1>
        <p className="text-gray-600 mb-6">
          Please provide your details to join the organization.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Full Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full border rounded px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Phone Number</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
              className="w-full border rounded px-3 py-2"
            />
          </div>

          {error && (
            <p className="text-red-600 text-sm">{error}</p>
          )}

          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
          >
            Join Organization
          </button>
        </form>
      </div>
    </div>
  );
}
```

---

## Phase 5: Protecting Endpoints

### 5.1 Example: Protect Products Mutation

```typescript
// convex/products.ts
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { hasPermission } from "./permissions";

export const create = mutation({
  args: {
    name: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", identity.email!))
      .unique();

    if (!user) throw new Error("User not found");

    // Check permission
    const canCreate = await hasPermission(ctx, user._id, "write_products");
    if (!canCreate) throw new Error("Not authorized to create products");

    // Create product
    return await ctx.db.insert("products", {
      ...args,
      storeId: user.storeId!,
    });
  },
});
```

---

## Phase 6: Seed Permissions

Run this once to populate the permissions table:

```typescript
// convex/seed.ts
import { internalMutation } from "./_generated/server";

export const seedPermissions = internalMutation(async (ctx) => {
  const existing = await ctx.db.query("permissions").first();
  if (existing) return; // Already seeded

  const permissions = [
    { key: "read_products", description: "View products" },
    { key: "write_products", description: "Create/edit products" },
    { key: "delete_products", description: "Delete products" },
    { key: "read_orders", description: "View orders" },
    { key: "write_orders", description: "Create orders" },
    { key: "manage_orders", description: "Update order status" },
    { key: "read_customers", description: "View customers" },
    { key: "write_customers", description: "Create/edit customers" },
    { key: "read_analytics", description: "View analytics" },
    { key: "manage_settings", description: "Manage store settings" },
  ];

  for (const perm of permissions) {
    await ctx.db.insert("permissions", {
      ...perm,
      createdAt: Date.now(),
    });
  }
});
```

---

## File Structure

```
src/apps/api/convex/
├── auth.ts                    # Convex Auth config + magic-link provider
├── schema.ts                  # Updated schema with users extension
├── organizations.ts           # Org CRUD + founder signup
├── stores.ts                  # Store CRUD + current store
├── magicLinks.ts              # Invitation management
├── permissions.ts            # Permission helpers
├── permissions-seed.ts       # Seed default permissions
├── users.ts                  # User queries
├── products.ts               # Example: protected endpoint
└── (existing files...)
```

---

## Implementation Order

1. **Update schema.ts** - Add new tables and extend users
2. **Configure auth.ts** - Add custom magic-link provider
3. **Create organizations.ts** - Founder signup
4. **Create stores.ts** - Store management + current store
5. **Create magicLinks.ts** - Invite functionality
6. **Create permissions.ts** - Permission helpers
7. **Seed permissions** - Run seed function
8. **Frontend hooks** - useOrganization, useStore, usePermissions
9. **Invite modal** - QR code generation
10. **Verify page** - Magic link acceptance flow
11. **Protect existing endpoints** - Add permission checks

---

## Open Questions

- [ ] How should staff switch between stores within the same org?
- [ ] Should there be a "personal" store vs "shared" stores concept?
- [ ] Any specific permissions needed beyond the examples?
