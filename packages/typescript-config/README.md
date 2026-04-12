<div align="center">
  <h1>@repo/typescript-config</h1>
  <p><strong>Shared TypeScript Presets for Tichsy</strong></p>

  [![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
</div>

---

A centralized package for TypeScript compiler configuration (`tsconfig.json`) across the Tichsy monorepo. This guarantees that compiler strictness, target emit versions, and module resolution strategies are unified across all workspaces.

## 📦 Available Presets

| Preset | Purpose |
| --- | --- |
| `base.json` | The strict baseline for vanilla Node environments and packages. |
| `nextjs.json` | Next.js app preset extending `base.json` with React/DOM typing. |
| `react-library.json` | React library preset designed for packages that build UI. |

## 💻 Usage Example

Instead of maintaining a massive `tsconfig.json` in each folder, extend one of these presets and only define paths/includes local to that specific workspace.

**Example in a Next.js app (`apps/web/tsconfig.json`):**
```json
{
  "extends": "@repo/typescript-config/nextjs.json",
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src", "next-env.d.ts"],
  "exclude": ["node_modules"]
}
```

**Example in a standard package (`packages/types/tsconfig.json`):**
```json
{
  "extends": "@repo/typescript-config/base.json",
  "include": ["src"],
  "exclude": ["node_modules", "dist"]
}
```

## 💡 Consumer Guidance

1. **Always Extend:** Never duplicate compiler options (like `strict: true` or `target`) into local `tsconfig.json` files. Let the preset handle it.
2. **Keep Includes Local:** Only define `include`, `exclude`, and specific alias `paths` in the app-local TSConfigs, as these inherently depend on the folder structure of that specific app.

## 📚 Related Documentation

- [Monorepo Root](../../README.md)
- [ESLint Config Package](../eslint-config/README.md)
