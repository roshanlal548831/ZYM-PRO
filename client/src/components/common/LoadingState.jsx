import { LoaderCircle } from 'lucide-react';
export function LoadingState({
  label = 'Loading'
}) {
  return <div className="flex min-h-40 items-center justify-center gap-3 text-sm text-neutral-500" role="status"><LoaderCircle className="animate-spin" size={18} />{label}</div>;
}
