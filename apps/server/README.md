<div align="center">
  <h1>Tichsy Server</h1>
  <p><strong>Express + MongoDB Backend Service</strong></p>

  [![Express](https://img.shields.io/badge/Express_5-000000?style=for-the-badge&logo=express&logoColor=white)](#)
  [![MongoDB](https://img.shields.io/badge/MongoDB-4EA94B?style=for-the-badge&logo=mongodb&logoColor=white)](#)
  [![Socket.io](https://img.shields.io/badge/Socket.io-010101?style=for-the-badge&logo=socketdotio&logoColor=white)](#)
  [![Zod](https://img.shields.io/badge/Zod-3E67B1?style=for-the-badge&logo=zod&logoColor=white)](#)
</div>

---

The core backend service powering Tichsy.

This service is the heart of our **Real-Time QR Ordering** system. Utilizing `Socket.io`, it powers seamless, instant updates between customers placing orders via QR codes on their phones and restaurant staff managing the live POS dashboard. 

Built on Express and MongoDB, it also handles authentication, restaurant operations, dynamic menu management, payments, and subscription limits.

## 🔌 API Base Path
All REST APIs are mounted under: `/v1`

## 🛣 Route Modules

| Group | Functionality |
| --- | --- |
| `/auth` | Signup, signin, Google auth, password recovery, signout |
| `/user` | Profile and account settings |
| `/restaurant`| Restaurant lifecycle, staff, analytics, archive/unarchive |
| `/table` | Table creation and QR-linked table operations |
| `/food-item` | Menu items, variants, add-ons, limits |
| `/order` | Order creation, updates, and status lifecycle |
| `/payment` | Payment verification and Razorpay webhook processing |
| `/subscription`| Subscription plans, history, generation of receipts |
| `/notification`| Centralized real-time server notification operations |
| `/media` | Cloudinary uploads and deletions |
| `/otp` | Secure OTP generation |
| `/invitation`| Staff email invite flows |

## ⚙️ Core Runtime Components
1. **HTTP REST API Server:** Serves app logic and integrations.
2. **Socket.IO Real-time Engine:** Manages authenticated user and dedicated restaurant rooms.
3. **Cron Jobs:** Subscription expiry reminders and downgrade lifecycle handling.

## 🛡 Security & Middleware Highlights
- **Auth Layer:** Complete JWT token flow (access/refresh) + device session invalidation checks.
- **RBAC & Authorization:** Strict restaurant-level middleware (owner vs staff validation).
- **Subscription Checks:** Restrict features at middleware level when usage-limits are hit.
- **OTP Gateway:** Email-linked operations gate.

## 🔑 Environment Variables
Create a file at `apps/server/.env` based on this template:

```env
MONGODB_URI=mongodb://localhost:27017/tichsy
PORT=8000
CORS_ORIGIN=http://localhost:3000
NODE_ENV=development

GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

APP_LOGO_URL=https://your-cdn/logo.png
FRONTEND_URL=http://localhost:3000

COOKIE_DOMAIN=localhost
ACCESS_TOKEN_EXPIRY=1
ACCESS_TOKEN_SECRET=your_access_token_secret
REFRESH_TOKEN_EXPIRY=30
REFRESH_TOKEN_SECRET=your_refresh_token_secret
JWT_SECRET_KEY=your_jwt_secret

CLOUDINARY_URL=cloudinary://api_key:api_secret@cloud_name
CLOUDINARY_MAIN_FOLDER_NAME=tichsy

RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
RAZORPAY_WEBHOOK_SECRET=your_razorpay_webhook_secret

RESEND_API_KEY=your_resend_api_key
```
> **Notes:** `CORS_ORIGIN` accepts comma-separated lists. Token expiry settings accept values in Days.

## 🚀 Run Locally

From repository root (recommended):
```bash
npx turbo run dev --filter=@repo/server
```

Or from this workspace:
```bash
npm run dev
```
> Default server URL is **`http://localhost:8000`**

## 📜 Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | TypeScript watch build + nodemon on compiled output |
| `npm run build` | Compiles `.ts` into `dist` |
| `npm run start` | Boots compiled output from `dist` |
| `npm run lint` | ESLint rules check |
| `npm run check-types`| Pure TypeScript configuration check |

## 📚 Related Documentation
- [Monorepo Root](../../README.md)
- [Frontend App](../web/README.md)
- [Pricing Rules](../../packages/pricing/README.md)
