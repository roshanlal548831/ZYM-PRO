# Gym Backend Postman Test Plan

## Scope and safety

The collection contains 52 request items covering 50 distinct registered method/path pairs. Member and admin login/logout are separate items so each role can keep independent cookie variables. This is an inventory-derived collection; **no HTTP requests were sent while generating it**, and no live server/database/provider was confirmed.

The collection's pre-request script is safe by default:

- Only localhost hosts are allowed.
- Every request except the health check is skipped unless the active environment has `testDatabaseConfirmed=yes`.
- Email-producing requests (signup/resend/reset and payment-confirmation email) are skipped unless `emailSinkConfirmed=yes`.
- The phone OTP send request is always skipped because it calls the Meta WhatsApp API. Phone-based forgot-password is skipped too.
- Payment write/confirm/refund requests are skipped unless `allowTestPaymentRecords=yes`.
- Requests requiring a role are skipped until that role has logged in and populated its cookie variables.

Do not turn on a gate until its condition below is true. The collection does not prove which database a running server has connected to; verify the process environment and startup configuration yourself.

## Dedicated local setup

The current `.env` points to `zym_gym`; **do not use that configuration for Collection Runner writes**. Start a separate server process pointed at a disposable database and a different port. In a new PowerShell terminal:

```powershell
Set-Location 'C:\Users\rosha\OneDrive\Desktop\zym\server'
$env:NODE_ENV = 'test'
$env:PORT = '4001'
$env:MONGODB_URI = 'mongodb://127.0.0.1:27017/zym_gym_postman_test'
$env:FRONTEND_ORIGINS = 'http://localhost:5173'
npm run dev
```

Check the startup output says port `4001`. The server connects using `MONGODB_URI`; `TEST_MONGODB_URI` is not read by `server.js`. Import the environment file and change `baseUrl` to `http://localhost:4001`. Only after verifying the process variables and disposable DB name, set `testDatabaseConfirmed` to `yes` in the selected Postman environment. Do not point the collection at a shared, staging, or production database.

Create a test admin against that same test database in a second PowerShell terminal, supplying credentials locally (do not put them in chat or commit them):

```powershell
Set-Location 'C:\Users\rosha\OneDrive\Desktop\zym\server'
$env:NODE_ENV = 'test'
$env:MONGODB_URI = 'mongodb://127.0.0.1:27017/zym_gym_postman_test'
$env:ADMIN_NAME = 'Postman Test Admin'
$env:ADMIN_EMAIL = 'your-test-admin@example.test'
$env:ADMIN_PASSWORD = 'use-a-unique-test-password-at-least-12-characters'
npm run create-admin
```

Populate the environment's `adminEmail` and `adminPassword` with those test-only values. Create a separate test member account. For signup/reset email checks, configure the server to use a **local SMTP capture service** with test credentials, not a real mailbox/provider; this service requires `EMAIL_HOST`, `EMAIL_USER`, `EMAIL_PASS`, and `EMAIL_FROM` to be set. Set `emailSinkConfirmed=yes` only after confirming delivery is captured locally. Use the captured OTP as `emailOtp` or `resetOtp`; do not guess codes. OTPs expire after 10 minutes and resend calls have a 60-second cooldown.

Do not configure production Meta credentials for these tests. WhatsApp send requests stay skipped. The payment endpoint is an offline record operation (it marks payment paid and issues a receipt), not a payment gateway; only enable its gate in the disposable DB with synthetic test data.

## Run order and test data

