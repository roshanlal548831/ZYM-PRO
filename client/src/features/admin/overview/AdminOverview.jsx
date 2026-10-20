import { Link } from 'react-router-dom'
import { Activity, ArrowRight, Bell, CreditCard, Users } from 'lucide-react'
import { ResponsiveContainer, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Bar } from 'recharts'
import { useGetDashboardQuery } from '../../api/gymApi.js'
import { EmptyState, ErrorState, LoadingState, PageHeading } from '../../../components/common/UI.jsx'
import { formatINR } from '../../../utils/errorUtils.js'
import { ADMIN_POLLING } from '../common/adminConstants.js'
import { RefreshWarning, StatCard } from '../common/AdminUI.jsx'

export function AdminOverview() {
  const { data, isLoading, isError, refetch } = useGetDashboardQuery(undefined, ADMIN_POLLING)

  if (isLoading) return <LoadingState label="Loading gym operations" />
  if (isError && !data) return <ErrorState message="Dashboard statistics could not be loaded." onRetry={refetch} />

  const confirmedPayments = (data?.confirmedPayments || []).map((e) => ({
    status: e._id.status,
    amount: e.total,
    count: e.count,
  }))

  return (
    <div className="page-enter">
      <RefreshWarning isError={isError} />
      <PageHeading
        eyebrow="Management overview"
        title="Gym operations"
        detail="Live member, membership, payment, and enquiry totals from the backend."
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Members" value={data?.totalMembers} icon={Users} />
        <StatCard label="Active memberships" value={data?.activeMemberships} icon={Activity} />
        <StatCard label="Pending memberships" value={data?.pendingMemberships} icon={CreditCard} />
        <StatCard label="New enquiries" value={data?.newEnquiries} icon={Bell} />
      </div>

      <div className="mt-6 grid gap-5 xl:grid-cols-[1.3fr_.7fr]">
        <section className="border border-neutral-200 bg-white p-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-semibold">Payment totals</h2>
              <p className="mt-1 text-xs text-neutral-500">Confirmed and refunded amount by status.</p>
            </div>
            <Link className="text-sm font-bold underline decoration-lime-500 underline-offset-4" to="/admin/reports">
              Reports
            </Link>
          </div>

          {confirmedPayments.length ? (
            <div className="mt-5 h-64" role="img" aria-label="Payment totals by status">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={confirmedPayments}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e5e5" />
                  <XAxis dataKey="status" tickLine={false} axisLine={false} />
                  <YAxis tickLine={false} axisLine={false} />
                  <Tooltip formatter={(value) => formatINR(value)} />
                  <Bar dataKey="amount" fill="#171717" maxBarSize={62} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyState title="No payment totals yet" detail="Recorded payments will appear here." />
          )}
        </section>

        <div className="grid gap-3">
          <StatCard label="Payments awaiting confirmation" value={data?.pendingPayments} icon={CreditCard} />
          <StatCard label="Memberships expiring soon" value={data?.expiringMemberships} icon={Activity} />
          <section className="flex flex-col justify-between border border-neutral-200 bg-lime-300 p-5">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider">Quick task</p>
              <p className="mt-2 text-xl font-bold">Record a gym payment</p>
            </div>
            <Link
              className="mt-4 inline-flex items-center gap-2 text-sm font-bold underline underline-offset-4"
              to="/admin/payments"
            >
              Open payments <ArrowRight size={16} />
            </Link>
          </section>
        </div>
      </div>
    </div>
  )
}
