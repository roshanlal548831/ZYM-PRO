import { useGetMyWorkoutsQuery } from "../../api/gymApi.js";
import { EmptyState, ErrorState, LoadingState, PageHeading } from "../../../components/common/UI.jsx";
import { Dumbbell } from "lucide-react";
export function WorkoutsPage() {
  const {
    data = [],
    isLoading,
    isError,
    refetch
  } = useGetMyWorkoutsQuery();
  if (isLoading) return <LoadingState label="Loading workout plans" />;
  if (isError) return <ErrorState message="Workout plans could not be loaded." onRetry={refetch} />;
  return <div className="page-enter"><PageHeading eyebrow="Your training" title="Workout plans" detail="Plans assigned to your member account by the coaching team." />{data.length ? <div className="grid gap-4 lg:grid-cols-2">{data.map(workout => <article className="border border-neutral-200 bg-white p-5" key={workout._id}><div className="flex items-start justify-between gap-3"><div><h2 className="text-2xl font-semibold">{workout.title}</h2><p className="mt-1 text-xs font-bold uppercase tracking-wider text-neutral-500">{workout.difficulty}</p></div><Dumbbell className="text-neutral-400" /></div>{workout.description && <p className="mt-3 text-sm leading-6 text-neutral-600">{workout.description}</p>}<div className="mt-5 divide-y divide-neutral-200">{workout.exercises?.map((exercise, index) => <div key={`${exercise.name}-${index}`} className="flex flex-wrap items-center justify-between gap-3 py-3"><div><p className="font-semibold">{exercise.name}</p><p className="mt-1 text-xs text-neutral-500">{exercise.sets} sets Â· {exercise.reps} reps Â· {exercise.restSeconds}s rest</p></div>{exercise.videoUrl && <a className="text-xs font-bold underline decoration-lime-500 underline-offset-4" href={exercise.videoUrl} target="_blank" rel="noreferrer">Video â†—</a>}</div>)}</div></article>)}</div> : <EmptyState title="No workout plans assigned" detail="Your coach's workout plans will appear here once assigned." />}</div>;
}

