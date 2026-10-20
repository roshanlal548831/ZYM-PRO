import { useGetNotificationsQuery } from '../../api/gymApi.js'
import { EmptyState, ErrorState, LoadingState, PageHeading, StatusBadge } from '../../../components/common/UI.jsx'
import { formatDate } from '../../../utils/errorUtils.js'
import { ADMIN_POLLING } from '../common/adminConstants.js'

export function AdminNotificationsPage() {
  const { data, isLoading, isError, refetch } = useGetNotificationsQuery(
    { page: 1, limit: 50 },
    ADMIN_POLLING,
  )

  if (isLoading) return <LoadingState label="Loading notification logs" />
  if (isError && !data) {
    return <ErrorState message="Notification logs could not be loaded." onRetry={refetch} />
  }

  const items = data?.items || []

  return (
    <div className="page-enter">
      <PageHeading
        eyebrow="Delivery monitoring"
        title="Notification logs"
        detail="Recipient details are masked by the backend."
      />

      {items.length ? (
        <div className="overflow-x-auto border border-neutral-200 bg-white">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="bg-neutral-100 text-xs uppercase tracking-wider text-neutral-500">
              <tr>
                <th className="p-4">Date</th>
                <th className="p-4">Channel</th>
                <th className="p-4">Template</th>
                <th className="p-4">Status</th>
                <th className="p-4">Recipient</th>
                <th className="p-4">Error</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200">
              {items.map((item) => (
                <tr key={item._id}>
                  <td className="p-4">{formatDate(item.createdAt)}</td>
                  <td className="p-4 capitalize">{item.channel}</td>
                  <td className="p-4">{item.template}</td>
                  <td className="p-4">
                    <StatusBadge value={item.status} />
                  </td>
                  <td className="p-4">{item.recipient || '—'}</td>
                  <td className="max-w-[240px] truncate p-4">{item.errorCode || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState
          title="No notification events"
          detail="Provider delivery records will appear here."
        />
      )}
    </div>
  )
}
