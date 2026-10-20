import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import {
  useCreatePlanMutation,
  useDeactivatePlanMutation,
  useGetPlansQuery,
  useUpdatePlanMutation,
} from '../../api/gymApi.js'
import {
  Button,
  ConfirmDialog,
  EmptyState,
  ErrorState,
  Field,
  LoadingState,
  PageHeading,
} from '../../../components/common/UI.jsx'
import { formatINR, getErrorMessage } from '../../../utils/errorUtils.js'

const planSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(100),
  description: z.string().max(2000).optional().or(z.literal('')),
  price: z.coerce.number().positive('Price must be greater than 0').max(10000000),
  durationDays: z.coerce.number().int().positive('Duration must be positive').max(3650),
  features: z.string(),
})

export function AdminPlansPage() {
  const { data: plans = [], isLoading, isError, refetch } = useGetPlansQuery()
  const [editingId, setEditingId] = useState('')
  const [deactivatingPlan, setDeactivatingPlan] = useState(null)

  const [createPlan, { isLoading: isCreating }] = useCreatePlanMutation()
  const [updatePlan, { isLoading: isUpdating }] = useUpdatePlanMutation()
  const [deactivatePlan, { isLoading: isDeactivating }] = useDeactivatePlanMutation()

  const currentPlan = plans.find((p) => p._id === editingId)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(planSchema),
    defaultValues: {
      name: '',
      description: '',
      price: '',
      durationDays: '',
      features: '',
    },
  })

  function handleStartEdit(plan) {
    setEditingId(plan._id)
    reset({
      name: plan.name,
      description: plan.description || '',
      price: plan.price,
      durationDays: plan.durationDays,
      features: (plan.features || []).join('\n'),
    })
  }

  function handleCancelEdit() {
    setEditingId('')
    reset({
      name: '',
      description: '',
      price: '',
      durationDays: '',
      features: '',
    })
  }

  async function onSubmit(values) {
    const payload = {
      ...values,
      features: values.features
        .split('\n')
        .map((f) => f.trim())
        .filter(Boolean),
    }

    try {
      if (editingId) {
        await updatePlan({ id: editingId, ...payload }).unwrap()
        toast.success('Plan updated.')
      } else {
        await createPlan(payload).unwrap()
        toast.success('Plan created.')
      }
      handleCancelEdit()
      refetch()
    } catch (err) {
      toast.error(getErrorMessage(err))
    }
  }

  async function handleConfirmDeactivate() {
    if (!deactivatingPlan) return
    try {
      await deactivatePlan(deactivatingPlan._id).unwrap()
      toast.success('Plan deactivated.')
      setDeactivatingPlan(null)
      refetch()
    } catch (err) {
      toast.error(getErrorMessage(err))
    }
  }

  if (isLoading) return <LoadingState label="Loading plans" />
  if (isError) return <ErrorState message="Plan management is unavailable." onRetry={refetch} />

  return (
    <div className="page-enter">
      <PageHeading
        eyebrow="Plan management"
        title="Membership plans"
        detail="The public API lists active plans; deactivated plans are not returned by the backend."
      />

      <div className="grid gap-6 xl:grid-cols-[.85fr_1.15fr]">
        <form
          className="grid content-start gap-4 border border-neutral-200 bg-white p-5"
          onSubmit={handleSubmit(onSubmit)}
        >
          <h2 className="text-2xl font-semibold">{currentPlan ? 'Edit plan' : 'Create a plan'}</h2>
          <Field label="Plan name" error={errors.name?.message} {...register('name')} />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="Price (INR)"
              type="number"
              min="1"
              error={errors.price?.message}
              {...register('price')}
            />
            <Field
              label="Duration (days)"
              type="number"
              min="1"
              error={errors.durationDays?.message}
              {...register('durationDays')}
            />
          </div>
          <Field
            label="Description"
            as="textarea"
            rows={3}
            className="resize-y"
            error={errors.description?.message}
            {...register('description')}
          />
          <Field
            label="Features (one per line)"
            as="textarea"
            rows={5}
            className="resize-y"
            error={errors.features?.message}
            {...register('features')}
          />
          <div className="flex gap-2">
            <Button type="submit" disabled={isCreating || isUpdating}>
              {isCreating || isUpdating ? 'Saving...' : currentPlan ? 'Save changes' : 'Create plan'}
            </Button>
            {currentPlan && (
              <Button type="button" variant="outline" onClick={handleCancelEdit}>
                Cancel
              </Button>
            )}
          </div>
        </form>

        <section>
          <h2 className="mb-3 text-2xl font-semibold">Active plans</h2>
          {plans.length ? (
            <div className="grid gap-3">
              {plans.map((plan) => (
                <article
                  key={plan._id}
                  className="flex flex-wrap items-center justify-between gap-4 border border-neutral-200 bg-white p-5"
                >
                  <div>
                    <h3 className="text-xl font-semibold">{plan.name}</h3>
                    <p className="mt-1 text-sm text-neutral-600">
                      {formatINR(plan.price)} · {plan.durationDays} days
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => handleStartEdit(plan)}>
                      Edit
                    </Button>
                    <Button
                      variant="danger"
                      disabled={isDeactivating}
                      onClick={() => setDeactivatingPlan(plan)}
                    >
                      Deactivate
                    </Button>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <EmptyState title="No active plans" detail="Create a plan to make it available on the public site." />
          )}
        </section>
      </div>

      {deactivatingPlan && (
        <ConfirmDialog
          title={`Deactivate ${deactivatingPlan.name}?`}
          detail="The plan will no longer be listed publicly. Existing memberships remain unchanged."
          confirmLabel="Deactivate plan"
          onClose={() => setDeactivatingPlan(null)}
          onConfirm={handleConfirmDeactivate}
          pending={isDeactivating}
          danger
        />
      )}
    </div>
  )
}