1. Import `gym-backend.postman_collection.json` and `gym-backend.postman_environment.json` into Postman; select **Gym Backend Local Test**. Confirm the server is the separate process on port 4001 and the DB is `zym_gym_postman_test`.
2. Run **Health Check** first. It expects HTTP 200 and the standard success envelope.
3. Create the test admin using the command above, then run **Admin Login**. Its test script captures the `accessToken` and `csrfToken` cookies into `adminAccessToken` and `adminCsrfToken`.
4. For a test member, configure the local SMTP sink and set `emailSinkConfirmed=yes`. Set `memberName`, `memberEmail` (a test-only address), `memberPassword`, and `testPhone`; run **Register Member** once. Read the OTP from the local capture inbox, set `emailOtp`, and run **Verify Email OTP**, then **Member Login**. The login script saves `memberAccessToken` and `memberCsrfToken`.
5. Run **Admin Create Membership Plan**, then **Member Request Membership**. The collection chains the created `planId` and `membershipId`. Before payment mutation requests, verify the database is still the disposable test DB, then set `allowTestPaymentRecords=yes`. Run **Admin Record Offline Payment** only with synthetic values; it records a paid payment and is not a live payment test. The returned payment ID is stored in `paymentId`.
6. **Admin Confirm Payment Again** expects HTTP 409 because recording the payment already confirms it. **Admin Refund Payment** is a separate state-changing test; use only disposable data. Refund history remains in the payment status history.
7. Requests with manually supplied IDs (for example `renewalSourceMembershipId` and `membershipStatusId`) require an existing eligible paid membership. Supply those IDs from the disposable test DB. Other IDs are captured after create responses. Run state-changing actions individually or in a planned sequence; deactivation, cancellation, logout, password reset, and refund change subsequent preconditions.
8. Run public reads and admin/member list/report requests after logging into the appropriate test role. Use `page`, `limit`, `fromDate`, and `toDate` for filters. Test invalid bodies manually only against the disposable DB and expect the standard error envelope.

The environment starts with gates disabled and credentials, tokens, OTPs, and IDs blank. Set values only in the local Postman environment. Never export or share an environment containing credentials, cookies, OTPs, or reset tokens.

## Endpoint inventory

All paths are mounted below `/api/v1`. `JSON` means `Content-Type: application/json`; cookie/CSRF rules are described in the Authentication section. Query parameters below are consumed by controllers; not all are Zod-validated.

