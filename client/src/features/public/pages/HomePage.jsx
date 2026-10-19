import { useGetPlansQuery, useGetTrainersQuery, useRequestMembershipMutation } from "../../api/gymApi.js";
import { Link, useNavigate } from "react-router-dom";
import { ArrowDownRight, ArrowRight, ArrowUpRight, Check, Dumbbell, Star } from "lucide-react";
import { Button, EmptyState, ErrorState, LoadingState } from "../../../components/common/UI.jsx";
import { useSelector } from "react-redux";
import { toast } from "sonner";
import { formatINR, getErrorMessage } from "../../../utils/errorUtils.js";
const heroImage = 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=1900&q=85';
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
export function TrainerCard({
  trainer
}) {
  return <article className="group border border-neutral-200 bg-white"><div className="aspect-[4/3] overflow-hidden bg-neutral-200">{trainer.imageUrl ? <img src={trainer.imageUrl} alt={`${trainer.name}, ${trainer.specialization} coach`} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" /> : <div className="grid h-full place-items-center bg-neutral-100"><Dumbbell className="text-neutral-400" size={34} /></div>}</div><div className="p-5"><p className="text-xs font-bold uppercase tracking-wider text-neutral-500">{trainer.experienceYears} years experience</p><h3 className="mt-2 text-2xl font-semibold">{trainer.name}</h3><p className="mt-1 text-sm font-medium text-neutral-600">{trainer.specialization}</p>{trainer.bio && <p className="mt-3 line-clamp-3 text-sm leading-6 text-neutral-600">{trainer.bio}</p>}</div></article>;
}
export function HomePage() {
  const {
    data: plans = [],
    isLoading: plansLoading,
    isError: plansError,
    refetch: refetchPlans
  } = useGetPlansQuery();
  const {
    data: trainers = [],
    isError: trainersError,
    refetch: refetchTrainers
  } = useGetTrainersQuery();
  return <div className="page-enter">
    <section className="relative min-h-[650px] overflow-hidden bg-neutral-950 text-white md:min-h-[730px]">
      <img className="absolute inset-0 h-full w-full object-cover opacity-55" src={heroImage} alt="Athlete training in a modern gym" />
      <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/55 to-black/15" />
      <div className="relative mx-auto flex min-h-[650px] max-w-[1320px] items-center px-5 py-20 md:min-h-[730px] md:px-8">
        <div className="max-w-3xl"><p className="mb-5 flex items-center gap-2 text-xs font-bold uppercase tracking-[.18em] text-lime-300"><span className="size-2 bg-lime-300" />Train with intention</p><h1 className="display-font text-6xl font-bold uppercase leading-[.98] sm:text-7xl md:text-[100px]">Build a body<br />that <span className="text-lime-300">shows up.</span></h1><p className="mt-7 max-w-lg text-base leading-7 text-neutral-200 md:text-lg">A focused space, sharp coaching, and a training plan that fits your real life. Start where you are. Get stronger from here.</p><div className="mt-9 flex flex-wrap gap-3"><Link to="/plans" className="inline-flex min-h-12 items-center gap-3 bg-lime-300 px-5 font-bold text-neutral-950 transition hover:bg-lime-200">Explore memberships <ArrowUpRight size={18} /></Link><Link to="/book-trial" className="inline-flex min-h-12 items-center gap-3 border border-white/60 px-5 font-bold text-white transition hover:bg-white hover:text-black">Book a free trial <ArrowRight size={17} /></Link></div></div>
        <div className="absolute bottom-7 right-8 hidden items-center gap-3 text-xs font-semibold uppercase tracking-widest text-white/70 md:flex"><span>Scroll to explore</span><ArrowDownRight size={16} /></div>
      </div>
      <div className="absolute bottom-0 right-0 hidden w-[38%] border-l border-t border-white/20 bg-neutral-950/75 p-7 backdrop-blur-sm lg:block"><p className="text-xs font-bold uppercase tracking-widest text-lime-300">Your next chapter</p><p className="mt-2 text-xl font-semibold">No perfect starting point required.</p></div>
    </section>

    <section className="mx-auto grid max-w-[1320px] gap-10 px-5 py-20 md:grid-cols-[.8fr_1.2fr] md:px-8 md:py-28">
      <div><p className="text-xs font-bold uppercase tracking-[.14em] text-neutral-500">The Zym approach</p><h2 className="mt-4 text-5xl font-semibold uppercase leading-[1.03] md:text-6xl">Train for<br />the long run.</h2></div>
      <div className="grid gap-8 sm:grid-cols-2"><article className="border-t-2 border-neutral-950 pt-5"><Dumbbell className="mb-6" size={23} /><h3 className="text-xl font-semibold">Coaching that listens</h3><p className="mt-2 text-sm leading-6 text-neutral-600">Meet you at your level, build a plan around your goals, and help you stay consistent.</p></article><article className="border-t-2 border-neutral-950 pt-5"><Star className="mb-6" size={23} /><h3 className="text-xl font-semibold">A better kind of strong</h3><p className="mt-2 text-sm leading-6 text-neutral-600">Practical strength, thoughtful movement, and progress you can carry beyond the gym.</p></article></div>
    </section>

    <section className="border-y border-neutral-200 bg-neutral-50 py-16 md:py-20"><div className="mx-auto max-w-[1320px] px-5 md:px-8"><div className="mb-8 flex flex-wrap items-end justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[.14em] text-neutral-500">Inside the training space</p><h2 className="mt-2 text-4xl font-semibold uppercase md:text-5xl">Room to get stronger.</h2></div><p className="max-w-md text-sm leading-6 text-neutral-600">Purposeful equipment, open floor space, and a place to focus on the work in front of you.</p></div><div className="grid gap-3 md:grid-cols-[1.2fr_.8fr]"><figure className="relative min-h-[300px] overflow-hidden bg-neutral-200 md:min-h-[420px]"><img className="absolute inset-0 h-full w-full object-cover" src="https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=1200&q=80" alt="Strength training equipment on a gym floor" /><figcaption className="absolute bottom-0 left-0 bg-white px-4 py-3 text-sm font-bold">Strength floor</figcaption></figure><div className="grid gap-3 sm:grid-cols-2 md:grid-cols-1"><figure className="relative min-h-[190px] overflow-hidden bg-neutral-200 md:min-h-0"><img className="absolute inset-0 h-full w-full object-cover" src="https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=800&q=80" alt="Open space for mobility and movement practice" /><figcaption className="absolute bottom-0 left-0 bg-white px-4 py-3 text-sm font-bold">Movement space</figcaption></figure><figure className="relative min-h-[190px] overflow-hidden bg-neutral-200 md:min-h-0"><img className="absolute inset-0 h-full w-full object-cover" src="https://images.unsplash.com/photo-1576678927484-cc907957088c?auto=format&fit=crop&w=800&q=80" alt="Close view of training equipment" /><figcaption className="absolute bottom-0 left-0 bg-white px-4 py-3 text-sm font-bold">Tools for every level</figcaption></figure></div></div></div></section>

    <section className="bg-neutral-100 py-20 md:py-24"><div className="mx-auto max-w-[1320px] px-5 md:px-8"><div className="mb-9 flex flex-wrap items-end justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[.14em] text-neutral-500">Find your rhythm</p><h2 className="mt-2 text-4xl font-semibold uppercase md:text-5xl">Memberships</h2></div><Link className="inline-flex items-center gap-2 text-sm font-bold underline decoration-lime-500 underline-offset-4" to="/plans">All memberships <ArrowUpRight size={16} /></Link></div>{plansLoading ? <LoadingState label="Loading membership plans" /> : plansError ? <ErrorState message="Membership plans could not be loaded." onRetry={refetchPlans} /> : plans.length ? <div className="grid gap-4 md:grid-cols-3">{plans.slice(0, 3).map((plan, index) => <PlanCard key={plan._id} plan={plan} featured={index === 1} />)}</div> : <EmptyState title="Plans are being updated" detail="Please check back soon or contact the gym for membership details." />}</div></section>

    <section className="mx-auto max-w-[1320px] px-5 py-20 md:px-8 md:py-24"><div className="mb-9 flex flex-wrap items-end justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[.14em] text-neutral-500">Good people, good work</p><h2 className="mt-2 text-4xl font-semibold uppercase md:text-5xl">Meet your coaches</h2></div><Link className="inline-flex items-center gap-2 text-sm font-bold underline decoration-lime-500 underline-offset-4" to="/trainers">Meet the team <ArrowUpRight size={16} /></Link></div>{trainersError ? <ErrorState message="Coach profiles could not be loaded." onRetry={refetchTrainers} /> : trainers.length ? <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{trainers.slice(0, 3).map(trainer => <TrainerCard key={trainer._id} trainer={trainer} />)}</div> : <EmptyState title="Coach profiles coming soon" detail="Our coaching team is getting their profiles ready." />}</section>

    <section className="bg-neutral-950 text-white"><div className="mx-auto max-w-[1320px] px-5 py-16 md:px-8 md:py-20"><p className="text-xs font-bold uppercase tracking-[.14em] text-lime-300">Member stories Â· sample quotes</p><div className="mt-8 grid gap-8 md:grid-cols-3"><blockquote className="border-t border-white/25 pt-5"><p className="display-font text-2xl leading-snug">â€œI finally found a routine that feels like mine.â€</p><footer className="mt-5 text-xs font-semibold uppercase tracking-wider text-neutral-400">Sample member Â· strength training</footer></blockquote><blockquote className="border-t border-white/25 pt-5"><p className="display-font text-2xl leading-snug">â€œThe coaching made the first step feel simple.â€</p><footer className="mt-5 text-xs font-semibold uppercase tracking-wider text-neutral-400">Sample member Â· new to training</footer></blockquote><blockquote className="border-t border-white/25 pt-5"><p className="display-font text-2xl leading-snug">â€œI feel stronger in the gym and outside it.â€</p><footer className="mt-5 text-xs font-semibold uppercase tracking-wider text-neutral-400">Sample member Â· consistent since day one</footer></blockquote></div></div></section>

    <section className="bg-lime-300"><div className="mx-auto flex max-w-[1320px] flex-wrap items-center justify-between gap-8 px-5 py-12 md:px-8 md:py-16"><div><p className="text-xs font-bold uppercase tracking-widest">Start with a conversation</p><h2 className="mt-2 max-w-2xl text-4xl font-bold uppercase leading-tight md:text-5xl">One good session can change your week.</h2></div><Link to="/book-trial" className="inline-flex min-h-12 items-center gap-3 bg-neutral-950 px-5 font-bold text-white hover:bg-neutral-700">Book a free trial <ArrowUpRight size={18} /></Link></div></section>
    <section className="mx-auto grid max-w-[1320px] gap-8 px-5 py-16 md:grid-cols-3 md:px-8"><div><p className="text-xs font-bold uppercase tracking-widest text-neutral-500">Find us</p><p className="mt-3 text-lg font-semibold">Your neighborhood gym</p><p className="mt-1 text-sm text-neutral-600">Address details to be added</p></div><div><p className="text-xs font-bold uppercase tracking-widest text-neutral-500">Opening hours</p><p className="mt-3 text-sm leading-6 text-neutral-700">Monday-Saturday: 6:00 AM-10:00 PM<br />Sunday: 7:00 AM-2:00 PM</p></div><div><p className="text-xs font-bold uppercase tracking-widest text-neutral-500">Say hello</p><a className="mt-3 inline-block text-sm font-semibold underline decoration-lime-500 underline-offset-4" href="mailto:hello@zym.fit">hello@zym.fit</a></div></section>
  </div>;
}

