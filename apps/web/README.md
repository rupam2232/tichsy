# Web App

Frontend application for Tichsy, built with Next.js.

The web app serves two primary experiences:

- Restaurant operator experience for managing setup, menu, tables, billing, and operations.
- Customer experience for QR-based menu browsing, ordering, and order tracking.

## Tech Stack

- Next.js 15 (App Router)
- React 19
- Redux Toolkit
- React Hook Form + Zod validation
- Socket.IO client

## Application Areas

- `src/app/(auth)` - sign-in, sign-up, and account recovery routes.
- `src/app/(app)` - authenticated operator flows such as home, billing, restaurant, notifications, and settings.
- `src/app/(customer)` - customer QR and order journey.
- `src/app/(public)` - public pages.
- `src/store` - global application state.
- `src/components` - feature and shared UI composition.
- `src/context/SocketContext.tsx` - realtime connection lifecycle.

## Environment Variables

Create `apps/web/.env.local`:

```env
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_SERVER_BASE_URL=http://localhost:8000/api/v1
NEXT_PUBLIC_SOCKET_BASE_URL=http://localhost:8000
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id
NEXT_PUBLIC_RAZORPAY_KEY_ID=your_razorpay_key_id
```

## Run Locally

From the repository root:

```bash
turbo run dev --filter=web
```

Or from this workspace:

```bash
npm run dev
```

The app runs on `http://localhost:3000`.

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Starts Next.js in dev mode on port 3000 |
| `npm run build` | Creates a production build |
| `npm run start` | Runs the production server |
| `npm run lint` | Runs ESLint with zero warning budget |
| `npm run check-types` | Runs TypeScript type checks |

## Integration Notes

- API calls use `NEXT_PUBLIC_SERVER_BASE_URL`.
- Server-side Axios helpers forward cookies for authenticated SSR requests.
- Socket connections use `NEXT_PUBLIC_SOCKET_BASE_URL` with credentials enabled.

## Related Documentation

- Root overview: [../../README.md](../../README.md)
- Backend APIs: [../server/README.md](../server/README.md)
- Shared contracts: [../../packages/types/README.md](../../packages/types/README.md)
- Shared pricing logic: [../../packages/pricing/README.md](../../packages/pricing/README.md)
- Shared UI package: [../../packages/ui/README.md](../../packages/ui/README.md)
