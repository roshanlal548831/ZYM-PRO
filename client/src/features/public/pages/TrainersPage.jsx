import { useGetTrainersQuery } from "../../api/gymApi.js";
import { EmptyState, ErrorState, LoadingState, PageHeading } from "../../../components/common/UI.jsx";
import { Dumbbell } from "lucide-react";
export function TrainerCard({
  trainer
}) {
  return <article className="group border border-neutral-200 bg-white"><div className="aspect-[4/3] overflow-hidden bg-neutral-200">{trainer.imageUrl ? <img src={trainer.imageUrl} alt={`${trainer.name}, ${trainer.specialization} coach`} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" /> : <div className="grid h-full place-items-center bg-neutral-100"><Dumbbell className="text-neutral-400" size={34} /></div>}</div><div className="p-5"><p className="text-xs font-bold uppercase tracking-wider text-neutral-500">{trainer.experienceYears} years experience</p><h3 className="mt-2 text-2xl font-semibold">{trainer.name}</h3><p className="mt-1 text-sm font-medium text-neutral-600">{trainer.specialization}</p>{trainer.bio && <p className="mt-3 line-clamp-3 text-sm leading-6 text-neutral-600">{trainer.bio}</p>}</div></article>;
}
export function TrainersPage() {
  const {
    data: trainers = [],
    isLoading,
    isError,
    refetch
  } = useGetTrainersQuery();
  return <section className="page-enter mx-auto max-w-[1320px] px-5 py-12 md:px-8 md:py-16"><PageHeading eyebrow="The coaching team" title="Meet your coaches." detail="Our coaches are here to help you train with confidence and build lasting habits." />{isLoading ? <LoadingState label="Loading coaches" /> : isError ? <ErrorState message="Coach profiles could not be loaded." onRetry={refetch} /> : trainers.length ? <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{trainers.map(trainer => <TrainerCard key={trainer._id} trainer={trainer} />)}</div> : <EmptyState title="No coach profiles yet" detail="Please check back soon." />}</section>;
}

