import { useEffect, useRef, useState } from 'react'
import { gsap, useGSAP, reduced } from '../gsap/gsapConfig'
import ICON_PATHS from './iconPaths'

export function Tabs({ items, value, onChange, vertical = false, className = '' }) {
  return (
    <div role="tablist" className={`flex ${vertical ? 'flex-col gap-1' : 'flex-wrap gap-x-7 gap-y-2 border-b border-current/15'} ${className}`}>
      {items.map((t, i) => {
        const on = value === t.id
        return (
          <button
            key={t.id}
            role="tab"
            aria-selected={on}
            onClick={() => onChange(t.id)}
            className={`group relative flex items-baseline gap-3 text-left transition-opacity duration-500 ${vertical ? 'py-2.5' : 'pb-3 pt-1'} ${on ? 'opacity-100' : 'opacity-45 hover:opacity-80'}`}
          >
            {vertical && <span className="font-display text-sm text-ember">{String(i + 1).padStart(2, '0')}</span>}
            <span className={vertical ? 'font-display text-[clamp(1.2rem,2.6vh,1.7rem)] uppercase tracking-[0.06em]' : 'label'}>{t.label}</span>
            <span
              className={`absolute bg-ember transition-transform duration-700 ease-[cubic-bezier(.16,1,.3,1)] ${
                vertical ? '-left-[var(--gutter)] top-1/2 h-px w-[calc(var(--gutter)-0.75rem)] origin-left -translate-y-1/2' : 'inset-x-0 -bottom-px h-[2px] origin-left'
              } ${on ? 'scale-x-100' : 'scale-x-0'}`}
            />
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
      gsap.fromTo(ref.current.querySelectorAll('[data-swap]'), { autoAlpha: 0, y: 22 }, { autoAlpha: 1, y: 0, duration: 0.9, stagger: 0.06, overwrite: true })
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

export function Bullets({ items, className = '', ...rest }) {
  return (
    <ul className={className} {...rest}>
      {items.map((t) => (
        <li key={t} className="flex gap-3 break-inside-avoid py-[0.28em]">
          <span className="mt-[0.72em] h-[3px] w-[3px] shrink-0 rounded-full bg-ember" />
          <span>{t}</span>
        </li>
      ))}
    </ul>
  )
}


export function Icon({ name, className = 'h-4 w-4' }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" strokeLinecap="round">
      <path d={ICON_PATHS[name]} />
    </svg>
  )
}
