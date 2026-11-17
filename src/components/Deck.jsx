// The slide controls shared by the Overview and Specifications (their slides run on useDeck).
function Arrow({ flip = false }) {
  return (
    <svg viewBox="0 0 24 24" className={`size-4 ${flip ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  )
}

/**
 * The slide controls, floating just above the dock: arrows either side of a mark per slide, the
 * active one drawn long and solid with its name. `dark` for a dark slide under it.
 */
export function DeckPager({ labels, idx, nav, dark, label }) {
  const ink = dark ? 'text-ivory' : 'text-forest-900'
  const skin = dark ? 'border-ivory/15 bg-forest-950/40' : 'border-forest-900/15 bg-white/55'
  return (
    <div className={`absolute bottom-(--dock-band) left-1/2 z-10 mb-1 flex -translate-x-1/2 items-center transition-colors duration-700 ${ink}`}>
      <div role="group" aria-label={label} className={`flex items-center rounded-full border p-1 backdrop-blur-md transition-colors duration-700 ${skin}`}>
        <button onClick={() => nav.current.prev()} className="grid size-9 shrink-0 place-items-center rounded-full transition-colors duration-300 hover:bg-current/10" aria-label="Previous slide">
          <Arrow flip />
        </button>
        <div className="flex items-center px-1">
          {labels.map((l, i) => {
            const on = idx === i
            return (
              <button key={l} onClick={() => nav.current.go(i)} className="group flex items-center gap-2.5 px-2 py-2.5 sm:px-2.5" aria-label={`Show ${l}`} aria-current={on}>
                <span className={`h-[3px] rounded-full transition-[width,background-color] duration-700 ${on ? 'w-9 bg-current' : 'w-3 bg-current/25 group-hover:bg-current/50'}`} />
                <span className={`label whitespace-nowrap text-[max(0.58rem,9px)] transition-opacity duration-500 ${on ? '' : 'hidden opacity-60 group-hover:opacity-100 lg:inline'}`}>{l}</span>
              </button>
            )
          })}
        </div>
        <button onClick={() => nav.current.next()} className="grid size-9 shrink-0 place-items-center rounded-full transition-colors duration-300 hover:bg-current/10" aria-label="Next slide">
          <Arrow />
        </button>
      </div>
    </div>
  )
}
