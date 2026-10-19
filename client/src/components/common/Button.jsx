export function Button({
  children,
  variant = 'dark',
  className = '',
  ...props
}) {
  const variants = {
    dark: 'bg-neutral-950 text-white hover:bg-neutral-700',
    lime: 'bg-lime-300 text-neutral-950 hover:bg-lime-200',
    outline: 'border border-neutral-300 bg-white text-neutral-900 hover:border-neutral-900',
    danger: 'bg-red-700 text-white hover:bg-red-800',
    quiet: 'text-neutral-700 hover:bg-neutral-100'
  };
  return <button className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-sm px-5 py-2.5 text-sm font-bold transition disabled:cursor-not-allowed disabled:opacity-50 ${variants[variant]} ${className}`} {...props}>{children}</button>;
}
