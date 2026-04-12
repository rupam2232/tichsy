<div align="center">
  <h1>@repo/ui</h1>
  <p><strong>Shared UI Package for Tichsy</strong></p>

  [![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](#)
  [![Tailwind](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](#)
  [![Radix UI](https://img.shields.io/badge/Radix_UI-161618?style=for-the-badge&logo=radix-ui&logoColor=white)](#)
</div>

---

This package provides reusable React components, custom hooks, utility helpers, and shared styling assets consumed by all Tichsy application workspaces.

## 📦 Package Exports

| Path | Purpose |
| --- | --- |
| `./components/*` | Feature-agnostic, reusable React components |
| `./hooks/*` | Shared custom React lifecycle/state hooks |
| `./lib/*` | Useful frontend logic, CN merge functions, etc. |
| `./globals.css` | The central Tailwind/CSS entry point |
| `./postcss.config` | Monorepo-wide shared PostCSS configuration |

## 💻 Usage Example

```tsx
import { Button } from "@repo/ui/components/button";
import "@repo/ui/globals.css"; // Ensure globals are imported at your app root

export function MyComponent() {
  return <Button variant="default">Place Order</Button>;
}
```

## 🎨 Styling Integration

- Tailwind CSS (v4) and PostCSS are fully configured within this package.
- Consuming Next.js apps seamlessly pick up the styles when components are imported due to Turborepo's unified bundling.

## 🛠 Internal Scripts

| Command | Description |
| --- | --- |
| `npm run lint` | Runs ESLint across all components |
| `npm run check-types` | Validates TypeScript with zero-emission |
| `npm run generate:component`| Scaffolds a new component template using Turbo generator |

## 💡 Consumer Guidance

1. **Explicit Paths:** Always import components from absolute module paths for aggressive tree-shaking and predictable bundling (e.g., `import { Card } from "@repo/ui/components/card"`, not from an index).
2. **Generic Principles:** If a UI component starts feeling heavily tied to a specific business feature (like ordering food), it belongs in the `apps/` code, not in `packages/ui`. 

## 📚 Related Documentation

- [Monorepo Root](../../README.md)
- [Frontend App](../../apps/web/README.md)
