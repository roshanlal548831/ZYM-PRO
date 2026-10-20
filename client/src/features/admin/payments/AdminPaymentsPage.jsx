import { useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { toast } from 'sonner'
import {
  useConfirmPaymentMutation,
  useCreatePaymentMutation,
  useGetAdminMembershipsQuery,
  useGetAdminPaymentsQuery,
  useRefundPaymentMutation,
} from '../../api/gymApi.js'
import {
  Button,
  EmptyState,
  ErrorState,
  Field,
  LoadingState,
  PageHeading,
  StatusBadge,
} from '../../../components/common/UI.jsx'
import { formatDate, formatINR, getErrorMessage } from '../../../utils/errorUtils.js'
import { ADMIN_POLLING } from '../common/adminConstants.js'
import { Pagination, RefreshWarning } from '../common/AdminUI.jsx'

export function AdminPaymentsPage() {
  const [page, setPage] = useState(1)
  const [status, setStatus] = useState('')
  const [refundTarget, setRefundTarget] = useState(null)
  const [refundReason, setRefundReason] = useState('')

  const {
    data: paymentsData,
    isLoading: isPaymentsLoading,
    isError: isPaymentsError,
    refetch: refetchPayments,
  } = useGetAdminPaymentsQuery({ page, limit: 20, status: status || undefined }, ADMIN_POLLING)

  const {
    data: pendingMembershipsData,
    isLoading: isPendingLoading,
    isError: isPendingError,
  } = useGetAdminMembershipsQuery({ status: 'pending', page: 1, limit: 100 }, ADMIN_POLLING)

  const [createPayment, { isLoading: isRecording }] = useCreatePaymentMutation()
  const [confirmPayment, { isLoading: isConfirming }] = useConfirmPaymentMutation()
  const [refundPayment, { isLoading: isRefunding }] = useRefundPaymentMutation()

  const form = useForm({
    defaultValues: {
      membershipId: '',
      amount: '',
      method: 'cash',
      transactionReference: '',
      notes: '',
    },
  })

  const pendingList = (pendingMembershipsData?.items || []).filter(
    (item) => item.paymentStatus === 'pending',
  )
  const selectedMembershipId = useWatch({ control: form.control, name: 'membershipId' })
  const selectedMembership = pendingList.find((item) => item._id === selectedMembershipId)

  async function handleRecordPayment(values) {
    if (!selectedMembership) {
      toast.error('Select a pending membership request.')
      return
    }

    try {
      const response = await createPayment({
        memberId: selectedMembership.user?._id,
        membershipId: selectedMembership._id,
        amount: Number(values.amount),
        method: values.method,
        transactionReference: values.transactionReference || undefined,
        notes: values.notes || undefined,
      }).unwrap()

      toast.success(response.message || 'Payment recorded and confirmed.')
      form.reset({
        membershipId: '',
        amount: '',
        method: 'cash',
        transactionReference: '',
        notes: '',
      })
    } catch (err) {
      toast.error(getErrorMessage(err))
    }
  }

  async function handleConfirm(id) {
    try {
      const res = await confirmPayment(id).unwrap()
      toast.success(res.message || 'Payment confirmed.')
    } catch (err) {
      toast.error(getErrorMessage(err))
    }
  }

  async function handleRefundSubmit(e) {
    e.preventDefault()
    if (!refundTarget) return
    try {
      const res = await refundPayment({ id: refundTarget._id, reason: refundReason }).unwrap()
      toast.success(res.message || 'Payment refunded.')
      setRefundTarget(null)
      setRefundReason('')
    } catch (err) {
      toast.error(getErrorMessage(err))
    }
  }

  if (isPaymentsLoading) return <LoadingState label="Loading payments" />
  if (isPaymentsError && !paymentsData) {
    return <ErrorState message="Payment records could not be loaded." onRetry={refetchPayments} />
  }

  const payments = paymentsData?.items || []

  return (
    <div className="page-enter">
      <RefreshWarning isError={isPaymentsError || isPendingError} />
      <PageHeading
        eyebrow="Offline payment workflow"
        title="Payments"
        detail="Recording a payment uses the backend's record-and-confirm endpoint. Members cannot mark payments as paid."
      />

      <div className="grid gap-6 xl:grid-cols-[.8fr_1.2fr]">
        <form
          className="grid content-start gap-4 border border-neutral-200 bg-white p-5"
          onSubmit={form.handleSubmit(handleRecordPayment)}
        >
          <h2 className="text-2xl font-semibold">Record gym payment</h2>

          {isPendingLoading ? (
            <LoadingState label="Loading pending requests" />
          ) : isPendingError && !pendingMembershipsData ? (
            <ErrorState message="Pending membership requests could not be loaded." />
          ) : pendingList.length ? (
            <>
              <Field label="Pending membership" as="select" {...form.register('membershipId')}>
                <option value="">Select a member and plan</option>
                {pendingList.map((m) => (
                  <option key={m._id} value={m._id}>
                    {m.user?.name || 'Member'} · {m.membershipPlan?.name || 'Plan'} · {formatINR(m.amountDue)}
                  </option>
                ))}
              </Field>

              <Field
                label="Amount received (INR)"
                type="number"
                min="1"
                step="0.01"
                {...form.register('amount', { required: true, valueAsNumber: true })}
              />

              <Field label="Payment method" as="select" {...form.register('method')}>
                <option value="cash">Cash</option>
                <option value="upi">UPI</option>
              </Field>

              <Field
                label="Transaction reference (optional)"
                {...form.register('transactionReference')}
              />

              <Field label="Notes (optional)" as="textarea" rows={3} {...form.register('notes')} />

              <Button className="w-fit" type="submit" disabled={isRecording}>
                {isRecording ? 'Recording...' : 'Record and confirm'}
              </Button>

              <p className="text-xs leading-5 text-neutral-500">
                The backend records and confirms this offline payment in one operation.
              </p>
            </>
          ) : (
            <EmptyState
              title="No pending membership requests"
              detail="A member's pending request will appear here."
            />
          )}
        </form>

        <section>
          <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
            <h2 className="text-2xl font-semibold">Payment records</h2>
            <Field
              label="Status"
              as="select"
              value={status}
              onChange={(e) => {
                setPage(1)
                setStatus(e.target.value)
              }}
            >
              <option value="">All</option>
              <option value="pending">Pending</option>
              <option value="paid">Paid</option>
              <option value="refunded">Refunded</option>
            </Field>
          </div>

          {payments.length ? (
            <div className="overflow-x-auto border border-neutral-200 bg-white">
              <table className="w-full min-w-[780px] text-left text-sm">
                <thead className="bg-neutral-100 text-xs uppercase tracking-wider text-neutral-500">
                  <tr>
                    <th className="p-4">Member</th>
                    <th className="p-4">Amount</th>
                    <th className="p-4">Method</th>
                    <th className="p-4">Status</th>
                    <th className="p-4">Receipt</th>
                    <th className="p-4">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200">
                  {payments.map((p) => (
                    <tr key={p._id}>
                      <td className="p-4">
                        {p.member?.name || 'Member'}
                        <br />
                        <span className="text-xs text-neutral-500">{formatDate(p.createdAt)}</span>
                      </td>
                      <td className="p-4 font-semibold">{formatINR(p.amount)}</td>
                      <td className="p-4 capitalize">{p.method}</td>
                      <td className="p-4">
                        <StatusBadge value={p.status} />
                      </td>
                      <td className="p-4">{p.receiptNumber || '—'}</td>
                      <td className="p-4">
                        <div className="flex gap-2">
                          {p.status === 'pending' && (
                            <Button
                              variant="outline"
                              disabled={isConfirming}
                              onClick={() => handleConfirm(p._id)}
                            >
                              Confirm
                            </Button>
                          )}
                          {p.status === 'paid' && (
                            <Button
                              variant="danger"
                              onClick={() => {
                                setRefundTarget(p)
                                setRefundReason('')
                              }}
                            >
                              Refund
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState
              title="No payment records"
              detail="Payments will appear after recording at the gym."
            />
          )}

          <Pagination data={paymentsData} page={page} setPage={setPage} />
        </section>
      </div>

      {refundTarget && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4">
          <form
            className="w-full max-w-md border border-neutral-200 bg-white p-6"
            role="dialog"
            aria-modal="true"
            aria-labelledby="refund-title"
            onSubmit={handleRefundSubmit}
          >
            <h2 id="refund-title" className="text-2xl font-semibold">
              Refund payment?
            </h2>
            <p className="mt-2 text-sm text-neutral-600">
              Refunding {formatINR(refundTarget.amount)} for{' '}
              {refundTarget.member?.name || 'this member'} will cancel the associated membership.
            </p>
            <Field
              className="mt-5"
              label="Refund reason"
              as="textarea"
              rows={4}
              minLength={3}
              maxLength={500}
              required
              value={refundReason}
              onChange={(e) => setRefundReason(e.target.value)}
            />
            <div className="mt-5 flex justify-end gap-2">
              <Button
                variant="outline"
                type="button"
                onClick={() => setRefundTarget(null)}
                disabled={isRefunding}
              >
                Keep payment
              </Button>
              <Button
                variant="danger"
                type="submit"
                disabled={isRefunding || refundReason.trim().length < 3}
              >
                {isRefunding ? 'Refunding...' : 'Record refund'}
              </Button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
