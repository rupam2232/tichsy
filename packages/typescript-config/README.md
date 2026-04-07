# @repo/typescript-config

Shared TypeScript configuration presets for Tichsy workspaces.

This package keeps compiler behavior consistent across apps and internal libraries.

## Available Presets

- `base.json` - strict baseline configuration for Node and browser targets
- `nextjs.json` - Next.js app preset extending `base.json`
- `react-library.json` - React library preset extending `base.json`

## Usage

Example `tsconfig.json` in a Next.js app:

```json
{
  "extends": "@repo/typescript-config/nextjs.json",
  "compilerOptions": {
    "baseUrl": "."
  },
  "include": ["src", "next-env.d.ts"]
}
```

Example in a package:

```json
{
  "extends": "@repo/typescript-config/base.json",
  "include": ["src"]
}
```

## Guidance

- Prefer preset extension over duplicating compiler options.
- Keep workspace-specific options local while preserving strict defaults from shared presets.

## Related Documentation

- Root overview: [../../README.md](../../README.md)
- ESLint config package: [../eslint-config/README.md](../eslint-config/README.md)
