import { Button } from "./Button.jsx";
import { X } from 'lucide-react';
export function ConfirmDialog({
  title,
  detail,
  confirmLabel = 'Confirm',
  onConfirm,
  onClose,
  pending = false,
  danger = false
}) {
  return <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4" role="presentation" onMouseDown={event => {
    if (event.target === event.currentTarget) onClose();
  }}>
    <section className="w-full max-w-md border border-neutral-200 bg-white p-6 shadow-2xl" role="dialog" aria-modal="true" aria-labelledby="dialog-title">
      <div className="flex items-start justify-between gap-4"><div><h2 id="dialog-title" className="text-2xl font-semibold">{title}</h2><p className="mt-2 text-sm leading-6 text-neutral-600">{detail}</p></div><button className="rounded-sm p-1 text-neutral-500 hover:bg-neutral-100" aria-label="Close dialog" onClick={onClose}><X size={19} /></button></div>
      <div className="mt-6 flex justify-end gap-2"><Button variant="outline" onClick={onClose} disabled={pending}>Cancel</Button><Button variant={danger ? 'danger' : 'dark'} onClick={onConfirm} disabled={pending}>{pending ? 'Working...' : confirmLabel}</Button></div>
    </section>
  </div>;
}