| Method and path | Access | Body fields / query parameters |
|---|---|---|
| `GET /api/v1/health` | Public | No body/query |
| `POST /api/v1/auth/register` | Public; rate limited | JSON: `name`, `email`, `password`, optional `phone`; always creates member |
| `POST /api/v1/auth/verify-email-otp` | Public; OTP limited | JSON: `email`, six-digit `otp` |
| `POST /api/v1/auth/resend-otp` | Public; OTP limited | JSON: `email`, optional `purpose` (`signup` or `password-reset`) |
| `POST /api/v1/auth/resend-phone-otp` | Authenticated member/admin; OTP limited; CSRF | No body; sends WhatsApp OTP (collection skips it) |
| `POST /api/v1/auth/verify-phone-otp` | Authenticated member/admin; OTP limited; CSRF | JSON: six-digit `otp` |
| `POST /api/v1/auth/login` | Public; rate limited | JSON: `email`, `password`; sets access/CSRF cookies |
| `POST /api/v1/auth/logout` | Authenticated; CSRF | No body; revokes session |
| `GET /api/v1/auth/me` | Authenticated | No body/query |
| `POST /api/v1/auth/forgot-password` | Public; rate limited | JSON: `identifier` (email or verified phone); generic response |
| `POST /api/v1/auth/verify-reset-otp` | Public; OTP limited | JSON: `identifier`, six-digit `otp`; sets reset cookie |
| `POST /api/v1/auth/reset-password` | Reset cookie | JSON: `password` |
| `PATCH /api/v1/auth/change-password` | Authenticated; CSRF | JSON: `currentPassword`, `newPassword` |
| `GET /api/v1/users/me` | Authenticated member/admin | No body/query |
| `PATCH /api/v1/users/me` | Authenticated member/admin; CSRF | JSON: optional `name`, `phone`, `profileImage`; at least one |
| `GET /api/v1/membership-plans` | Public | No body/query |
| `POST /api/v1/membership-plans` | Admin; CSRF | JSON: `name`, `price`, `durationDays`; optional `description`, `features[]` |
| `PATCH /api/v1/membership-plans/:id` | Admin; CSRF | JSON: any non-empty subset of plan fields, including `isActive` |
| `DELETE /api/v1/membership-plans/:id` | Admin; CSRF | No body; deactivates plan |
| `POST /api/v1/memberships` | Member; CSRF | JSON: `planId` |
| `GET /api/v1/memberships/my` | Member | No body/query |
| `GET /api/v1/memberships` | Admin | Query: `page`, `limit`, `status`, `userId` |
| `PATCH /api/v1/memberships/:id/status` | Admin; CSRF | JSON: `status` (`cancelled` or `active`) |
| `POST /api/v1/memberships/:id/renew` | Member; CSRF | No body |
| `POST /api/v1/payments` | Admin; CSRF; collection gate | JSON: `memberId`, `membershipId`, numeric `amount`, `method` (`cash`/`upi`); optional `transactionReference`, `notes` |
| `GET /api/v1/payments/my` | Member | Query: `page`, `limit` |
| `GET /api/v1/payments` | Admin | Query: `page`, `limit`, `status`, `memberId` |
| `GET /api/v1/payments/:id` | Owning member or admin | No body/query |
| `PATCH /api/v1/payments/:id/confirm` | Admin; CSRF; collection gate | No body; duplicate confirmation expects 409 |
| `POST /api/v1/payments/:id/refund` | Admin; CSRF; collection gate | JSON: `reason` |
| `GET /api/v1/trainers` | Public | No body/query |
| `POST /api/v1/trainers` | Admin; CSRF | JSON: `name`, `specialization`, `experienceYears`; optional `bio`, `imageUrl`, `availability`, `isActive` |
| `PATCH /api/v1/trainers/:id` | Admin; CSRF | JSON: non-empty subset of trainer fields |
| `DELETE /api/v1/trainers/:id` | Admin; CSRF | No body; deactivates trainer |
| `POST /api/v1/enquiries` | Public; rate limited | JSON: `name`, `email`, `phone`, `message`; optional `enquiryType` (`general`/`trial`) |
| `GET /api/v1/enquiries` | Admin | Query: `page`, `limit`, `status` |
| `PATCH /api/v1/enquiries/:id` | Admin; CSRF | JSON: non-empty subset of `status`, `assignedTo` (trainer ID or null) |
| `GET /api/v1/workouts/my` | Member | No body/query |
| `POST /api/v1/workouts` | Admin; CSRF | JSON: `title`, `difficulty`, `exercises[]`; optional `description`, `assignedTo`, `isActive` |
| `PATCH /api/v1/workouts/:id` | Admin; CSRF | JSON: non-empty subset of workout fields |
| `DELETE /api/v1/workouts/:id` | Admin; CSRF | No body; deactivates workout |
| `GET /api/v1/admin/dashboard` | Admin | No body/query |
| `GET /api/v1/admin/members` | Admin | Query: `page`, `limit`, `isActive`, `search` |
| `PATCH /api/v1/admin/members/:id/status` | Admin; CSRF | JSON: boolean `isActive` |
| `GET /api/v1/admin/payments/summary` | Admin | Query: optional ISO date-time `from`, `to` |
| `GET /api/v1/admin/memberships/expiring` | Admin | Query: `page`, `limit` |
| `GET /api/v1/admin/enquiries` | Admin | Query: `page`, `limit`, `status` |
| `PATCH /api/v1/admin/enquiries/:id` | Admin; CSRF | JSON: non-empty subset of `status`, `assignedTo` |
| `GET /api/v1/admin/notifications` | Admin | Query: `page`, `limit`, `channel`, `status` |
| `GET /api/v1/notifications` | Admin | Query: `page`, `limit`, `channel`, `status` |

## Import and Collection Runner

1. In Postman, choose **Import** and import the collection JSON, environment JSON, and this plan for reference.
2. Select **Gym Backend Local Test** in the environment selector. Fill only test credentials and manually obtained OTPs.
3. Start the isolated server, confirm its `MONGODB_URI` and port, then set `testDatabaseConfirmed=yes`. Keep `emailSinkConfirmed=no` until a local capture SMTP service is configured. Keep `allowTestPaymentRecords=no` until ready to create synthetic records in the disposable database.
4. Select individual folders or requests in Collection Runner according to the run order above. Do not run the full collection blindly: endpoints intentionally depend on prior IDs, role sessions, OTPs, and status transitions.
5. The collection-level tests assert the expected status (including the intentional duplicate-confirmation 409) and the standard `{success,message,data}` or `{success,message,errors}` envelope. A skipped request is not a passed API test. Record actual failures and preserve response details without sharing secrets.
