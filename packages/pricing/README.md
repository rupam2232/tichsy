<div align="center">
  <h1>@repo/pricing</h1>
  <p><strong>Shared Subscription & Limits Authority for Tichsy</strong></p>

  [![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
</div>

---

This package serves as the **Single Source of Truth** for plan capabilities, operational limits, feature gates, and billing mechanics. Because pricing models apply to both API enforcement in the backend and UI rendering in the frontend, all subscription logic is centralized here.

## 📦 Package Exports

| Export | Purpose |
| --- | --- |
| `SUBSCRIPTION_PLANS` | Configuration map for `starter`, `medium`, and `pro` thresholds. |
| `GRACE_PERIOD_DAYS` | Integer representing the grace window allowed before processing a downgrade. |
| `PLAN_DISPLAYS` | Marketing-oriented metadata needed strictly for UI rendering of pricing tables. |
| `getAllPlans()` | Function returning a formatted, display-ready list of plan capabilities. |
| `types.ts` | Complete TS interfaces for internal subscription contracts. |

## 📊 Plan Snapshot

- **`starter`**: A completely free tier with strict operational limits for small trials.
- **`medium`**: A paid tier granting expanded limits but keeping constraints simpler than Pro.
- **`pro`**: The highest limits crafted to facilitate heavy loads and multi-restaurant operations.

## 💻 Usage Example

```ts
import { SUBSCRIPTION_PLANS, GRACE_PERIOD_DAYS } from "@repo/pricing";

// API usage limit enforcement logic
const restaurantMaxTables = SUBSCRIPTION_PLANS.starter.limits.maxTables;
const paymentGrace = GRACE_PERIOD_DAYS;
```

## 🛠 Internal Scripts

| Command | Description |
| --- | --- |
| `npm run build` | Bundles package into CJS, ESM, and generates type definitions |
| `npm run dev` | Watches source and rebuilds on change |
| `npm run lint` | Runs strict ESLint checks |
| `npm run type-check` | Emits pure TypeScript diagnostics |

## 💡 Consumer Guidance

1. **Strict Centralization:** Do NOT duplicate or hard-code threshold numbers, pricing dollars, or plan boundaries inside either the Client or the Server apps. Let this package feed the numbers outward.
2. **Consistent Imports:** By using the exact same constants, the Node.js API guarantees that the limits it enforces flawlessly match the limits the React App displays to the user.

## 📚 Related Documentation

- [Monorepo Root](../../README.md)
- [Backend Server App](../../apps/server/README.md)
- [Frontend React App](../../apps/web/README.md)
