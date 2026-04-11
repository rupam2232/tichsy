<div align="center">
  <h1>@repo/eslint-config</h1>
  <p><strong>Shared ESLint Configuration for Tichsy</strong></p>

  [![ESLint](https://img.shields.io/badge/ESLint-4B32C3?style=for-the-badge&logo=eslint&logoColor=white)](#)
  [![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
</div>

---

A centralized package containing standard ESLint rules for the entire Tichsy monorepo. Use this package to keep linting rules strict, predictable, and consistent across all applications and internal packages without duplicating configurations.

## 📦 Available Configs

| Preset | Target Environment |
| --- | --- |
| `@repo/eslint-config/base` | Node.js servers, standard TS packages |
| `@repo/eslint-config/next-js` | Next.js apps (includes React/Next plugins) |
| `@repo/eslint-config/react-internal` | Shared React libraries (like `@repo/ui`) |

## 💻 Usage Example

Inside any workspace's `eslint.config.js` (or `.mjs` / `.cjs`), simply import and spread the desired preset into the export array.

**For a backend or pure TS package (`apps/server`, `@repo/types`)**:
```js
import baseConfig from "@repo/eslint-config/base";

export default [...baseConfig];
```

**For a Next.js application (`apps/web`)**:
```js
import nextConfig from "@repo/eslint-config/next-js";

export default [...nextConfig];
```

## 💡 Consumer Guidance

1. **Keep it Consistent:** Do not disable rules locally unless there is an exceptional edge case. Use `// eslint-disable-next-line` sparingly with a comment explaining why.
2. **Promote Global Rules:** If you find yourself consistently overriding a rule across multiple packages, submit a PR to update *this* package so everyone benefits.
3. **No Warning Budget:** The monorepo aims for a zero-warning budget in CI. Treat warnings as errors.

## 📚 Related Documentation

- [Monorepo Root](../../README.md)
- [TypeScript Config Package](../typescript-config/README.md)
