import { useState } from "react";
import { useGetMyPaymentsQuery } from "../../api/gymApi.js";
import { Button, EmptyState, ErrorState, LoadingState, PageHeading, StatusBadge } from "../../../components/common/UI.jsx";
import { formatDate, formatINR } from "../../../utils/errorUtils.js";
import { Link } from "react-router-dom";
export function PaymentsPage() {
  const [page, setPage] = useState(1);
  const {
    data,
    isLoading,
    isError,
    refetch
  } = useGetMyPaymentsQuery({
    page,
    limit: 10
  });
  if (isLoading) return <LoadingState label="Loading payments" />;
  if (isError) return <ErrorState message="Payment history could not be loaded." onRetry={refetch} />;
  const items = data?.items || [];
  return <div className="page-enter"><PageHeading eyebrow="Your account" title="Payments" detail="Payment records and receipts from the gym." />{items.length ? <><div className="overflow-x-auto border border-neutral-200 bg-white"><table className="w-full min-w-[650px] text-left text-sm"><thead className="bg-neutral-100 text-xs uppercase tracking-wider text-neutral-500"><tr><th className="p-4">Date</th><th className="p-4">Amount</th><th className="p-4">Method</th><th className="p-4">Status</th><th className="p-4">Receipt</th><th className="p-4" /></tr></thead><tbody className="divide-y divide-neutral-200">{items.map(payment => <tr key={payment._id}><td className="p-4">{formatDate(payment.paidAt || payment.createdAt)}</td><td className="p-4 font-semibold">{formatINR(payment.amount)}</td><td className="p-4 capitalize">{payment.method}</td><td className="p-4"><StatusBadge value={payment.status} /></td><td className="p-4">{payment.receiptNumber || 'â€”'}</td><td className="p-4"><Link className="font-bold underline decoration-lime-500 underline-offset-4" to={`/app/payments/${payment._id}`}>Details</Link></td></tr>)}</tbody></table></div><div className="mt-4 flex items-center justify-between"><p className="text-xs text-neutral-500">Page {data.pagination?.page || page} of {data.pagination?.pages || 1}</p><div className="flex gap-2"><Button variant="outline" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</Button><Button variant="outline" disabled={page >= (data.pagination?.pages || 1)} onClick={() => setPage(page + 1)}>Next</Button></div></div></> : <EmptyState title="No payments yet" detail="Payments recorded by the gym will appear here." />}</div>;
}

