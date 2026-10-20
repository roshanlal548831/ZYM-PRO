# Zym Gym Management API

Production-oriented Express 5 and MongoDB backend using Node.js ES modules. Requires Node.js 20 or newer and MongoDB 6.0 or newer.

## Install and run

```powershell
cd server
npm install
Copy-Item .env.example .env
# Edit .env and set random JWT_SECRET and OTP_PEPPER values.
npm run dev
```

The API listens on `http://localhost:4000` by default. `GET /api/v1/health` reports service health. Start MongoDB locally or set `MONGODB_URI` to your deployment URI before starting the API.

## Configuration

Copy `.env.example` to `.env`. At minimum set `MONGODB_URI`, a 32-character random `JWT_SECRET`, and a separate `OTP_PEPPER` of at least 16 characters. Set `FRONTEND_ORIGINS` to a comma-separated exact origin allowlist; for Render, include `https://zym-zwvi.onrender.com` in the backend service's environment variable. This allowlist is used by both HTTP and Socket.IO. Never commit `.env` or place provider credentials in frontend configuration.

Email OTPs and email password reset require SMTP configuration (`EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_USER`, `EMAIL_PASS`, `EMAIL_FROM`). WhatsApp notifications use the official Meta Cloud API; configure `WHATSAPP_ACCESS_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`, `WHATSAPP_API_VERSION`, and approved `WHATSAPP_TEMPLATE_NAME` and `WHATSAPP_OTP_TEMPLATE_NAME`. The expiry reminder template must accept three text parameters: member name, plan name, and expiry date. The OTP template must accept one text parameter for the code. Phone reset is available only to members with a verified phone. Provider failures are recorded and do not roll back membership or payment changes.

Image uploads use Cloudinary. Set `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, and `CLOUDINARY_API_SECRET` in the server environment. Uploads accept one JPEG, PNG, WebP, or GIF file in multipart field `image`, up to 5 MB. Profile images upload to `zym/profiles`; trainer images upload to `zym/trainers`. Replacing or removing an image deletes the previous Cloudinary asset after the database update succeeds. Without Cloudinary credentials, upload requests return `503`; existing URL-based profile and trainer updates remain supported.

`JOB_TIMEZONE` defaults to `Asia/Kolkata`; the expiry job runs daily at 09:00 in that timezone. `REMINDER_WINDOW_DAYS` defaults to 7. Reminder log keys prevent repeat sends for the same membership, expiry date, and channel. Verify the configured timezone exists in the Node runtime's ICU timezone database.

For admin bootstrap, set `ADMIN_NAME`, `ADMIN_EMAIL`, `ADMIN_PASSWORD` (12+ characters), and optionally `ADMIN_PHONE`, then run `npm run create-admin`. The script refuses to overwrite an existing account. Remove bootstrap credentials from the environment after use.

## Authentication and security

Access JWTs are valid for 60 days by default, signed with `JWT_SECRET`, and stored in an HttpOnly `accessToken` cookie. There are no refresh tokens. Logout, password changes/resets, and admin disable actions increment `tokenVersion` to revoke existing JWTs. Cookies use `SameSite=Lax` by default and become `Secure` in production; cross-site deployments should use `SameSite=None`, HTTPS, and `COOKIE_SECURE=true`.

Unsafe authenticated requests must send `X-CSRF-Token` equal to the readable `csrfToken` cookie. The CSRF token is paired with exact-origin CORS checks. Browser clients should send credentials and the header on state-changing requests. Signup and reset OTPs are pepper-hashed, expire, and have attempt, resend, and cooldown limits. The API never returns OTPs, JWTs, password hashes, or reset secrets. Request logs skip auth paths and do not log request bodies or cookies.

Sensitive admin mutations write audit records. Public signup always creates a member. Members can only read their own memberships, payments, workouts, and account data. Plan prices, roles, membership state, and payment state are server-controlled.

## Membership and payment policy

Member membership requests start pending and use the active plan's database price. There can be only one pending membership request per member. A renewal starts on the day after the latest active paid term ends; payment confirmation for a future-dated renewal marks it paid but leaves it pending until the daily job activates it. Expired terms are marked expired. Admins record the actual offline cash or UPI payment; confirmation creates a receipt and activates a currently effective membership. Duplicate active payments are guarded with a unique membership key and conditional updates. Refunds update the original payment status and retain the status audit history; the associated membership is cancelled.

MongoDB replica sets or Atlas are recommended because they support multi-document transactions. On standalone MongoDB, the payment service falls back to conditional, idempotent writes and can recover a payment if membership state committed before payment state. For production, use a replica set and monitor failed notifications and interrupted operations. No card, bank credential, or UPI PIN data is accepted or stored.

## API routes

All routes use `/api/v1`. Success responses have `{ "success": true, "message": "...", "data": {} }`; errors have `{ "success": false, "message": "...", "errors": [] }`.

| Method | Path | Access | Purpose |
| --- | --- | --- | --- |
| GET | `/health` | Public | Health check |
| POST | `/auth/register` | Public | Create member and send email OTP |
| POST | `/auth/verify-email-otp` | Public | Verify signup code |
| POST | `/auth/resend-otp` | Public | Resend signup or reset code |
| POST | `/auth/resend-phone-otp` | Member/admin + CSRF | Send authenticated member phone-verification code |
| POST | `/auth/verify-phone-otp` | Member/admin + CSRF | Verify authenticated member phone |
| POST | `/auth/login` | Public | Sign in; sets auth and CSRF cookies |
| POST | `/auth/logout` | Member/admin + CSRF | Revoke current sessions |
| GET | `/auth/me` | Member/admin | Current authenticated identity |
| POST | `/auth/forgot-password` | Public | Request generic reset response using `{ "identifier": "email-or-phone" }` |
| POST | `/auth/verify-reset-otp` | Public | Verify reset code using identifier; sets short reset cookie |
| POST | `/auth/reset-password` | Reset cookie | Set new password and revoke sessions |
| PATCH | `/auth/change-password` | Member/admin + CSRF | Change password and revoke sessions |
| GET, PATCH | `/users/me` | Member/admin | Read or update permitted profile fields |
| GET | `/membership-plans` | Public | List active plans |
| POST, PATCH `/:id`, DELETE `/:id` | `/membership-plans` | Admin + CSRF | Create, update, deactivate plan |
| POST | `/memberships` | Member + CSRF | Request a plan with `{ "planId": "..." }` |
| GET | `/memberships/my` | Member | Own membership history |
| GET | `/memberships` | Admin | Paginated membership list |
| PATCH | `/memberships/:id/status` | Admin + CSRF | Cancel or activate an eligible membership |
| POST | `/memberships/:id/renew` | Member + CSRF | Request renewal |
| POST | `/payments` | Admin + CSRF | Record and confirm offline payment |
| GET | `/payments/my` | Member | Own payment history |
| GET | `/payments` | Admin | Filter by `status`, `memberId`; paginate with `page`, `limit` |
| GET | `/payments/:id` | Owner or admin | Read a payment |
| PATCH | `/payments/:id/confirm` | Admin + CSRF | Confirm a pending payment |
| POST | `/payments/:id/refund` | Admin + CSRF | Refund with `{ "reason": "..." }` |
| GET | `/trainers` | Public | Active trainer profiles |
| POST, PATCH `/:id`, DELETE `/:id` | `/trainers` | Admin + CSRF | Manage trainers |
| POST | `/enquiries` | Public | Create general/trial enquiry |
| GET, PATCH `/:id` | `/enquiries` | Admin | List and manage enquiries |
| GET | `/workouts/my` | Member | Own assigned workouts |
| POST, PATCH `/:id`, DELETE `/:id` | `/workouts` | Admin + CSRF | Create, update, or deactivate workout assignment |
| GET | `/admin/dashboard` | Admin | Dashboard counts and payment totals |
| GET | `/admin/members` | Admin | Search/filter/paginate members |
| PATCH | `/admin/members/:id/status` | Admin + CSRF | Enable/disable member |
| GET | `/admin/payments/summary` | Admin | Paid/refunded aggregates; optional ISO `from`, `to` |
| GET | `/admin/memberships/expiring` | Admin | Memberships expiring in reminder window |
| GET, PATCH `/:id` | `/admin/enquiries` | Admin | Enquiry management |
| GET | `/admin/notifications` or `/notifications` | Admin | Paginated, recipient-masked provider logs |

### Example requests

Upload a profile image (include the logged-in cookies and `X-CSRF-Token`):

```sh
curl -X PATCH http://localhost:4000/api/v1/users/me \
  -b cookies.txt -H 'X-CSRF-Token: <csrf-token>' \
  -F 'name=Asha Member' -F 'image=@profile.jpg'
