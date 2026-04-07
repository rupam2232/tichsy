# @repo/pricing

Shared subscription pricing and plan-limit definitions for Tichsy.

This package is the source of truth for plan capabilities, limits, and billing amounts used by both backend and frontend applications.

## Exports

- `SUBSCRIPTION_PLANS` - plan configuration map for `starter`, `medium`, and `pro`
- `GRACE_PERIOD_DAYS` - grace window before downgrade processing
- `PLAN_DISPLAYS` - marketing-oriented plan metadata for UI rendering
- `getAllPlans()` - helper that returns display-ready plan objects
- Type exports from `types.ts` including plan and billing contracts

## Plan Snapshot

- `starter`: free tier with strict limits
- `medium`: paid tier with expanded limits and lower constraints than pro
- `pro`: highest limits for multi-restaurant operations

## Usage

```ts
import { SUBSCRIPTION_PLANS, GRACE_PERIOD_DAYS } from "@repo/pricing";

const starterLimits = SUBSCRIPTION_PLANS.starter;
const graceDays = GRACE_PERIOD_DAYS;
```

## Scripts

| Command | Description |
| --- | --- |
| `npm run build` | Bundles package to CJS, ESM, and type declarations |
| `npm run dev` | Watches and rebuilds on source changes |
| `npm run lint` | Runs ESLint with zero warning budget |
| `npm run type-check` | Runs TypeScript checks |

## Consumer Guidance

- Keep all subscription thresholds and billing values here.
- Do not duplicate plan values in app code.
- Import from this package in both `apps/server` and `apps/web` for consistency.

## Related Documentation

- Root overview: [../../README.md](../../README.md)
- Backend app: [../../apps/server/README.md](../../apps/server/README.md)
- Frontend app: [../../apps/web/README.md](../../apps/web/README.md)
