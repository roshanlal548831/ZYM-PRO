import { lazy, Suspense } from 'react'
import { createBrowserRouter, createRoutesFromElements, Link, Route, RouterProvider } from 'react-router-dom'
import { Toaster } from 'sonner'
import { useGetCurrentUserQuery } from './features/auth/authApi.js'
import RealtimeSync from './features/api/RealtimeSync.jsx'
import PublicLayout from './components/layout/PublicLayout.jsx'
import WorkspaceLayout from './components/layout/WorkspaceLayout.jsx'
import { GuestRoute, ProtectedRoute } from './components/routing/RouteGuards.jsx'
import { Button, LoadingState } from './components/common/UI.jsx'

function lazyPage(loadModule, componentName) {
  return lazy(() => loadModule().then((module) => ({ default: module[componentName] })))
}

const HomePage = lazyPage(() => import('./features/public/pages/HomePage.jsx'), 'HomePage')
const AboutPage = lazyPage(() => import('./features/public/pages/AboutPage.jsx'), 'AboutPage')
const PlansPage = lazyPage(() => import('./features/public/pages/PlansPage.jsx'), 'PlansPage')
const TrainersPage = lazyPage(() => import('./features/public/pages/TrainersPage.jsx'), 'TrainersPage')
const ContactPage = lazyPage(() => import('./features/public/pages/ContactPage.jsx'), 'ContactPage')
const LoginPage = lazyPage(() => import('./features/auth/pages/LoginPage.jsx'), 'LoginPage')
const SignupPage = lazyPage(() => import('./features/auth/pages/SignupPage.jsx'), 'SignupPage')
const VerifyEmailPage = lazyPage(() => import('./features/auth/pages/VerifyEmailPage.jsx'), 'VerifyEmailPage')
const ResendOtpPage = lazyPage(() => import('./features/auth/pages/ResendOtpPage.jsx'), 'ResendOtpPage')
const ForgotPasswordPage = lazyPage(() => import('./features/auth/pages/ForgotPasswordPage.jsx'), 'ForgotPasswordPage')
const VerifyResetPage = lazyPage(() => import('./features/auth/pages/VerifyResetPage.jsx'), 'VerifyResetPage')
const ResetPasswordPage = lazyPage(() => import('./features/auth/pages/ResetPasswordPage.jsx'), 'ResetPasswordPage')
const MemberOverview = lazyPage(() => import('./features/member/pages/MemberOverview.jsx'), 'MemberOverview')
const MembershipDetailPage = lazyPage(() => import('./features/member/pages/MembershipDetailPage.jsx'), 'MembershipDetailPage')
const MembershipsPage = lazyPage(() => import('./features/member/pages/MembershipsPage.jsx'), 'MembershipsPage')
const PaymentDetailPage = lazyPage(() => import('./features/member/pages/PaymentDetailPage.jsx'), 'PaymentDetailPage')
const PaymentsPage = lazyPage(() => import('./features/member/pages/PaymentsPage.jsx'), 'PaymentsPage')
const ProfilePage = lazyPage(() => import('./features/member/pages/ProfilePage.jsx'), 'ProfilePage')
const SecurityPage = lazyPage(() => import('./features/member/pages/SecurityPage.jsx'), 'SecurityPage')
const WorkoutsPage = lazyPage(() => import('./features/member/pages/WorkoutsPage.jsx'), 'WorkoutsPage')
const AdminEnquiriesPage = lazyPage(() => import('./features/admin/enquiries/AdminEnquiriesPage.jsx'), 'AdminEnquiriesPage')
const AdminExpiringPage = lazyPage(() => import('./features/admin/reports/AdminExpiringPage.jsx'), 'AdminExpiringPage')
const AdminMembersPage = lazyPage(() => import('./features/admin/members/AdminMembersPage.jsx'), 'AdminMembersPage')
const AdminMembershipsPage = lazyPage(() => import('./features/admin/memberships/AdminMembershipsPage.jsx'), 'AdminMembershipsPage')
const AdminNotificationsPage = lazyPage(() => import('./features/admin/notifications/AdminNotificationsPage.jsx'), 'AdminNotificationsPage')
const AdminOverview = lazyPage(() => import('./features/admin/overview/AdminOverview.jsx'), 'AdminOverview')
const AdminPaymentsPage = lazyPage(() => import('./features/admin/payments/AdminPaymentsPage.jsx'), 'AdminPaymentsPage')
const AdminPlansPage = lazyPage(() => import('./features/admin/plans/AdminPlansPage.jsx'), 'AdminPlansPage')
const AdminProfilePage = lazyPage(() => import('./features/admin/profile/AdminProfilePage.jsx'), 'AdminProfilePage')
const AdminReportsPage = lazyPage(() => import('./features/admin/reports/AdminReportsPage.jsx'), 'AdminReportsPage')
const AdminTrainersPage = lazyPage(() => import('./features/admin/trainers/AdminTrainersPage.jsx'), 'AdminTrainersPage')
const AdminWorkoutsPage = lazyPage(() => import('./features/admin/workouts/AdminWorkoutsPage.jsx'), 'AdminWorkoutsPage')

