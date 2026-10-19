import { useGetMyMembershipsQuery, useRenewMembershipMutation } from "../../api/gymApi.js";
import { useState } from "react";
import { toast } from "sonner";
import { formatDate, formatINR, getErrorMessage } from "../../../utils/errorUtils.js";
import { Button, EmptyState, ErrorState, LoadingState, PageHeading, StatusBadge } from "../../../components/common/UI.jsx";
import { Link } from "react-router-dom";
export function MembershipsPage() {
  const {
    data = [],
    isLoading,
    isError,
    refetch
  } = useGetMyMembershipsQuery();
  const [renew, {
    isLoading: isRenewing
  }] = useRenewMembershipMutation();
  const [activeId, setActiveId] = useState('');
  async function renewMembership(id) {
    setActiveId(id);
    try {
      const response = await renew(id).unwrap();
      toast.success(response.message || 'Renewal request submitted.');
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setActiveId('');
    }
  }
  if (isLoading) return <LoadingState label="Loading memberships" />;
  if (isError) return <ErrorState message="Membership history could not be loaded." onRetry={refetch} />;
  return <div className="page-enter"><PageHeading eyebrow="Your training" title="Memberships" detail="Requests remain pending until payment is recorded at the gym." />{data.length ? <div className="grid gap-3">{data.map(item => <article key={item._id} className="border border-neutral-200 bg-white p-5"><div className="flex flex-wrap items-start justify-between gap-4"><div><h2 className="text-2xl font-semibold">{item.membershipPlan?.name || 'Membership'}</h2><p className="mt-1 text-sm text-neutral-600">{formatINR(item.amountDue)} Â· {item.membershipPlan?.durationDays || 'â€”'} days</p><p className="mt-3 text-xs text-neutral-500">{formatDate(item.startDate)} â€” {formatDate(item.endDate)}</p></div><div className="flex flex-wrap items-center gap-2"><StatusBadge value={item.status} /><StatusBadge value={item.paymentStatus} /></div></div><div className="mt-5 flex flex-wrap gap-3"><Link className="inline-flex min-h-11 items-center border border-neutral-300 px-4 text-sm font-bold hover:border-neutral-900" to={`/app/memberships/${item._id}`}>Details</Link>{(item.status === 'active' || item.status === 'expired') && item.paymentStatus === 'paid' && <Button variant="outline" disabled={isRenewing && activeId === item._id} onClick={() => renewMembership(item._id)}>{isRenewing && activeId === item._id ? 'Submitting...' : 'Request renewal'}</Button>}</div></article>)}</div> : <EmptyState title="No memberships yet" detail="Choose a plan to request your first membership." />}</div>;
}

