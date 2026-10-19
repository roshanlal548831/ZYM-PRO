# Frontend Testing Checklist

Run `npm run lint` and `npm run build` from `client/` before manual testing. Keep the backend running with a test database and provider credentials configured where needed.

## Responsive and navigation

- [ ] Home, plans, trainers, about, contact, and trial request pages render at desktop, tablet, and 320px mobile widths.
- [ ] Mobile navigation opens, closes, and navigates with keyboard and touch.
- [ ] Public links, footer links, 404 route, and browser refresh on nested routes work.
- [ ] Check focus-visible states, form labels, keyboard operation, and reduced-motion behavior.

## API and authentication

- [ ] Configure `VITE_API_BASE_URL`; confirm public plan/trainer requests reach the backend.
- [ ] Confirm CORS allows the exact client origin and browser requests include cookies.
- [ ] Sign up with valid and invalid details; verify duplicate email and API validation messages.
- [ ] Verify email OTP with valid, invalid, expired, and resent codes; confirm cookie session restoration after reload.
- [ ] Sign in as a member and as an admin; verify intended-route redirects and role-aware route guards.
- [ ] Sign out; verify backend cookies and RTK Query cache are cleared only after success.
- [ ] Keep admin and member sessions open in separate browsers; submit enquiry, request membership, and record payment; verify the appropriate admin/member screens update without reload.
- [ ] Disconnect/reconnect the network and confirm socket reconnect refetches the role's active data; confirm admin polling recovers any missed update.
- [ ] Logout or change the account password in one session; confirm its socket closes and protected UI returns to login.
- [ ] Test forgot password, reset OTP, reset cookie, password reset, and sign-in with the new password.
- [ ] Test phone OTP only with a verified delivery provider and a profile phone number.
- [ ] Confirm state-changing requests include `X-CSRF-Token`; verify API errors for missing/invalid CSRF and unauthorized roles.

## Member workflows

- [ ] Update name/phone; try duplicate phone, invalid phone, and empty profile body.
- [ ] Upload/replace/remove a profile image with server Cloudinary credentials; check old image cleanup.
- [ ] Request an active membership plan; verify duplicate pending request errors and pending UI.
- [ ] Review membership dates/status and request renewal only for paid active/expired memberships.
- [ ] Review paginated payments, load an owned payment receipt, print receipt, and confirm unauthorized payment IDs are rejected.
- [ ] Load assigned workouts, exercise details, and optional video links.
- [ ] Change password and confirm the session is revoked; verify phone OTP UI state.

## Admin workflows

- [ ] Review dashboard totals and payment chart with real seeded backend data.
- [ ] Keep the admin dashboard open in one browser and submit a public enquiry in another; confirm the enquiry list and dashboard count update within about 7 seconds without reloading.
- [ ] Keep the admin membership list open and submit a member plan request in another session; confirm the pending request appears within about 7 seconds without reloading.
- [ ] Confirm polling pauses when the admin browser tab is unfocused and resumes when it becomes active.
- [ ] Search/filter/paginate members; disable and re-enable member access.
- [ ] Create, edit, and deactivate membership plans; confirm public plan cache refreshes.
- [ ] Review memberships; test cancelling and payment/date-gated activation.
- [ ] Record cash and UPI payments against pending memberships; confirm receipt and membership refresh.
- [ ] Confirm a pending payment where available; refund a paid payment with a valid reason; verify membership cancellation.
- [ ] Create/update trainer including image upload; deactivate trainer and verify image removal.
- [ ] Submit a public enquiry/trial request and update its status in admin.
- [ ] Create an unassigned and assigned workout; confirm it appears in the target member's plan list.
- [ ] Review expiring memberships, date-filtered payment reports, and masked notification logs.

## Known limitations

- The API does not expose trainer or workout admin list/detail reads, so existing inactive trainers and existing workout plans cannot be browsed or edited through this UI.
- Trial requests create enquiries only; no appointment time is booked by the backend.
- Real email/WhatsApp OTP delivery and live Cloudinary upload require external server credentials; automated API mocks do not validate those providers.
