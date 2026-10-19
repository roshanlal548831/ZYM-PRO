import { useGetPlansQuery, useRequestMembershipMutation } from "../../api/gymApi.js";
import { Button, EmptyState, ErrorState, LoadingState, PageHeading } from "../../../components/common/UI.jsx";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { formatINR, getErrorMessage } from "../../../utils/errorUtils.js";
import { ArrowUpRight, Check } from "lucide-react";
export function PlanCard({
  plan,
  featured = false
}) {
  const user = useSelector(state => state.auth.user);
  const navigate = useNavigate();
  const [request, {
    isLoading
  }] = useRequestMembershipMutation();
  const features = Array.isArray(plan.features) ? plan.features : [];
  async function join() {
    if (!user) {
      navigate('/login', {
        state: {
          from: '/plans'
        }
      });
      return;
    }
    if (user.role !== 'member') {
      toast.error('Membership requests are for member accounts.');
      return;
    }
    try {
      const result = await request({
        planId: plan._id
      }).unwrap();
      toast.success(result.message || 'Membership request submitted. Payment is completed at the gym.');
      navigate('/app/memberships');
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }
  return <article className={`flex min-h-[330px] flex-col border p-6 ${featured ? 'border-neutral-950 bg-neutral-950 text-white' : 'border-neutral-200 bg-white'}`}>
    <div className="flex items-start justify-between gap-4"><h3 className="text-2xl font-semibold">{plan.name}</h3>{featured && <span className="bg-lime-300 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-neutral-950">Popular</span>}</div>
    <p className={`mt-4 text-4xl font-bold ${featured ? 'text-lime-300' : ''}`}>{formatINR(plan.price)}<span className={`ml-2 text-sm font-medium ${featured ? 'text-neutral-400' : 'text-neutral-500'}`}>/ {plan.durationDays} days</span></p>
    {plan.description && <p className={`mt-4 text-sm leading-6 ${featured ? 'text-neutral-300' : 'text-neutral-600'}`}>{plan.description}</p>}
    <ul className="mt-5 grid gap-2">{features.slice(0, 4).map(feature => <li key={feature} className={`flex items-center gap-2 text-sm ${featured ? 'text-neutral-200' : 'text-neutral-700'}`}><Check className="text-lime-600" size={16} />{feature}</li>)}</ul>
    <Button className="mt-auto w-full" variant={featured ? 'lime' : 'dark'} onClick={join} disabled={isLoading}>{isLoading ? 'Submitting...' : 'Request membership'} <ArrowUpRight size={16} /></Button>
  </article>;
}
export function PlansPage() {
  const {
    data: plans = [],
    isLoading,
    isError,
    refetch
  } = useGetPlansQuery();
  return <section className="page-enter mx-auto max-w-[1320px] px-5 py-12 md:px-8 md:py-16"><PageHeading eyebrow="Memberships" title="Choose your pace." detail="Membership requests are confirmed by the team. Payment is made offline at the gym." />{isLoading ? <LoadingState label="Loading active plans" /> : isError ? <ErrorState message="Membership plans could not be loaded." onRetry={refetch} /> : plans.length ? <div className="grid gap-4 md:grid-cols-3">{plans.map((plan, index) => <PlanCard key={plan._id} plan={plan} featured={index === 1} />)}</div> : <EmptyState title="No active plans" detail="There are no active membership plans right now." />}</section>;
}

