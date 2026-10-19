import { useGetMyMembershipsQuery, useGetMyPaymentsQuery, useGetMyWorkoutsQuery, useGetProfileQuery } from "../../api/gymApi.js";
import { EmptyState, ErrorState, LoadingState, PageHeading, StatusBadge } from "../../../components/common/UI.jsx";
import { formatDate, formatINR } from "../../../utils/errorUtils.js";
import { CalendarDays, CreditCard, Dumbbell, ShieldCheck } from "lucide-react";
import { Link } from "react-router-dom";
function Stat({
  label,
  value,
  detail,
  icon: Icon
}) {
  return <article className="border border-neutral-200 bg-white p-5"><div className="flex items-center justify-between"><p className="text-xs font-bold uppercase tracking-wider text-neutral-500">{label}</p><Icon size={18} className="text-neutral-400" /></div><p className="mt-4 text-3xl font-bold">{value}</p>{detail && <p className="mt-1 text-xs text-neutral-500">{detail}</p>}</article>;
}
export function MemberOverview() {
  const profile = useGetProfileQuery();
  const membershipsQuery = useGetMyMembershipsQuery();
  const paymentsQuery = useGetMyPaymentsQuery({
    page: 1,
    limit: 5
  });
  const workoutsQuery = useGetMyWorkoutsQuery();
  if (profile.isLoading || membershipsQuery.isLoading || paymentsQuery.isLoading || workoutsQuery.isLoading) return <LoadingState label="Loading your account" />;
  if (profile.isError && !profile.data) return <ErrorState message="Your account overview could not be loaded." onRetry={profile.refetch} />;
  if (!profile.data) return <ErrorState message="Your account profile is unavailable." onRetry={profile.refetch} />;
  const memberships = membershipsQuery.data || [];
  const active = memberships.find(item => item.status === 'active');
  const pending = memberships.find(item => item.status === 'pending');
  const payments = paymentsQuery.data?.items || [];
  const paidTotal = payments.filter(payment => payment.status === 'paid').reduce((total, payment) => total + payment.amount, 0);
  return <div className="page-enter"><PageHeading eyebrow="Member overview" title={`Good to see you, ${profile.data?.name?.split(' ')[0] || 'member'}.`} detail="A clear look at your training and membership." />
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"><Stat label="Membership" value={active ? 'Active' : pending ? 'Pending' : 'Not active'} detail={active ? `Until ${formatDate(active.endDate)}` : pending ? 'Waiting for gym payment' : 'Choose a plan to begin'} icon={CalendarDays} /><Stat label="Plan" value={active?.membershipPlan?.name || pending?.membershipPlan?.name || 'â€”'} detail="Current membership" icon={ShieldCheck} /><Stat label="Payments" value={formatINR(paidTotal)} detail="Recent confirmed payments" icon={CreditCard} /><Stat label="Workouts" value={workoutsQuery.data?.length ?? 0} detail="Assigned active plans" icon={Dumbbell} /></div>
    <div className="mt-8 grid gap-6 xl:grid-cols-[1.2fr_.8fr]"><section className="border border-neutral-200 bg-white p-5 md:p-6"><div className="flex items-center justify-between gap-4"><h2 className="text-2xl font-semibold">Membership activity</h2><Link className="text-sm font-bold underline decoration-lime-500 underline-offset-4" to="/app/memberships">View history</Link></div>{memberships.length ? <div className="mt-5 divide-y divide-neutral-200">{memberships.slice(0, 4).map(membership => <div key={membership._id} className="flex flex-wrap items-center justify-between gap-3 py-4"><div><p className="font-semibold">{membership.membershipPlan?.name || 'Membership'}</p><p className="mt-1 text-xs text-neutral-500">{formatDate(membership.startDate)} â€” {formatDate(membership.endDate)}</p></div><div className="flex items-center gap-2"><StatusBadge value={membership.status} /><StatusBadge value={membership.paymentStatus} /></div></div>)}</div> : <div className="mt-5"><EmptyState title="Your first membership starts here" detail="Browse the available plans and submit a request." /><Link to="/plans" className="mt-4 inline-block text-sm font-bold underline decoration-lime-500 underline-offset-4">Browse plans</Link></div>}</section>
      <section className="border border-neutral-200 bg-white p-5 md:p-6"><div className="flex items-center justify-between gap-4"><h2 className="text-2xl font-semibold">Latest payments</h2><Link className="text-sm font-bold underline decoration-lime-500 underline-offset-4" to="/app/payments">View all</Link></div>{payments.length ? <div className="mt-5 divide-y divide-neutral-200">{payments.slice(0, 4).map(payment => <div key={payment._id} className="flex items-center justify-between gap-3 py-4"><div><p className="font-semibold">{formatINR(payment.amount)}</p><p className="mt-1 text-xs text-neutral-500">{formatDate(payment.paidAt || payment.createdAt)}</p></div><StatusBadge value={payment.status} /></div>)}</div> : <div className="mt-5"><EmptyState title="No payment history" detail="Payments recorded by the gym will appear here." /></div>}</section></div>
  </div>;
}

