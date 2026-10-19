export function StatusBadge({
  value
}) {
  const normalized = String(value || 'unknown').toLowerCase();
  const colors = normalized === 'active' || normalized === 'paid' || normalized === 'converted' || normalized === 'confirmed' ? 'bg-lime-100 text-lime-900' : normalized === 'pending' || normalized === 'new' || normalized === 'contacted' ? 'bg-amber-100 text-amber-900' : normalized === 'cancelled' || normalized === 'expired' || normalized === 'refunded' || normalized === 'closed' ? 'bg-neutral-200 text-neutral-700' : 'bg-neutral-100 text-neutral-600';
  return <span className={`inline-flex rounded-sm px-2 py-1 text-xs font-bold capitalize ${colors}`}>{normalized}</span>;
}
