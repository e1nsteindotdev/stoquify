import "dotenv/config"
import { defineConfig } from "drizzle-kit"

export default defineConfig({
  out: "./drizzle",
  schema: "./src/database/schema.ts",
  dialect: "sqlite",
  driver: "d1-http",
  dbCredentials: {
    accountId: process.env.CLOUDFLARE_ACCOUNT_ID!,
    databaseId: "ce01b973-458c-40b2-a7a4-3aed8a3faa02",
    token: process.env.CLOUDFLARE_D1_TOKEN!
  }
})