function NotFoundPage() {
  return <section className="grid min-h-[65vh] place-items-center px-5 py-16 text-center"><div><p className="display-font text-8xl font-bold text-neutral-200">404</p><h1 className="mt-3 text-4xl font-bold uppercase">Page not found</h1><p className="mx-auto mt-3 max-w-md text-sm leading-6 text-neutral-600">That page is not part of this gym workspace.</p><Link to="/" className="mt-6 inline-block"><Button>Back to home</Button></Link></div></section>
}

function SessionBootstrap() {
  useGetCurrentUserQuery()
  return null
}

const router = createBrowserRouter(createRoutesFromElements(
  <>
    <Route element={<PublicLayout />}>
      <Route path="/" element={<HomePage />} />
      <Route path="/about" element={<AboutPage />} />
      <Route path="/plans" element={<PlansPage />} />
      <Route path="/trainers" element={<TrainersPage />} />
      <Route path="/contact" element={<ContactPage />} />
      <Route path="/book-trial" element={<ContactPage trial />} />
    </Route>

    <Route element={<GuestRoute />}>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route path="/verify-email" element={<VerifyEmailPage />} />
      <Route path="/resend-otp" element={<ResendOtpPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/verify-reset" element={<VerifyResetPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
    </Route>

    <Route element={<ProtectedRoute role="member" />}>
      <Route path="/app" element={<WorkspaceLayout />}>
        <Route index element={<MemberOverview />} />
        <Route path="profile" element={<ProfilePage />} />
        <Route path="memberships" element={<MembershipsPage />} />
        <Route path="memberships/:id" element={<MembershipDetailPage />} />
        <Route path="payments" element={<PaymentsPage />} />
        <Route path="payments/:id" element={<PaymentDetailPage />} />
        <Route path="workouts" element={<WorkoutsPage />} />
        <Route path="security" element={<SecurityPage />} />
      </Route>
    </Route>

    <Route element={<ProtectedRoute role="admin" />}>
      <Route path="/admin" element={<WorkspaceLayout admin />}>
        <Route index element={<AdminOverview />} />
        <Route path="members" element={<AdminMembersPage />} />
        <Route path="memberships" element={<AdminMembershipsPage />} />
        <Route path="plans" element={<AdminPlansPage />} />
        <Route path="payments" element={<AdminPaymentsPage />} />
        <Route path="payments/:id" element={<PaymentDetailPage />} />
        <Route path="trainers" element={<AdminTrainersPage />} />
        <Route path="enquiries" element={<AdminEnquiriesPage />} />
        <Route path="workouts" element={<AdminWorkoutsPage />} />
        <Route path="expiring" element={<AdminExpiringPage />} />
        <Route path="reports" element={<AdminReportsPage />} />
        <Route path="notifications" element={<AdminNotificationsPage />} />
        <Route path="profile" element={<AdminProfilePage />} />
      </Route>
    </Route>

    <Route path="*" element={<NotFoundPage />} />
  </>,
))

export default function App() {
  return <Suspense fallback={<LoadingState label="Loading page" />}><SessionBootstrap /><RealtimeSync /><RouterProvider router={router} /><Toaster position="top-right" richColors closeButton /></Suspense>
}


