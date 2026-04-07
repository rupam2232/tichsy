# @repo/eslint-config

Shared ESLint configuration package for the Tichsy monorepo.

Use this package to keep linting rules consistent across applications and internal packages.

## Available Configs

- `@repo/eslint-config/base` - base TypeScript-focused lint rules
- `@repo/eslint-config/next-js` - Next.js-specific lint rules
- `@repo/eslint-config/react-internal` - React package rules for internal libraries

## Usage

Example in a workspace `eslint.config.js`:

```js
import baseConfig from "@repo/eslint-config/base";

export default [...baseConfig];
```

For Next.js apps:

```js
import nextConfig from "@repo/eslint-config/next-js";

export default [...nextConfig];
```

## Notes

- Keep local overrides minimal and workspace-specific.
- Prefer updating this package when a lint rule should apply monorepo-wide.

## Related Documentation

- Root overview: [../../README.md](../../README.md)
- TypeScript config package: [../typescript-config/README.md](../typescript-config/README.md)
