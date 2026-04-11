<div align="center">
  <h1>Tichsy POS & Ordering System</h1>
  <p><strong>A modern QR-based restaurant ordering system and POS, powered by Turborepo.</strong></p>

  [![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
  [![Next.js](https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)](#)
  [![Express](https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white)](#)
  [![MongoDB](https://img.shields.io/badge/MongoDB-4EA94B?style=for-the-badge&logo=mongodb&logoColor=white)](#)
  [![Turborepo](https://img.shields.io/badge/Turborepo-EF4444?style=for-the-badge&logo=turborepo&logoColor=white)](#)
</div>

---

Tichsy is a **Real-Time, QR-based** restaurant ordering and POS system. It empowers customers to scan, browse dynamic menus, and place orders directly from their table, while kitchen staff and operators receive those orders **instantly via WebSockets**.

This repository is a **TypeScript monorepo** powered by [Turborepo](https://turborepo.dev). It contains the production web application, backend APIs, shared UI components, shared domain contracts, and pricing/subscription logic.

> **Note:** This project is private and intended for internal development.

## 📖 Table of Contents
- [What Tichsy Does](#-what-tichsy-does)
- [Monorepo Architecture](#-monorepo-architecture)
- [Core Flows](#-core-flows)
- [Tech Stack](#-tech-stack)
- [Local Development](#-local-development)
- [Root Scripts](#-root-scripts)

---

## ⚡ What Tichsy Does
- **QR-Side Ordering:** Enables table-side ordering via dynamic QR links, eliminating wait times.
- **Real-Time Operations:** Operators receive instant order notifications, table updates, and payment alerts via **Socket.IO**.
- **Subscription Management:** Provides subscription tiers with plan-based limits and lifecycle handling.
- **Shared Contracts:** Shares interfaces and business logic across frontend and backend to reduce drift.

## 🏗 Monorepo Architecture

### Applications
| App | Description | Stack | README |
| --- | --- | --- | --- |
| `apps/web` | Customer and operator frontend | Next.js 15, React 19 | [Link](apps/web/README.md) |
| `apps/server` | Backend APIs, sockets, cron jobs | Express 5, MongoDB | [Link](apps/server/README.md) |

### Packages
| Package | Description | README |
| --- | --- | --- |
| `packages/ui` | Shared React components and Tailwind styling | [Link](packages/ui/README.md) |
| `packages/types` | Shared Zod schemas and TypeScript interfaces | [Link](packages/types/README.md) |
| `packages/pricing` | Subscription plans, limits, and display metadata | [Link](packages/pricing/README.md) |
| `packages/eslint-config` | Shared ESLint configurations | [Link](packages/eslint-config/README.md) |
| `packages/typescript-config`| Shared TypeScript configuration presets | [Link](packages/typescript-config/README.md) |

## 🔄 Core Flows
- **Customer Ordering:** QR scan ➡️ Menu browsing ➡️ Cart ➡️ Checkout ➡️ **Real-time** order tracking
- **Operator Flow:** Authentication ➡️ Restaurant setup ➡️ Table management ➡️ **Live Socket** order operations
- **Subscription Flow:** Plan preview ➡️ Plan purchase/upgrade ➡️ Webhook validation ➡️ Usage-limit enforcement

## 🛠 Tech Stack
- **Monorepo:** Turborepo, npm workspaces
- **Frontend:** Next.js 15, React 19, Redux Toolkit, Socket.IO client, Tailwind CSS
- **Backend:** Express 5, Mongoose, Socket.IO, node-cron
- **Tooling:** TypeScript, ESLint, Prettier, Zod

## 🚀 Local Development

### Prerequisites
- Node.js 18 or newer
- npm 10.9.0 or compatible
- MongoDB instance (local or Atlas) for the backend

### 1. Install dependencies
```bash
npm install
```

### 2. Start development servers
Starts all workspace dev processes via Turbo:
```bash
npm run dev
```

**Or start a specific app locally:**
```bash
npx turbo run dev --filter=@repo/web
# OR
npx turbo run dev --filter=@repo/server
```

### 3. Quality Checks
```bash
npm run lint         # ESLint checks
npm run check-types  # TypeScript checks
npm run build        # Build all apps/packages
```

## 📜 Root Scripts
| Command | Description |
| --- | --- |
| `npm run dev` | Starts all workspace dev processes via Turbo |
| `npm run build` | Builds all apps and packages |
| `npm run start` | Runs start scripts after dependency builds |
| `npm run lint` | Runs lint checks across workspaces |
| `npm run check-types` | Runs TypeScript checks across workspaces |
| `npm run format` | Formats TypeScript and Markdown files |

## 🤝 Collaboration Guidelines
1. Keep package responsibilities isolated.
2. Place reusable domain types and validation contracts strictly in `packages/types`.
3. Centralize subscription business rules in `packages/pricing`.
4. Keep app-specific presentation and API orchestration inside each app.

