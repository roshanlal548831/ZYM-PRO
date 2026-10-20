import { useMemo, useState } from 'react'
import { ResponsiveContainer, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Bar } from 'recharts'
import { useGetPaymentSummaryQuery } from '../../api/gymApi.js'
import { EmptyState, ErrorState, Field, LoadingState, PageHeading } from '../../../components/common/UI.jsx'
import { formatINR } from '../../../utils/errorUtils.js'

export function AdminReportsPage() {
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')

  const queryParams = useMemo(() => {
    return {
      ...(from ? { from: new Date(`${from}T00:00:00.000Z`).toISOString() } : {}),
      ...(to ? { to: new Date(`${to}T23:59:59.999Z`).toISOString() } : {}),
    }
  }, [from, to])

  const { data: rawData = [], isLoading, isError, refetch } = useGetPaymentSummaryQuery(queryParams)

  if (isLoading) return <LoadingState label="Loading payment report" />
  if (isError) return <ErrorState message="Payment summary could not be loaded." onRetry={refetch} />

  const reportItems = rawData.map((e) => ({
    status: e._id.status,
    amount: e.amount,
    count: e.count,
  }))

  return (
    <div className="page-enter">
      <PageHeading
        eyebrow="Financial overview"
        title="Payment reports"
        detail="Totals are grouped by status and currency using the backend summary endpoint."
      />

      <div className="mb-5 grid max-w-xl gap-4 sm:grid-cols-2">
        <Field label="From" type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
        <Field label="To" type="date" value={to} onChange={(e) => setTo(e.target.value)} />
      </div>

      {reportItems.length ? (
        <>
          <div className="h-80 border border-neutral-200 bg-white p-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={reportItems}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e5e5" />
                <XAxis dataKey="status" tickLine={false} axisLine={false} />
                <YAxis tickLine={false} axisLine={false} />
                <Tooltip formatter={(value) => formatINR(value)} />
                <Bar dataKey="amount" fill="#171717" maxBarSize={70} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {reportItems.map((e) => (
              <article key={e.status} className="border border-neutral-200 bg-white p-5">
                <p className="text-xs font-bold uppercase tracking-wider text-neutral-500">{e.status}</p>
                <p className="mt-2 text-2xl font-bold">{formatINR(e.amount)}</p>
                <p className="mt-1 text-xs text-neutral-500">{e.count} payment records · INR</p>
              </article>
            ))}
          </div>
        </>
      ) : (
        <EmptyState
          title="No summary data"
          detail="The selected period has no paid or refunded records."
        />
      )}
    </div>
  )
}
