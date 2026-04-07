# Tichsy

Tichsy is a QR-based restaurant ordering system that lets customers scan, browse the menu, and place orders instantly from their table.

This repository is a TypeScript monorepo powered by Turborepo. It contains the production web application, backend APIs, shared UI components, shared domain contracts, and pricing/subscription logic.

## What Tichsy does

- Enables table-side ordering via QR links.
- Supports restaurant operations: menu, tables, orders, payments, and notifications.
- Provides subscription tiers with plan-based limits and lifecycle handling.
- Shares contracts and business logic across frontend and backend to reduce drift.

## Monorepo Architecture

### Applications

- `apps/web` - Next.js frontend for customers and restaurant operators.
- `apps/server` - Express + MongoDB backend APIs, sockets, and background jobs.

### Packages

- `packages/ui` - Shared React components, hooks, and styling primitives.
- `packages/types` - Shared Zod schemas and TypeScript interfaces.
- `packages/pricing` - Subscription plans, limits, and display metadata.
- `packages/eslint-config` - Shared ESLint configurations.
- `packages/typescript-config` - Shared TypeScript configuration presets.

## Workspace Map

| Workspace | Role | README |
| --- | --- | --- |
| `apps/web` | Frontend application | [apps/web/README.md](apps/web/README.md) |
| `apps/server` | Backend application | [apps/server/README.md](apps/server/README.md) |
| `packages/ui` | Shared UI library | [packages/ui/README.md](packages/ui/README.md) |
| `packages/types` | Shared contracts | [packages/types/README.md](packages/types/README.md) |
| `packages/pricing` | Subscription logic | [packages/pricing/README.md](packages/pricing/README.md) |
| `packages/eslint-config` | Lint configuration | [packages/eslint-config/README.md](packages/eslint-config/README.md) |
| `packages/typescript-config` | TS config presets | [packages/typescript-config/README.md](packages/typescript-config/README.md) |

## Core Flows

- Customer ordering flow: QR scan -> menu browsing -> cart -> order placement -> order tracking.
- Operator flow: authentication -> restaurant setup -> table/menu management -> live order operations.
- Subscription flow: plan preview -> plan purchase/upgrade -> webhook validation -> usage-limit enforcement.

## Tech Stack

- Monorepo and orchestration: Turborepo, npm workspaces.
- Frontend: Next.js 15, React 19, Redux Toolkit, Socket.IO client.
- Backend: Express 5, Mongoose, Socket.IO, node-cron.
- Shared tooling: TypeScript, ESLint, Prettier, Zod.

## Local Development

### Prerequisites

- Node.js 18 or newer
- npm 10.9.0 or compatible
- MongoDB instance for the backend

### Install dependencies

```bash
npm install
```

### Start all workspaces in development mode

```bash
npm run dev
```

### Start only one app

```bash
npm run dev -w=apps/web
npm run dev -w=apps/server
```

### Quality checks

```bash
npm run lint
npm run check-types
npm run build
```

## Root Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Starts all workspace dev processes via Turbo |
| `npm run build` | Builds all apps and packages |
| `npm run start` | Runs start scripts after dependency builds |
| `npm run lint` | Runs lint checks across workspaces |
| `npm run check-types` | Runs TypeScript checks across workspaces |
| `npm run format` | Formats TypeScript and Markdown files |

## Collaboration

- Keep package responsibilities isolated.
- Place reusable domain types and validation contracts in `packages/types`.
- Place subscription business rules in `packages/pricing`.
- Keep app-specific presentation and API orchestration inside each app.

## License

This project is private and intended for internal development.
