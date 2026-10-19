import { Button } from "./Button.jsx";
import { AlertCircle } from 'lucide-react';
export function ErrorState({
  message,
  onRetry
}) {
  return <div className="flex flex-col items-start gap-3 border border-red-200 bg-red-50 p-5 text-sm text-red-900" role="alert"><p className="flex items-center gap-2 font-semibold"><AlertCircle size={18} />{message}</p>{onRetry && <Button variant="outline" onClick={onRetry}>Try again</Button>}</div>;
}
