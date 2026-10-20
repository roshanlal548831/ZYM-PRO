import { toast } from 'sonner'
import { useGetAdminEnquiriesQuery, useGetTrainersQuery, useUpdateEnquiryMutation } from '../../api/gymApi.js'
import {
  EmptyState,
  ErrorState,
  Field,
  LoadingState,
  PageHeading,
  StatusBadge,
} from '../../../components/common/UI.jsx'
import { formatDate, getErrorMessage } from '../../../utils/errorUtils.js'
import { ADMIN_POLLING } from '../common/adminConstants.js'

export function AdminEnquiriesPage() {
  const { data, isLoading, isError, refetch } = useGetAdminEnquiriesQuery(undefined, ADMIN_POLLING)
  const { data: trainers = [] } = useGetTrainersQuery()
  const [updateEnquiry, { isLoading: isUpdating }] = useUpdateEnquiryMutation()

  async function handleUpdate(id, patch) {
    try {
      await updateEnquiry({ id, ...patch }).unwrap()
      toast.success('Enquiry updated.')
    } catch (err) {
      toast.error(getErrorMessage(err))
    }
  }

  if (isLoading) return <LoadingState label="Loading enquiries" />
  if (isError && !data) return <ErrorState message="Enquiries could not be loaded." onRetry={refetch} />

  const enquiries = data?.items || []

  return (
    <div className="page-enter">
      <PageHeading
        eyebrow="Member support"
        title="Enquiries"
        detail="Public enquiries and free-trial requests arrive through the same endpoint. Assignments must use an active trainer."
      />

      {enquiries.length ? (
        <div className="grid gap-3">
          {enquiries.map((item) => (
            <article
              key={item._id}
              className="grid gap-4 border border-neutral-200 bg-white p-5 md:grid-cols-[1fr_220px]"
            >
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-xl font-semibold">{item.name}</h2>
                  <StatusBadge value={item.enquiryType} />
                  <StatusBadge value={item.status} />
                </div>
                <p className="mt-1 text-sm text-neutral-600">
                  {item.email} · {item.phone}
                </p>
                <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-neutral-700">
                  {item.message}
                </p>
                <p className="mt-3 text-xs text-neutral-500">Received {formatDate(item.createdAt)}</p>
              </div>

              <div className="grid content-start gap-3">
                <Field
                  label="Update status"
                  as="select"
                  value={item.status}
                  disabled={isUpdating}
                  onChange={(e) => handleUpdate(item._id, { status: e.target.value })}
                >
                  {['new', 'contacted', 'converted', 'closed'].map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </Field>

                <Field
                  label="Assigned trainer"
                  as="select"
                  value={item.assignedTo?._id || ''}
                  disabled={isUpdating}
                  onChange={(e) => handleUpdate(item._id, { assignedTo: e.target.value || null })}
                >
                  <option value="">Unassigned</option>
                  {trainers.map((t) => (
                    <option key={t._id} value={t._id}>
                      {t.name} · {t.specialization}
                    </option>
                  ))}
                </Field>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <EmptyState
          title="No enquiries yet"
          detail="New contact and trial forms will appear here."
        />
      )}
    </div>
  )
}
