import { SECTIONS } from '../data/content'
import { Mark } from '../art/Brand'
import { useNav, isPage, SECTION_IDS } from './nav'

function Arrow({ flip }) {
  return (
    <svg viewBox="0 0 24 24" className={`h-4 w-4 ${flip ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" strokeWidth="1.3">
      <path d="M4 12h15M13 6l6 6-6 6" />
    </svg>
  )
}

export default function Chrome() {
  const { route, go, tone } = useNav()
  if (!isPage(route)) return null

  const i = SECTION_IDS.indexOf(route)
  const prev = route === 'enquire' ? SECTIONS.at(-1) : i > 0 ? SECTIONS[i - 1] : null
  const next = i >= 0 && i < SECTIONS.length - 1 ? SECTIONS[i + 1] : i === SECTIONS.length - 1 ? { id: 'enquire', label: 'Enquire' } : null
  const [left, right] = Array.isArray(tone) ? tone : [tone, tone]
  const ink = (t) => `transition-colors duration-700 ${t === 'light' ? 'text-forest-900' : 'text-ivory'}`
  const label = route === 'enquire' ? 'Enquire' : SECTIONS[i].label

  return (
    <div className="pointer-events-none fixed inset-0 z-50">
      <div className="absolute inset-x-0 top-0 flex h-[var(--chrome-top)] items-center justify-between px-[var(--gutter)]">
        <button onClick={() => go('menu')} className={`group pointer-events-auto flex items-center gap-3 py-2 ${ink(left)}`} aria-label="Open menu">
          <span className="flex w-7 flex-col gap-[6px]">
            <span className="h-px w-full bg-current transition-transform duration-500 group-hover:scale-x-75 origin-left" />
            <span className="h-px w-2/3 bg-current transition-transform duration-500 group-hover:scale-x-150 origin-left" />
          </span>
          <span className="label">Menu</span>
        </button>

        <button onClick={() => go('landing')} className="pointer-events-auto absolute left-1/2 w-9 -translate-x-1/2 text-gold transition-transform duration-500 hover:scale-110 md:w-10" aria-label="Home">
          <Mark />
        </button>

        {route !== 'enquire' ? (
          <button onClick={() => go('enquire')} className={`btn pointer-events-auto !px-5 !py-2.5 transition-colors duration-700 ${right === 'ember' ? 'border-forest-900 bg-forest-900 text-ivory' : 'btn-solid'}`}>
            Enquire
          </button>
        ) : (
          <span />
        )}
      </div>

      <div className="absolute inset-x-0 bottom-0 flex h-[var(--chrome-bot)] items-center justify-between px-[var(--gutter)]">
        <div className={`label flex items-center gap-4 opacity-80 ${ink(left)}`}>
          {i >= 0 && (
            <span className="font-display text-base tracking-normal">
              {String(i + 1).padStart(2, '0')}
              <span className="opacity-50"> / {String(SECTIONS.length).padStart(2, '0')}</span>
            </span>
          )}
          <span className="hidden h-px w-10 bg-current opacity-40 sm:block" />
          <span className="hidden sm:inline">{label}</span>
        </div>

        <div className={`pointer-events-auto flex items-center gap-2 ${ink(right)}`}>
          {prev && (
            <button onClick={() => go(prev.id)} className="grid h-10 w-10 place-items-center rounded-full border border-current/30 transition-colors hover:border-current" aria-label={`Previous: ${prev.label}`}>
              <Arrow flip />
            </button>
          )}
          {next && (
            <button onClick={() => go(next.id)} className="group flex h-10 items-center gap-3 rounded-full border border-current/30 pl-5 pr-3 transition-colors hover:border-current" aria-label={`Next: ${next.label}`}>
              <span className="label hidden sm:inline">{next.label}</span>
              <Arrow />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