```

Trainer create and update endpoints accept the same multipart `image` field. Set `imageUrl` to `null` in a JSON trainer update to remove the current trainer image; set `profileImage` to `null` in a JSON profile update to remove the current profile image.

Registration:

```http
POST /api/v1/auth/register
Content-Type: application/json

{"name":"Asha Member","email":"asha@example.com","phone":"+919876543210","password":"a-long-password"}
```

Admin records an offline payment after the member requests a membership:

```http
POST /api/v1/payments
Content-Type: application/json
X-CSRF-Token: <csrfToken-cookie-value>

{"memberId":"<user-id>","membershipId":"<membership-id>","amount":1500,"method":"upi","transactionReference":"UPI-REF-123"}
```

Example success response:

```json
{"success":true,"message":"Payment recorded and confirmed","data":{"payment":{"status":"paid","currency":"INR","amount":1500,"receiptNumber":"ZYM-..."}}}
```

## MongoDB and tests

The local default is `mongodb://127.0.0.1:27017/zym_gym`. MongoDB Atlas works by setting `MONGODB_URI` to the SRV connection string and allowing the server's network in Atlas. Use a replica set for transaction support; standalone MongoDB is supported by the documented fallback.

```powershell
npm test
npm start
```

Tests use `mongodb-memory-server`, requiring permission to download a MongoDB test binary on first run. The suite covers registration/OTP, login/logout, password reset and session revocation, validation, role authorization, resource ownership, payment confirmation/idempotency, and health/error responses. Provider calls are mocked in tests; configure SMTP and Meta credentials separately for a delivery smoke test.

## Project structure

```text
server/
  scripts/createAdmin.js
  src/
    app.js
    server.js
    config/       db.js, env.js, corsOptions.js
    models/       User, OTP, MembershipPlan, Membership, Payment, Trainer, Enquiry, WorkoutPlan, NotificationLog, AuditLog
    controllers/  auth, user, membership plans/memberships, payment, trainer, enquiry, workout, admin, notification
    routes/       auth, user, membership plans/memberships, payment, trainer, enquiry, workout, admin, notification
    middleware/   auth, authorization, validation, errors, rate limits, CSRF, audit logging
    services/     OTP, email, WhatsApp, membership, payment, notification
    validators/   auth, user, membership, payment, enquiry
    jobs/         membershipExpiryJob.js
    utils/        errors, async handling, OTP, receipts, pagination
  tests/api.test.js
  .env.example
```