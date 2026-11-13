// The unit finder's buttons: pills in the forest's ink on paper, filled ember for the step forward.
const SHAPES = {
  line: 'border border-forest-900/25 bg-white/60 text-forest-900 enabled:hover:border-forest-900 enabled:hover:bg-forest-900 enabled:hover:text-ivory',
  solid: 'bg-ember text-white enabled:hover:bg-ember-deep',
  on: 'border border-ember bg-ember text-white enabled:hover:border-ember-deep enabled:hover:bg-ember-deep',
}

export function Pill({ tone = 'line', className = '', children, ...rest }) {
  return (
    <button
      {...rest}
      className={`label flex items-center justify-center gap-2.5 rounded-full px-5 py-3 text-[max(0.6rem,9px)] tracking-[0.18em] transition-colors duration-300 enabled:active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 ${SHAPES[tone]} ${className}`}
    >
      {children}
    </button>
  )
}

export function CloseButton({ label, className = '', ...rest }) {
  return (
    <button
      {...rest}
      aria-label={label}
      title={label}
      className={`grid size-11 shrink-0 place-items-center rounded-full border border-forest-900/20 bg-white/60 text-forest-900 transition-colors duration-300 hover:border-forest-900 hover:bg-forest-900 hover:text-ivory active:scale-95 ${className}`}
    >
      <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
        <path d="M6 6l12 12M18 6L6 18" />
      </svg>
    </button>
  )
}

export function Mark({ check = false, className = 'size-3.5' }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={check ? 'M5 12.5l4.5 4.5L19 7.5' : 'M12 5v14M5 12h14'} />
    </svg>
  )
}
