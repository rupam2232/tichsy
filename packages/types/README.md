# @repo/types

Shared domain contracts for Tichsy.

This package centralizes runtime validation schemas and TypeScript interfaces so backend and frontend stay aligned on payload shape, request validation, and response contracts.

## What it contains

- Zod schemas for core domains such as auth, restaurant, table, food item, order, cart, payment, media, and subscription.
- Shared TypeScript interfaces for API responses and domain entities.

## Usage

```ts
import { CreateRestaurantSchema, type ApiResponse } from "@repo/types";

const parsed = CreateRestaurantSchema.parse(input);
```

## Build Output

The package builds to:

- CommonJS output
- ESM output
- Type declaration files

## Scripts

| Command | Description |
| --- | --- |
| `npm run build` | Bundles package and generates declarations |
| `npm run dev` | Watches and rebuilds continuously |

## Consumer Guidance

- Keep shared contracts in this package instead of duplicating app-local types.
- Prefer schema exports for request validation and type inference.

## Related Documentation

- Root overview: [../../README.md](../../README.md)
- Backend app: [../../apps/server/README.md](../../apps/server/README.md)
- Frontend app: [../../apps/web/README.md](../../apps/web/README.md)
