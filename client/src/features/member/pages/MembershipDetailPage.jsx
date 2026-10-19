import { Link, useParams } from "react-router-dom";
import { useGetMyMembershipsQuery } from "../../api/gymApi.js";
import { EmptyState, ErrorState, LoadingState, PageHeading } from "../../../components/common/UI.jsx";
import { ArrowRight, CalendarDays, CreditCard, ShieldCheck } from "lucide-react";
import { formatDate } from "../../../utils/errorUtils.js";
function Stat({
  label,
  value,
  detail,
  icon: Icon
}) {
  return <article className="border border-neutral-200 bg-white p-5"><div className="flex items-center justify-between"><p className="text-xs font-bold uppercase tracking-wider text-neutral-500">{label}</p><Icon size={18} className="text-neutral-400" /></div><p className="mt-4 text-3xl font-bold">{value}</p>{detail && <p className="mt-1 text-xs text-neutral-500">{detail}</p>}</article>;
}
export function MembershipDetailPage() {
  const {
    id
  } = useParams();
  const {
    data = [],
    isLoading,
    isError,
    refetch
  } = useGetMyMembershipsQuery();
  const item = data.find(membership => membership._id === id);
  if (isLoading) return <LoadingState />;
  if (isError) return <ErrorState message="Membership details could not be loaded." onRetry={refetch} />;
  if (!item) return <EmptyState title="Membership not found" detail="This membership is not in your account history." />;
  return <div className="page-enter"><PageHeading eyebrow="Membership detail" title={item.membershipPlan?.name || 'Membership'} detail="This detail is from your own membership history." /><div className="grid gap-3 sm:grid-cols-2"><Stat label="Membership status" value={item.status} icon={ShieldCheck} /><Stat label="Payment status" value={item.paymentStatus} icon={CreditCard} /><Stat label="Starts" value={formatDate(item.startDate)} icon={CalendarDays} /><Stat label="Expires" value={formatDate(item.endDate)} icon={CalendarDays} /></div><Link className="mt-6 inline-flex items-center gap-2 text-sm font-bold underline decoration-lime-500 underline-offset-4" to="/app/memberships">Back to memberships <ArrowRight size={15} /></Link></div>;
}

