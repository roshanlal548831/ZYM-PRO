# Frontend API Mapping

All requests use `VITE_API_BASE_URL`, `credentials: include`, and the backend's `{ success, message, data }` envelope. RTK Query transforms responses to the values consumed by pages. Unsafe requests attach the readable `csrfToken` cookie as `X-CSRF-Token`. The server allows the configured `FRONTEND_ORIGINS` origin.

Realtime updates use Socket.IO on the same backend origin. The handshake reuses the HttpOnly `accessToken` cookie and validates the current user/token version. The server emits only RTK Query tag names: public catalog tags to all clients, operations tags to admins, and account tags to the target member. The client refetches active cached queries; REST response formats remain unchanged. Admin polling remains enabled as a reconnect/recovery fallback.

## Public and Auth

| UI | Endpoint | Contract / behavior |
| --- | --- | --- |
| Health check | `GET /health` | `{ data: { status, timestamp } }`; available from the API, no status page is currently exposed. |
| Sign up | `POST /auth/register` | `{ name, email, phone?, password }`; creates a member and sends email OTP; phone uses international format. |
| Verify signup | `POST /auth/verify-email-otp` | `{ email, otp }`; sets access and CSRF cookies and returns `{ data: { user } }`. |
| Resend OTP | `POST /auth/resend-otp` | `{ email, purpose: signup | password-reset }`; generic success response. |
| Login | `POST /auth/login` | `{ email, password }`; sets HttpOnly access cookie and readable CSRF cookie; returns identity and role. |
| Logout | `POST /auth/logout` | Auth cookie + CSRF; increments token version and clears auth cookies. |
| Session | `GET /auth/me` | Auth cookie; returns `data.user`, including role. |
| Forgot password | `POST /auth/forgot-password` | `{ identifier }` email or verified international phone; deliberately generic response. |
| Verify reset OTP | `POST /auth/verify-reset-otp` | `{ identifier, otp }`; sets short-lived HttpOnly `resetToken` cookie. |
| Reset password | `POST /auth/reset-password` | `{ password }` + reset cookie; 8-128 characters, clears auth/reset cookies. |
| Change password | `PATCH /auth/change-password` | `{ currentPassword, newPassword }` + auth cookie and CSRF; revokes active sessions. |
| Phone OTP | `POST /auth/resend-phone-otp`, `POST /auth/verify-phone-otp` | Auth cookie; verify body `{ otp }`; phone must already be on profile. |

## Public Data and Member

| UI | Endpoint | Contract / behavior |
| --- | --- | --- |
| Membership plans | `GET /membership-plans` | Public active plans in `data.items`; plan fields include name, description, price, durationDays, features. |
| Membership request | `POST /memberships` | Member + CSRF; `{ planId }`; creates pending request, one pending request per member. |
| Membership history | `GET /memberships/my` | Member; `data.items` with populated `membershipPlan`. |
| Renewal | `POST /memberships/:id/renew` | Member + CSRF; empty body; only paid active/expired memberships can renew. |
| Profile | `GET /users/me`, `PATCH /users/me` | Member/admin; PATCH permits `name`, `phone`, `profileImage`; image upload also accepts multipart `image` (JPEG/PNG/WebP/GIF, max 5 MB). |
| Payment history | `GET /payments/my?page=&limit=` | Member; paginated `data.items` and `data.pagination`. |
| Payment detail/receipt | `GET /payments/:id` | Member owner or admin; `data.payment`; receipt number is present only when issued. |
| Assigned workouts | `GET /workouts/my` | Member; `data.items` with exercises. |
| Trainers | `GET /trainers` | Public active trainers only in `data.items`; fields include imageUrl, name, specialization, experienceYears, bio. |
| Contact/trial enquiry | `POST /enquiries` | Public; `{ name, email, phone, message, enquiryType: general | trial }`; both contact and trial use this endpoint. |

## Admin

| UI | Endpoint | Contract / behavior |
| --- | --- | --- |
| Dashboard | `GET /admin/dashboard` | Counts plus grouped `confirmedPayments`, pending payments and new enquiries. |
| Member list | `GET /admin/members?page=&limit=&search=&isActive=` | Paginated members; search matches name/email. |
| Member access | `PATCH /admin/members/:id/status` | `{ isActive: boolean }`; changing status revokes tokens. |
| Membership list | `GET /memberships?page=&limit=&status=&userId=` | Paginated populated records. |
| Membership status | `PATCH /memberships/:id/status` | `{ status: active | cancelled }`; activation requires paid/effective dates. |
| Plan management | `POST /membership-plans`, `PATCH /membership-plans/:id`, `DELETE /membership-plans/:id` | Create/edit JSON; DELETE deactivates. Public GET returns active plans only. |
| Payment list | `GET /payments?page=&limit=&status=&memberId=` | Paginated; member, membership, recorder are populated. |
| Record offline payment | `POST /payments` | `{ memberId, membershipId, amount, method: cash | upi, transactionReference?, notes? }`; backend records and confirms in one operation. |
| Confirm pending payment | `PATCH /payments/:id/confirm` | Admin + CSRF; empty body. |
| Refund | `POST /payments/:id/refund` | `{ reason }`; refunds original payment and cancels associated membership. |
| Trainer management | `POST /trainers`, `PATCH /trainers/:id`, `DELETE /trainers/:id` | Admin; multipart `image` supported for create/update; DELETE deactivates and removes image. |
| Enquiries | `GET /admin/enquiries`, `PATCH /admin/enquiries/:id` | Admin; list is paginated; PATCH accepts `status` and/or `assignedTo`. The correct mount is `/admin/enquiries`. |
| Create/assign workout | `POST /workouts` | Admin; title, difficulty, exercises, optional assignedTo. |
| Update/deactivate workout | `PATCH /workouts/:id`, `DELETE /workouts/:id` | Admin; these mutations exist. |
| Expiring memberships | `GET /admin/memberships/expiring?page=&limit=` | Paginated populated memberships in the configured reminder window. |
| Payment report | `GET /admin/payments/summary?from=&to=` | `{ data: { items } }` grouped by currency/status, using ISO date-time filters. |
| Notifications | `GET /admin/notifications?page=&limit=&channel=&status=` | Paginated provider logs; recipient is masked in backend serialization. |

## Backend Gaps / Constraints

- There is no trainer detail endpoint; trainer cards use the public list response only.
- There is no admin trainer list/detail endpoint. `GET /trainers` returns active records only, so the frontend can edit/deactivate listed active trainers but cannot restore or inspect inactive trainers.
- There is no admin workout list/detail endpoint. The UI can create/assign a workout but cannot browse, edit, or deactivate existing records without their IDs from another source.
- There is no member detail endpoint. The admin UI uses the supported member list and status endpoint only.
- Trial enquiries are requests to contact the visitor; the API does not book a date/time slot or confirm an appointment.
- There is no member-initiated payment endpoint. Members cannot submit or confirm payments; an admin records offline payment.
- The payments endpoint responds that new records are already confirmed. The separate confirm endpoint remains available for eligible pending records.
- Signup requires configured email delivery; phone OTP and phone password reset require configured Twilio Verify SMS delivery. Browser flows can only be completed when those backend providers deliver codes.
