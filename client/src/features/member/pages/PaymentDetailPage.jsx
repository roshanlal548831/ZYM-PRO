import { useParams } from "react-router-dom";
import { useGetPaymentQuery } from "../../api/gymApi.js";
import { Button, ErrorState, LoadingState, PageHeading } from "../../../components/common/UI.jsx";
import { Printer } from "lucide-react";
import { formatDate, formatINR } from "../../../utils/errorUtils.js";
export function PaymentDetailPage() {
  const {
    id
  } = useParams();
  const {
    data: payment,
    isLoading,
    isError,
    refetch
  } = useGetPaymentQuery(id);
  if (isLoading) return <LoadingState label="Loading payment" />;
  if (isError) return <ErrorState message="Payment details could not be loaded." onRetry={refetch} />;
  return <div className="page-enter print:p-0"><PageHeading eyebrow="Payment receipt" title={payment.receiptNumber || 'Payment detail'} detail="Payment status is managed by the gym." action={<Button variant="outline" onClick={() => window.print()}><Printer size={16} />Print</Button>} /><div className="max-w-2xl border border-neutral-200 bg-white p-6"><dl className="grid gap-4 sm:grid-cols-2">{[['Amount', formatINR(payment.amount)], ['Method', payment.method], ['Status', payment.status], ['Paid at', formatDate(payment.paidAt)], ['Receipt number', payment.receiptNumber || 'Not issued'], ['Transaction reference', payment.transactionReference || 'â€”']].map(([label, value]) => <div key={label} className="border-b border-neutral-100 pb-3"><dt className="text-xs font-bold uppercase tracking-wider text-neutral-500">{label}</dt><dd className="mt-1 font-semibold capitalize">{value}</dd></div>)}</dl></div></div>;
}

