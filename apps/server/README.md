# Server App

Backend service for Tichsy, built with Express and MongoDB.

This service powers authentication, restaurant operations, menu management, orders, payments, subscriptions, invitations, notifications, media uploads, and realtime updates.

## Tech Stack

- Express 5
- Mongoose (MongoDB)
- Socket.IO
- node-cron
- Zod runtime validation
- Razorpay and Resend integrations

## API Base Path

All routes are mounted under:

`/api/v1`

## Route Groups

- `/auth` - signup, signin, google auth, password recovery, signout
- `/user` - profile and account settings
- `/restaurant` - restaurant lifecycle, staff, analytics, archive/unarchive
- `/table` - table and QR-linked table operations
- `/media` - upload and delete media assets
- `/food-item` - menu items, variants, add-ons, image limits
- `/order` - order creation, updates, and status lifecycle
- `/otp` - OTP generation and verification
- `/payment` - payment verification and webhook processing
- `/cart` - cart lifecycle operations
- `/subscription` - subscription details, preview, creation, history, receipt download
- `/notification` - user notification operations
- `/invitation` - staff invitation send/accept/revoke flow

## Runtime Components

- HTTP API server
- Socket.IO server with authenticated user and restaurant rooms
- Subscription cron job for expiry reminders and lifecycle handling

## Middleware Highlights

- Authentication middleware with token refresh and device session checks
- OTP verification middleware for sensitive auth flows
- Restaurant access middleware for owner/staff authorization
- Subscription checks for plan enforcement in production

## Environment Variables

Create `apps/server/.env`:

```env
MONGODB_URI=mongodb://localhost:27017/tichsy
PORT=8000
CORS_ORIGIN=http://localhost:3000
NODE_ENV=development

GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

APP_LOGO_URL=https://your-cdn/logo.png
APP_NAME=tichsy

COOKIE_DOMAIN=
ACCESS_TOKEN_EXPIRY=1
ACCESS_TOKEN_SECRET=your_access_token_secret
REFRESH_TOKEN_EXPIRY=30
REFRESH_TOKEN_SECRET=your_refresh_token_secret
JWT_SECRET_KEY=your_jwt_secret

CLOUDINARY_URL=cloudinary://api_key:api_secret@cloud_name

RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
RAZORPAY_WEBHOOK_SECRET=your_razorpay_webhook_secret

FRONTEND_URL=http://localhost:3000
RESEND_API_KEY=your_resend_api_key
```

Notes:

- `CORS_ORIGIN` accepts a comma-separated list.
- `COOKIE_DOMAIN` is optional and usually set for production domains.
- `ACCESS_TOKEN_EXPIRY` and `REFRESH_TOKEN_EXPIRY` are interpreted as days.

## Run Locally

From repository root:

```bash
turbo run dev --filter=backend
```

Or from this workspace:

```bash
npm run dev
```

Default server URL is `http://localhost:8000`.

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | TypeScript watch build + nodemon on compiled output |
| `npm run build` | Compiles TypeScript to `dist` |
| `npm run start` | Runs compiled server from `dist` |
| `npm run lint` | Runs ESLint |
| `npm run check-types` | Runs TypeScript checks with no emit |
| `npm run format` | Formats files with Prettier |

## Related Documentation

- Root overview: [../../README.md](../../README.md)
- Frontend app: [../web/README.md](../web/README.md)
- Shared pricing rules: [../../packages/pricing/README.md](../../packages/pricing/README.md)
- Shared contracts: [../../packages/types/README.md](../../packages/types/README.md)
