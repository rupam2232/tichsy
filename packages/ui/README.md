# @repo/ui

Shared UI package for Tichsy applications.

This package provides reusable React components, hooks, utility helpers, and shared styling assets consumed by application workspaces.

## Exports

- `./components/*` - component modules
- `./hooks/*` - reusable hooks
- `./lib/*` - utility helpers
- `./globals.css` - shared Tailwind/CSS entry
- `./postcss.config` - shared PostCSS configuration

## Usage

```ts
import { Button } from "@repo/ui/components/button";
import "@repo/ui/globals.css";
```

## Styling Integration

- Tailwind CSS and PostCSS are configured in this package.
- Consumers should align their build setup with Tailwind v4 and PostCSS support.

## Scripts

| Command | Description |
| --- | --- |
| `npm run lint` | Runs ESLint with zero warning budget |
| `npm run check-types` | Runs TypeScript checks |
| `npm run generate:component` | Scaffolds a new component via Turbo generator |

## Consumer Guidance

- Import components from explicit module paths for predictable bundling.
- Keep app-specific composition in app code, and promote reusable primitives into this package.

## Related Documentation

- Root overview: [../../README.md](../../README.md)
- Frontend app: [../../apps/web/README.md](../../apps/web/README.md)
