import { useGetExpiringMembershipsQuery } from '../../api/gymApi.js'
import { EmptyState, ErrorState, LoadingState, PageHeading } from '../../../components/common/UI.jsx'
import { formatDate } from '../../../utils/errorUtils.js'
import { ADMIN_POLLING } from '../common/adminConstants.js'

export function AdminExpiringPage() {
  const { data, isLoading, isError, refetch } = useGetExpiringMembershipsQuery(
    { page: 1, limit: 100 },
    ADMIN_POLLING,
  )

  if (isLoading) return <LoadingState label="Loading expiring memberships" />
  if (isError && !data) return <ErrorState message="Expiry reminders could not be loaded." onRetry={refetch} />

  const items = data?.items || []

  return (
    <div className="page-enter">
      <PageHeading
        eyebrow="Retention"
        title="Expiring memberships"
        detail="Paid active memberships ending within the backend reminder window."
      />

      {items.length ? (
        <div className="overflow-x-auto border border-neutral-200 bg-white">
          <table className="w-full min-w-[650px] text-left text-sm">
            <thead className="bg-neutral-100 text-xs uppercase tracking-wider text-neutral-500">
              <tr>
                <th className="p-4">Member</th>
                <th className="p-4">Plan</th>
                <th className="p-4">Expires</th>
                <th className="p-4">Phone</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200">
              {items.map((item) => (
                <tr key={item._id}>
                  <td className="p-4">
                    {item.user?.name}
                    <br />
                    <span className="text-xs text-neutral-500">{item.user?.email}</span>
                  </td>
                  <td className="p-4">{item.membershipPlan?.name || 'Membership'}</td>
                  <td className="p-4">{formatDate(item.endDate)}</td>
                  <td className="p-4">{item.user?.phone || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState
          title="No memberships expiring soon"
          detail="Eligible records will appear here."
        />
      )}
    </div>
  )
}
