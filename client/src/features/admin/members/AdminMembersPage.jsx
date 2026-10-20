import { useState } from 'react'
import { toast } from 'sonner'
import { useGetAdminMembersQuery, useUpdateMemberStatusMutation } from '../../api/gymApi.js'
import { Button, EmptyState, ErrorState, Field, LoadingState, PageHeading, StatusBadge } from '../../../components/common/UI.jsx'
import { formatDate, getErrorMessage } from '../../../utils/errorUtils.js'
import { ADMIN_POLLING } from '../common/adminConstants.js'
import { Pagination } from '../common/AdminUI.jsx'

export function AdminMembersPage() {
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(1)

  const { data, isLoading, isError, refetch } = useGetAdminMembersQuery(
    { search: search || undefined, isActive: status || undefined, page, limit: 20 },
    ADMIN_POLLING,
  )
  const [updateMemberStatus, { isLoading: isUpdating }] = useUpdateMemberStatusMutation()

  async function handleToggleStatus(member) {
    try {
      await updateMemberStatus({ id: member._id, isActive: !member.isActive }).unwrap()
      toast.success(`Member ${member.isActive ? 'disabled' : 'enabled'}.`)
    } catch (err) {
      toast.error(getErrorMessage(err))
    }
  }

  if (isLoading) return <LoadingState label="Loading members" />
  if (isError && !data) return <ErrorState message="Member list could not be loaded." onRetry={refetch} />

  const members = data?.items || []

  return (
    <div className="page-enter">
      <PageHeading
        eyebrow="Member management"
        title="Members"
        detail="Search and manage member account access. The backend does not expose a separate member detail endpoint."
      />

      <div className="mb-4 grid gap-3 sm:grid-cols-[1fr_220px]">
        <Field
          label="Search members"
          placeholder="Name or email"
          value={search}
          onChange={(e) => {
            setPage(1)
            setSearch(e.target.value)
          }}
        />
        <Field
          label="Account status"
          as="select"
          value={status}
          onChange={(e) => {
            setPage(1)
            setStatus(e.target.value)
          }}
        >
          <option value="">All accounts</option>
          <option value="true">Active</option>
          <option value="false">Disabled</option>
        </Field>
      </div>

      {members.length ? (
        <>
          <div className="overflow-x-auto border border-neutral-200 bg-white">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="bg-neutral-100 text-xs uppercase tracking-wider text-neutral-500">
                <tr>
                  <th className="p-4">Member</th>
                  <th className="p-4">Phone</th>
                  <th className="p-4">Email status</th>
                  <th className="p-4">Joined</th>
                  <th className="p-4">Account</th>
                  <th className="p-4"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200">
                {members.map((member) => (
                  <tr key={member._id}>
                    <td className="p-4">
                      <p className="font-semibold">{member.name}</p>
                      <p className="text-xs text-neutral-500">{member.email}</p>
                    </td>
                    <td className="p-4">{member.phone || '—'}</td>
                    <td className="p-4">
                      <StatusBadge value={member.isEmailVerified ? 'active' : 'pending'} />
                    </td>
                    <td className="p-4">{formatDate(member.createdAt)}</td>
                    <td className="p-4">
                      <StatusBadge value={member.isActive ? 'active' : 'disabled'} />
                    </td>
                    <td className="p-4">
                      <Button
                        variant="outline"
                        disabled={isUpdating}
                        onClick={() => handleToggleStatus(member)}
                      >
                        {member.isActive ? 'Disable' : 'Enable'}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination data={data} page={page} setPage={setPage} />
        </>
      ) : (
        <EmptyState title="No matching members" detail="Try another search or filter." />
      )}
    </div>
  )
}
