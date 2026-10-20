import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { useCreateWorkoutMutation, useGetAdminMembersQuery } from '../../api/gymApi.js'
import { Button, Field, PageHeading } from '../../../components/common/UI.jsx'
import { getErrorMessage } from '../../../utils/errorUtils.js'

const workoutSchema = z.object({
  title: z.string().trim().min(2, 'Title must be at least 2 characters').max(150),
  description: z.string().max(3000).optional().or(z.literal('')),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced']),
  assignedTo: z.string().optional().or(z.literal('')),
  exerciseName: z.string().trim().min(1, 'Exercise name is required').max(150),
  sets: z.coerce.number().int().positive('Sets must be at least 1'),
  reps: z.string().trim().min(1, 'Reps are required').max(50),
  restSeconds: z.coerce.number().int().nonnegative('Rest must be 0 or more'),
  videoUrl: z.string().url('Must be a valid URL').optional().or(z.literal('')),
})

export function AdminWorkoutsPage() {
  const { data: membersData } = useGetAdminMembersQuery({ page: 1, limit: 100 })
  const [createWorkout, { isLoading: isCreating }] = useCreateWorkoutMutation()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(workoutSchema),
    defaultValues: {
      title: '',
      description: '',
      difficulty: 'beginner',
      assignedTo: '',
      exerciseName: '',
      sets: 3,
      reps: '8-12',
      restSeconds: 60,
      videoUrl: '',
    },
  })

  async function onSubmit(values) {
    const { exerciseName, sets, reps, restSeconds, videoUrl, ...rest } = values
    const payload = {
      ...rest,
      assignedTo: rest.assignedTo || undefined,
      exercises: [
        {
          name: exerciseName,
          sets,
          reps,
          restSeconds,
          ...(videoUrl ? { videoUrl } : {}),
        },
      ],
    }

    try {
      const res = await createWorkout(payload).unwrap()
      toast.success(res.message || 'Workout plan created and assigned.')
      reset()
    } catch (err) {
      toast.error(getErrorMessage(err))
    }
  }

  const members = membersData?.items || []

  return (
    <div className="page-enter">
      <PageHeading
        eyebrow="Training programs"
        title="Create a workout"
        detail="The backend supports creating, updating, and deactivating workouts, but does not expose an admin list/read endpoint. This form creates one plan with one exercise; existing plans cannot be browsed here."
      />

      <div className="max-w-3xl border border-neutral-200 bg-white p-5 md:p-7">
        <form className="grid gap-4" onSubmit={handleSubmit(onSubmit)}>
          <Field label="Workout title" error={errors.title?.message} {...register('title')} />
          <Field
            label="Description"
            as="textarea"
            rows={3}
            className="resize-y"
            error={errors.description?.message}
            {...register('description')}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Difficulty" as="select" {...register('difficulty')}>
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </Field>

            <Field label="Assign to member (optional)" as="select" {...register('assignedTo')}>
              <option value="">Save unassigned</option>
              {members.map((m) => (
                <option key={m._id} value={m._id}>
                  {m.name} · {m.email}
                </option>
              ))}
            </Field>
          </div>

          <div className="border-t border-neutral-200 pt-4">
            <p className="mb-4 text-xs font-bold uppercase tracking-wider text-neutral-500">Exercise</p>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                label="Exercise name"
                error={errors.exerciseName?.message}
                {...register('exerciseName')}
              />
              <Field
                label="Video URL (optional)"
                type="url"
                error={errors.videoUrl?.message}
                {...register('videoUrl')}
              />
              <Field
                label="Sets"
                type="number"
                min="1"
                error={errors.sets?.message}
                {...register('sets')}
              />
              <Field label="Reps" error={errors.reps?.message} {...register('reps')} />
              <Field
                label="Rest (seconds)"
                type="number"
                min="0"
                error={errors.restSeconds?.message}
                {...register('restSeconds')}
              />
            </div>
          </div>

          <Button className="w-fit" type="submit" disabled={isCreating}>
            {isCreating ? 'Creating...' : 'Create workout plan'}
          </Button>
        </form>
      </div>
    </div>
  )
}
