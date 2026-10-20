import { Button } from '../../../components/common/UI.jsx'

export function RefreshWarning({ isError }) {
  if (!isError) return null
  return (
    <p className="mb-4 border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900" role="status">
      The latest refresh failed. Showing the last loaded data.
    </p>
  )
}

export function StatCard({ label, value, note, icon: Icon }) {
  return (
    <article className="border border-neutral-200 bg-white p-5">
      <div className="flex items-center justify-between">
        <p className="text-xs font-bold uppercase tracking-wider text-neutral-500">{label}</p>
        {Icon && <Icon size={18} className="text-neutral-400" />}
      </div>
      <p className="mt-4 text-3xl font-bold">{value ?? 0}</p>
      {note && <p className="mt-1 text-xs text-neutral-500">{note}</p>}
    </article>
  )
}

export function Pagination({ data, page, setPage }) {
  const pages = data?.pagination?.pages || 1
  return (
    <div className="mt-4 flex items-center justify-between">
      <p className="text-xs text-neutral-500">
        Page {data?.pagination?.page || page} of {pages} · {data?.pagination?.total || 0} records
      </p>
      <div className="flex gap-2">
        <Button variant="outline" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
          Previous
        </Button>
        <Button variant="outline" disabled={page >= pages} onClick={() => setPage((p) => p + 1)}>
          Next
        </Button>
      </div>
    </div>
  )
}

