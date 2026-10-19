import { Inbox } from 'lucide-react';
export function EmptyState({
  title = 'Nothing here yet',
  detail = 'There are no records to show.'
}) {
  return <div className="grid min-h-48 place-items-center border border-dashed border-neutral-300 p-8 text-center"><div><Inbox className="mx-auto mb-3 text-neutral-400" size={26} /><h3 className="text-lg font-semibold">{title}</h3><p className="mt-1 max-w-md text-sm text-neutral-500">{detail}</p></div></div>;
}
