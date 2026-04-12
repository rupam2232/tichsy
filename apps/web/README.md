<div align="center">
  <h1>Tichsy Web App</h1>
  <p><strong>Next.js Frontend Application</strong></p>

  [![Next.js](https://img.shields.io/badge/Next.js_15-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)](#)
  [![React](https://img.shields.io/badge/React_19-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](#)
  [![Redux](https://img.shields.io/badge/Redux-593D88?style=for-the-badge&logo=redux&logoColor=white)](#)
  [![Tailwind](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](#)
</div>

---

The frontend application for Tichsy.

The web app serves two primary experiences:
- **Restaurant Operator Experience:** For managing setup, menu, tables, billing, and operations.
- **Customer Experience:** For QR-based menu browsing, ordering, and real-time order tracking.

## 🗂 Application Architecture

| Path / Folder | Purpose |
| --- | --- |
| `src/app/(auth)` | Sign-in, sign-up, and account recovery routes |
| `src/app/(app)` | Authenticated operator flows (home, billing, restaurant, settings) |
| `src/app/(customer)` | Customer QR and order journey |
| `src/app/(public)` | Public marketing and landing pages |
| `src/store` | Global Redux application state |
| `src/components` | Feature modules and UI composition |
| `src/context/SocketContext.tsx` | Real-time WebSocket lifecycle connection |

## ⚙️ Environment Variables

Create `apps/web/.env.local`:

```env
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_SERVER_BASE_URL=http://localhost:8000/v1
NEXT_PUBLIC_SOCKET_BASE_URL=http://localhost:8000
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id
NEXT_PUBLIC_RAZORPAY_KEY_ID=your_razorpay_key_id
```

## 🚀 Run Locally

From the repository root (recommended):
```bash
npx turbo run dev --filter=@repo/web
```

Or directly from this workspace:
```bash
npm run dev
```

The app will start on **http://localhost:3000**.

## 📜 Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Starts Next.js in dev mode |
| `npm run build` | Creates a production build |
| `npm run start` | Runs the production server |
| `npm run lint` | Runs ESLint |
| `npm run check-types`| Runs full TypeScript type checks |

## 🔗 Integration Notes

- All backend API calls securely use the `NEXT_PUBLIC_SERVER_BASE_URL`.
- Socket connections (via Socket.io) utilize `NEXT_PUBLIC_SOCKET_BASE_URL` with credentials enabled.

## 📚 Related Documentation

- [Monorepo Root](../../README.md)
- [Backend Server App](../server/README.md)
- [Shared UI Package](../../packages/ui/README.md)
- [Shared Types](../../packages/types/README.md)
- [Pricing Rules](../../packages/pricing/README.md)
