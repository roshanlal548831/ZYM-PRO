export function Field({
  label,
  error,
  hint,
  as = 'input',
  className = '',
  ...props
}) {
  const Tag = as;
  return <label className="grid gap-2 text-sm font-semibold text-neutral-800">
    <span>{label}</span>
    <Tag className={`min-h-11 w-full rounded-sm border bg-white px-3 py-2 text-sm font-normal text-neutral-950 placeholder:text-neutral-400 focus:border-neutral-900 focus:outline-none ${error ? 'border-red-600' : 'border-neutral-300'} ${className}`} {...props} />
    {hint && <span className="text-xs font-normal text-neutral-500">{hint}</span>}
    {error && <span className="text-xs font-medium text-red-700">{error}</span>}
  </label>;
}
