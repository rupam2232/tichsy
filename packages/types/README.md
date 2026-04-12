<div align="center">
  <h1>@repo/types</h1>
  <p><strong>Shared Domain Contracts for Tichsy</strong></p>

  [![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
  [![Zod](https://img.shields.io/badge/Zod-3E67B1?style=for-the-badge&logo=zod&logoColor=white)](#)
</div>

---

This package centralizes both runtime validation schemas and static TypeScript interfaces to guarantee that the backend API, database adapters, and frontend client remain perfectly aligned on payload shapes, request validation, and response contracts.

## 🗂 What it Contains

- **Zod Schemas**: Used for parsing and strictly validating incoming data. Areas covered: Auth, Restaurant, Table, Food Items, Order Cart, Payments, Media logic, and Subscriptions.
- **Shared TS Interfaces**: Derived from Zod or defined cleanly for API shapes (e.g. `ServerActionResponse`, `ApiResponse`).

## 💻 Usage Example

```ts
import { CreateRestaurantSchema, type ApiResponse } from "@repo/types";

// Safe API payload validation (Server or Client)
const parsed = CreateRestaurantSchema.safeParse(input);

if (parsed.success) {
  // TS knows exactly what parsed.data is!
  console.log(parsed.data);
}
```

## 🏗 Build Output

Because this package is imported by both `apps/server` (Node/Express) and `apps/web` (Next.js/Browser), it uses `tsup` or similar configs to build correctly for both environments:
- ✅ CommonJS output (CJS)
- ✅ ECMAScript Module output (ESM)
- ✅ Typed Declaration files (`.d.ts`)

## 🛠 Internal Scripts

| Command | Description |
| --- | --- |
| `npm run build` | Bundles package to dual formats and emits definitions |
| `npm run dev` | Watches for changes and rebuilds instantly |

## 💡 Consumer Guidance

1. **No Duplication:** Do not redefine identical types or basic API shapes in application code. Import them from here.
2. **Schema Native:** Prefer exporting Zod Schemas over TS interfaces when the object models an API payload, then use `z.infer` to get the TS type automatically.

## 📚 Related Documentation

- [Monorepo Root](../../README.md)
- [Backend Server](../../apps/server/README.md)
- [Frontend App](../../apps/web/README.md)
