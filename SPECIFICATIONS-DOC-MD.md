# 📋 Product Specification: "OmniSync" Operations Dashboard & POS

**Project Type:** Full-Stack E-commerce Middleware & Operations Platform
**Core Objective:** Demonstrate senior-level capability in **System Reliability**, **Offline-First Architecture**, and **Third-Party Integration**.

---

## 1. System Architecture & Tech Stack

* **Architecture Style:** Event-Driven, Headless, Offline-First.
* **Frontend:** React / Next.js (App Router preferred for server components).
* **Backend:** Node.js (NestJS or Express) or Next.js API Routes.
* **Database:** PostgreSQL (Relation-heavy data) with Prisma or Drizzle ORM.
* **Async Processing:** Redis + BullMQ (for background jobs and sync queues).
* **Local Storage:** `IndexedDB` (via TanStack Query or RxDB) for offline POS data.
* **Hosting/Infra:** Vercel (Frontend) + Railway/Render (Backend/DB/Redis).

---

## 2. Core Module: The "Sync Engine" (Backend Flagship)
*The system's brain. Handles the messy reality of connecting to Shopify.*

* **Shopify Adapter:** A strict transformation layer that normalizes incoming Shopify JSON into your internal database schema (e.g., mapping Shopify `variants` to your `SKU` table).
* **Job Queue System (The "Buffer"):**
    * **Import Jobs:** All data fetching happens in background workers, never blocking the UI.
    * **Retry Logic:** Automated "Exponential Backoff" strategy for failed API calls (retries at 1min, 5min, 15min).
* **Rate Limit Governor:** A "Leaky Bucket" implementation to strictly throttle outgoing requests to stay under Shopify’s API limits.
* **Webhooks Handler:** Dedicated endpoint to receive real-time events (`order/created`, `product/updated`) and trigger immediate database updates via WebSockets.
* **Conflict Resolution Strategy:** "Last-Write-Wins" logic with audit logs for inventory conflicts between POS and Online Store.

---

## 3. Feature Module: Offline-First POS (Frontend Flagship)
*The "Jaw-Dropping" demo. A resilient Point of Sale system.*

* **Offline Mode:** Fully functional UI when network request fails.
    * Products and Customer data cached locally in `IndexedDB`.
    * Search and Cart calculations run 100% client-side.
* **Optimistic UI:** When a cashier hits "Checkout":
    1.  UI immediately shows "Success" tick.
    2.  Order is saved to local storage "Pending Queue."
    3.  Background worker attempts server sync.
* **Auto-Reconnection Sync:** Event listener on `window.ononline` triggers a flush of the "Pending Queue" to the server.
* **Multi-Device Merging:** Logic to handle inventory decrements from multiple POS instances simultaneously (Server rejects order if stock < 0).

---

## 4. Feature Module: Operations Dashboard (The Agency Standard)
*The control center for high-volume merchants.*

* **Performance Data Grid:**
    * Virtual scrolling (or efficient pagination) capable of handling 5,000+ rows.
    * Server-side filtering, sorting, and text search.
* **Global Command Palette (`Cmd+K`):**
    * Instant navigation to specific Product Details, Order IDs, or Settings pages.
* **Bulk Operations:**
    * Mechanism to select multiple entities and apply updates (e.g., "Increase Price by 10%").
    * Bulk jobs are sent to the Queue, showing a progress bar to the user.
* **System Status Monitor:** A dedicated admin view showing the health of the Sync Engine, Queue length, and a log of recent API errors.

---

## 5. Feature Module: Intelligence & Automation (The "Extras")

* **Inventory Velocity Prediction:** Algorithm calculating "Days of Stock Remaining" based on the last 30 days of sales velocity.
* **Telegram Bot Integration:**
    * Auth: Secure binding of Telegram User ID to Dashboard Admin account.
    * Commands: `/stock [sku]` (returns count), `/alert [sku] [threshold]` (sets low stock alert).
* **Weekly AI Summary:**
    * Cron Job running every Friday at 18:00.
    * Aggregates weekly stats -> Sends prompt to LLM API -> Emails/Displays 3-bullet executive summary.

---

## 6. Non-Functional Requirements (The "Senior" Checklist)

* **Data Seeding (Simulation):** `npm run seed` command that populates the DB with 1,000+ realistic products, variations, and historical orders.
* **Validation:** Strict input validation using Zod/Joi at the API boundary (rejects malformed data before it hits the DB).
* **Security:**
    * JWT or Session-based Authentication.
    * Role-Based Access Control (RBAC): `ADMIN` (Full Access) vs `STAFF` (POS Only, No Delete).
* **PWA Compliance:** Valid `manifest.json` and Service Worker caching strategies for "Install to Home Screen" capability.

---

### ⚠️ Scope Exclusions (What NOT to build)
* **Native Mobile Apps:** (Stick to PWA).
* **Customer-Facing Storefront:** (Use the existing Shopify store; you are building the *backend ops* tool).
* **Complex Loyalty Logic:** (Keep it simple or skip).
* **Payment Gateway Integration:** (Mock the payment success in POS; do not process real credit cards).
