import { useState } from 'react'
import { toast } from 'sonner'
import { useGetAdminMembershipsQuery, useUpdateMembershipStatusMutation } from '../../api/gymApi.js'
import { Button, EmptyState, ErrorState, Field, LoadingState, PageHeading, StatusBadge } from '../../../components/common/UI.jsx'
import { formatDate, formatINR, getErrorMessage } from '../../../utils/errorUtils.js'
import { ADMIN_POLLING } from '../common/adminConstants.js'
import { Pagination } from '../common/AdminUI.jsx'

export function AdminMembershipsPage() {
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(1)

  const { data, isLoading, isError, refetch } = useGetAdminMembershipsQuery(
    { status: status || undefined, page, limit: 20 },
    ADMIN_POLLING,
  )
  const [updateMembershipStatus, { isLoading: isUpdating }] = useUpdateMembershipStatusMutation()

  async function handleStatusChange(id, newStatus) {
    try {
      const response = await updateMembershipStatus({ id, status: newStatus }).unwrap()
      toast.success(response.message || `Membership updated to ${newStatus}.`)
    } catch (err) {
      toast.error(getErrorMessage(err))
    }
  }

  if (isLoading) return <LoadingState label="Loading memberships" />
  if (isError && !data) return <ErrorState message="Membership list could not be loaded." onRetry={refetch} />

  const memberships = data?.items || []

  return (
    <div className="page-enter">
      <PageHeading
        eyebrow="Member operations"
        title="Memberships"
        detail="Activation is allowed only for paid memberships within their effective dates."
      />

      <div className="mb-4 max-w-xs">
        <Field
          label="Filter by status"
          as="select"
          value={status}
          onChange={(e) => {
            setPage(1)
            setStatus(e.target.value)
          }}
        >
          <option value="">All statuses</option>
          {['pending', 'active', 'expired', 'cancelled'].map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </Field>
      </div>

      {memberships.length ? (
        <>
          <div className="overflow-x-auto border border-neutral-200 bg-white">
            <table className="w-full min-w-[850px] text-left text-sm">
              <thead className="bg-neutral-100 text-xs uppercase tracking-wider text-neutral-500">
                <tr>
                  <th className="p-4">Member</th>
                  <th className="p-4">Plan</th>
                  <th className="p-4">Dates</th>
                  <th className="p-4">Due</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Payment</th>
                  <th className="p-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200">
                {memberships.map((item) => (
                  <tr key={item._id}>
                    <td className="p-4">
                      <p className="font-semibold">{item.user?.name || 'Member'}</p>
                      <p className="text-xs text-neutral-500">{item.user?.email}</p>
                    </td>
                    <td className="p-4">{item.membershipPlan?.name || 'Plan'}</td>
                    <td className="p-4">
                      {formatDate(item.startDate)}
                      <br />
                      <span className="text-xs text-neutral-500">to {formatDate(item.endDate)}</span>
                    </td>
                    <td className="p-4 font-semibold">{formatINR(item.amountDue)}</td>
                    <td className="p-4">
                      <StatusBadge value={item.status} />
                    </td>
                    <td className="p-4">
                      <StatusBadge value={item.paymentStatus} />
                    </td>
                    <td className="p-4">
                      <div className="flex gap-2">
                        {item.status !== 'cancelled' && (
                          <Button
                            variant="outline"
                            disabled={isUpdating}
                            onClick={() => handleStatusChange(item._id, 'cancelled')}
                          >
                            Cancel
                          </Button>
                        )}
                        {item.status === 'pending' && item.paymentStatus === 'paid' && (
                          <Button
                            variant="lime"
                            disabled={isUpdating}
                            onClick={() => handleStatusChange(item._id, 'active')}
                          >
                            Activate
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination data={data} page={page} setPage={setPage} />
        </>
      ) : (
        <EmptyState title="No memberships found" detail="Membership requests will appear here." />
      )}
    </div>
  )
}
