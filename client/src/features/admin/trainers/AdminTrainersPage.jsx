import { useState } from 'react'
import { toast } from 'sonner'
import {
  useCreateTrainerMutation,
  useDeactivateTrainerMutation,
  useGetTrainersQuery,
  useUpdateTrainerMutation,
} from '../../api/gymApi.js'
import {
  Button,
  EmptyState,
  ErrorState,
  Field,
  LoadingState,
  PageHeading,
} from '../../../components/common/UI.jsx'
import { getErrorMessage } from '../../../utils/errorUtils.js'

export function AdminTrainersPage() {
  const { data: trainers = [], isLoading, isError, refetch } = useGetTrainersQuery()
  const [createTrainer, { isLoading: isCreating }] = useCreateTrainerMutation()
  const [updateTrainer, { isLoading: isUpdating }] = useUpdateTrainerMutation()
  const [deactivateTrainer, { isLoading: isDeactivating }] = useDeactivateTrainerMutation()
  const [editingId, setEditingId] = useState('')

  const currentTrainer = trainers.find((t) => t._id === editingId)

  async function handleSubmit(e) {
    e.preventDefault()
    const form = e.currentTarget
    const formData = new FormData(form)

    const file = formData.get('image')
    if (!file || !(file instanceof File) || file.size === 0) {
      formData.delete('image')
    }

    try {
      if (editingId) {
        await updateTrainer({ id: editingId, body: formData }).unwrap()
        toast.success('Trainer updated.')
      } else {
        await createTrainer(formData).unwrap()
        toast.success('Trainer added.')
      }
      setEditingId('')
      form.reset()
      refetch()
    } catch (err) {
      toast.error(getErrorMessage(err))
    }
  }

  async function handleDeactivate(id) {
    if (window.confirm('Deactivate this trainer and delete their stored profile photo?')) {
      try {
        await deactivateTrainer(id).unwrap()
        toast.success('Trainer deactivated and image removed.')
        refetch()
      } catch (err) {
        toast.error(getErrorMessage(err))
      }
    }
  }

  if (isLoading) return <LoadingState label="Loading trainers" />
  if (isError) return <ErrorState message="Trainer records could not be loaded." onRetry={refetch} />

  return (
    <div className="page-enter">
      <PageHeading
        eyebrow="Team management"
        title="Trainers"
        detail="This API lists active trainers only. Saving a replacement image removes the old Cloudinary image after the update succeeds."
      />

      <div className="grid gap-6 xl:grid-cols-[.8fr_1.2fr]">
        <form
          key={editingId || 'new'}
          className="grid content-start gap-4 border border-neutral-200 bg-white p-5"
          onSubmit={handleSubmit}
        >
          <h2 className="text-2xl font-semibold">
            {currentTrainer ? 'Edit trainer' : 'Add trainer'}
          </h2>
          <Field
            label="Name"
            name="name"
            required
            minLength={2}
            maxLength={100}
            defaultValue={currentTrainer?.name || ''}
          />
          <Field
            label="Specialization"
            name="specialization"
            required
            minLength={2}
            maxLength={200}
            defaultValue={currentTrainer?.specialization || ''}
          />
          <Field
            label="Years of experience"
            name="experienceYears"
            type="number"
            min="0"
            max="80"
            required
            defaultValue={currentTrainer?.experienceYears || 0}
          />
          <Field
            label="Bio"
            name="bio"
            as="textarea"
            rows={4}
            maxLength={3000}
            defaultValue={currentTrainer?.bio || ''}
          />
          <Field
            label="Profile image"
            name="image"
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            hint="Optional. JPEG, PNG, WebP or GIF, up to 5 MB."
          />
          {currentTrainer?.imageUrl && (
            <img
              className="h-24 w-24 object-cover"
              src={currentTrainer.imageUrl}
              alt={`${currentTrainer.name} current profile`}
            />
          )}
          <div className="flex gap-2">
            <Button type="submit" disabled={isCreating || isUpdating}>
              {isCreating || isUpdating
                ? 'Saving...'
                : currentTrainer
                  ? 'Save trainer'
                  : 'Create trainer'}
            </Button>
            {currentTrainer && (
              <Button variant="outline" type="button" onClick={() => setEditingId('')}>
                Cancel
              </Button>
            )}
          </div>
        </form>

        <section>
          <h2 className="mb-3 text-2xl font-semibold">Active trainer profiles</h2>
          {trainers.length ? (
            <div className="grid gap-3">
              {trainers.map((t) => (
                <article
                  key={t._id}
                  className="flex flex-wrap items-center gap-4 border border-neutral-200 bg-white p-4"
                >
                  <div className="size-16 shrink-0 bg-neutral-100">
                    {t.imageUrl && (
                      <img className="h-full w-full object-cover" src={t.imageUrl} alt="" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold">{t.name}</p>
                    <p className="text-sm text-neutral-600">
                      {t.specialization} · {t.experienceYears} years
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setEditingId(t._id)}>
                      Edit
                    </Button>
                    <Button
                      variant="danger"
                      disabled={isDeactivating}
                      onClick={() => handleDeactivate(t._id)}
                    >
                      Deactivate
                    </Button>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <EmptyState
              title="No active trainer profiles"
              detail="Add a trainer to show them on the public site."
            />
          )}
        </section>
      </div>
    </div>
  )
}
