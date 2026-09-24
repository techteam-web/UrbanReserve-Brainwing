import { useEffect, useRef, useState } from 'react'
import { gsap, useGSAP, reduced } from '../gsap/gsapConfig'
import ICON_PATHS from './iconPaths'

// iOS-style segmented control: the selected option sits on a sliding pill.
export function Segmented({ items, value, onChange, tone = 'light', size = 'md', className = '' }) {
  const i = Math.max(0, items.findIndex((t) => t.id === value))
  const dark = tone === 'dark'
  return (
    <div role="tablist" className={`relative grid rounded-full p-1 ${dark ? 'bg-ivory/10' : 'bg-forest-900/[0.07]'} ${className}`} style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}>
      <span
        aria-hidden="true"
        className={`absolute inset-y-1 left-1 rounded-full shadow-sm transition-transform duration-500 ease-[cubic-bezier(.16,1,.3,1)] ${dark ? 'bg-gold' : 'bg-white'}`}
        style={{ width: `calc((100% - 0.5rem) / ${items.length})`, transform: `translateX(${i * 100}%)` }}
      />
      {items.map((t) => {
        const on = t.id === value
        return (
          <button
            key={t.id}
            role="tab"
            aria-selected={on}
            onClick={() => onChange(t.id)}
            className={`label relative z-[1] truncate rounded-full transition-colors duration-300 active:scale-95 ${size === 'sm' ? 'px-2 py-2 text-[max(0.58rem,9px)]' : 'px-3 py-3'} ${
              on ? (dark ? 'text-forest-950' : 'text-forest-900') : dark ? 'text-ivory/70' : 'text-forest-900/55'
            }`}
          >
            {t.short ?? t.label}
          </button>
        )
      })}
    </div>
  )
}

// Crossfades its children whenever `id` changes and replays their entrance.
export function Swap({ id, className = '', children }) {
  const ref = useRef(null)
  const shown = useRef(id)
  useGSAP(
    () => {
      if (shown.current === id) return
      shown.current = id
      if (reduced()) return
      gsap.fromTo(ref.current.querySelectorAll('[data-swap]'), { autoAlpha: 0, y: 18 }, { autoAlpha: 1, y: 0, duration: 0.6, stagger: 0.05, overwrite: true })
    },
    { scope: ref, dependencies: [id] },
  )
  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  )
}

// Mount only while open: `{i != null && <Lightbox photos index={i} onClose />}`
export function Lightbox({ photos, index, onClose }) {
  const ref = useRef(null)
  const [i, setI] = useState(index)

  useGSAP(
    () => {
      gsap.fromTo(ref.current, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.45, ease: 'power2.out' })
      gsap.fromTo('[data-lb-img]', { scale: 0.94, autoAlpha: 0 }, { scale: 1, autoAlpha: 1, duration: 0.9, delay: 0.1 })
    },
    { scope: ref },
  )

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose()
      else if (e.key === 'ArrowRight') setI((v) => (v + 1) % photos.length)
      else if (e.key === 'ArrowLeft') setI((v) => (v - 1 + photos.length) % photos.length)
      else return
      e.preventDefault()
      e.stopImmediatePropagation()
    }
    window.addEventListener('keydown', onKey, true)
    return () => window.removeEventListener('keydown', onKey, true)
  }, [photos.length, onClose])

  const p = photos[i]
  return (
    <div ref={ref} className="absolute inset-0 z-[55] flex flex-col items-center justify-center bg-forest-950/95 p-[var(--gutter)] text-ivory backdrop-blur-sm" onClick={onClose}>
      <img key={p.image} data-lb-img src={p.image} alt={p.label} className="max-h-[78%] max-w-full object-contain shadow-2xl" onClick={(e) => e.stopPropagation()} />
      <div className="mt-6 flex items-center gap-6" onClick={(e) => e.stopPropagation()}>
        <button className="label opacity-70 hover:opacity-100" onClick={() => setI((i - 1 + photos.length) % photos.length)}>Prev</button>
        <span className="font-display text-xl">{p.label}</span>
        <button className="label opacity-70 hover:opacity-100" onClick={() => setI((i + 1) % photos.length)}>Next</button>
      </div>
      <button className="label absolute right-[var(--gutter)] top-[calc(var(--chrome-top)*0.3)] py-3 opacity-80 hover:opacity-100" onClick={onClose}>
        Close ✕
      </button>
    </div>
  )
}

export function Icon({ name, className = 'h-4 w-4' }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" strokeLinecap="round">
      <path d={ICON_PATHS[name]} />
    </svg>
  )
}
