export function PageHeading({
  eyebrow,
  title,
  detail,
  action
}) {
  return <div className="mb-8 flex flex-wrap items-end justify-between gap-5 border-b border-neutral-200 pb-6"><div>{eyebrow && <p className="mb-2 text-xs font-bold uppercase tracking-[.12em] text-neutral-500">{eyebrow}</p>}<h1 className="text-4xl font-semibold leading-tight md:text-5xl">{title}</h1>{detail && <p className="mt-2 max-w-2xl text-sm leading-6 text-neutral-600">{detail}</p>}</div>{action}</div>;
}
