# Backend API audit

Base path: `/api/v1`

`Member` and `Admin` mean an authenticated session with that role. `Owner/Admin` means the payment owner or an administrator. Password-reset completion uses the short-lived reset cookie issued after OTP verification, not the normal access session.

## Registered endpoints

### Health

| Method | Path | Access |
|---|---|---|
| GET | `/health` | Public |

### Authentication

| Method | Path | Access |
|---|---|---|
| POST | `/auth/register` | Public |
| POST | `/auth/verify-email-otp` | Public |
| POST | `/auth/resend-otp` | Public |
| POST | `/auth/resend-phone-otp` | Authenticated |
| POST | `/auth/verify-phone-otp` | Authenticated |
| POST | `/auth/login` | Public |
| POST | `/auth/logout` | Authenticated |
| GET | `/auth/me` | Authenticated |
| POST | `/auth/forgot-password` | Public |
| POST | `/auth/verify-reset-otp` | Public |
| POST | `/auth/reset-password` | Reset cookie |
| PATCH | `/auth/change-password` | Authenticated |

### Users

| Method | Path | Access |
|---|---|---|
| GET | `/users/me` | Authenticated |
| PATCH | `/users/me` | Authenticated |

### Membership plans

| Method | Path | Access |
|---|---|---|
| GET | `/membership-plans` | Public |
| POST | `/membership-plans` | Admin |
| PATCH | `/membership-plans/:id` | Admin |
| DELETE | `/membership-plans/:id` | Admin |

### Memberships

| Method | Path | Access |
|---|---|---|
| POST | `/memberships` | Member |
| GET | `/memberships/my` | Member |
| GET | `/memberships` | Admin |
| PATCH | `/memberships/:id/status` | Admin |
| POST | `/memberships/:id/renew` | Member |

### Payments

| Method | Path | Access |
|---|---|---|
| POST | `/payments` | Admin |
| GET | `/payments/my` | Member |
| GET | `/payments` | Admin |
| GET | `/payments/:id` | Owner/Admin |
| PATCH | `/payments/:id/confirm` | Admin |
| POST | `/payments/:id/refund` | Admin |

### Trainers

| Method | Path | Access |
|---|---|---|
| GET | `/trainers` | Public |
| POST | `/trainers` | Admin |
| PATCH | `/trainers/:id` | Admin |
| DELETE | `/trainers/:id` | Admin |

### Enquiries

| Method | Path | Access |
|---|---|---|
| POST | `/enquiries` | Public |
| GET | `/enquiries` | Admin |
| PATCH | `/enquiries/:id` | Admin |

### Workouts

| Method | Path | Access |
|---|---|---|
| GET | `/workouts/my` | Member |
| POST | `/workouts` | Admin |
| PATCH | `/workouts/:id` | Admin |
| DELETE | `/workouts/:id` | Admin |

### Administration

| Method | Path | Access |
|---|---|---|
| GET | `/admin/dashboard` | Admin |
| GET | `/admin/members` | Admin |
| PATCH | `/admin/members/:id/status` | Admin |
| GET | `/admin/payments/summary` | Admin |
| GET | `/admin/memberships/expiring` | Admin |
| GET | `/admin/enquiries` | Admin |
| PATCH | `/admin/enquiries/:id` | Admin |
| GET | `/admin/notifications` | Admin |

### Notifications

| Method | Path | Access |
|---|---|---|
| GET | `/notifications` | Admin |

**Total: 50 registered endpoint/method pairs.**

## Wiring and safety review

- `src/app.js` mounts all ten route modules under `/api/v1`, followed by the JSON 404 and centralized error handlers.
- Route handlers connect to the matching controller/service and Mongoose model. Authentication, role checks, validation, CSRF protection, rate limits, and admin audit middleware are applied at the route or router level as listed above.
- Request validators use Zod; Mongoose provides persistence constraints and duplicate-key errors are translated to HTTP 409. JWT access cookies are checked against the current user, active/verified flags, and token version. Mutating cookie-authenticated requests require a matching CSRF header.
- Tests use Vitest, Supertest, and `MongoMemoryServer`; they connect to its ephemeral URI and clear only that in-memory DB between test cases. They do not connect to `MONGODB_URI` or `TEST_MONGODB_URI`.
- Test OTP generation and notification delivery are mocked. No actual email or WhatsApp is sent. Payment recording and refund tests only mutate the disposable MongoDB records; the payment service does not call a payment gateway.
- `src/middleware/auditAdminAction.js` now logs an audit-log persistence failure by error type without logging sensitive error details. The test suite simulates that failure and verifies the API's successful mutation response is unchanged.
- `.env.example` configuration names: `NODE_ENV`, `PORT`, `MONGODB_URI`, `FRONTEND_ORIGINS`, `JWT_SECRET`, `JWT_EXPIRES_IN`, `COOKIE_SECURE`, `COOKIE_SAME_SITE`, `OTP_PEPPER`, `OTP_TTL_MINUTES`, `OTP_RESEND_COOLDOWN_SECONDS`, `OTP_MAX_ATTEMPTS`, `OTP_MAX_RESENDS`, `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_USER`, `EMAIL_PASS`, `EMAIL_FROM`, `WHATSAPP_ACCESS_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`, `WHATSAPP_API_VERSION`, `WHATSAPP_TEMPLATE_NAME`, `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_VERIFY_SERVICE_SID`, `REMINDER_WINDOW_DAYS`, `JOB_TIMEZONE`, `ADMIN_NAME`, `ADMIN_EMAIL`, `ADMIN_PHONE`, `ADMIN_PASSWORD`, and `TEST_MONGODB_URI`. Configuration validation requires `JWT_SECRET` and `OTP_PEPPER`; other fields are optional or have defaults. Secret values are intentionally excluded from this report.

## Test command

From `server`, run:

```powershell
npm test
```

Use `npm test -- --reporter=verbose` to list individual test names. Tests run against an in-memory database and include safe GET/validation checks, authentication and role denials, resource-not-found cases, duplicate registration/pending membership cases, CRUD workflows, OTP/password flows, simulated payment/refund state changes, and audit-write failure handling.

Thunder Client was not executable through the available workspace tools; no Thunder Client request is claimed as run.
