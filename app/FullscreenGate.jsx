import { useEffect, useState } from 'react'
import { fullscreenSupported as supported, isFullscreen as isFull, setCovered } from './gate'
import { Mark } from '../art/Brand'
import Botanical from '../art/Botanical'
import Terrain from '../art/Terrain'

const doc = document

function enter() {
  const el = doc.documentElement
  const req = el.requestFullscreen?.bind(el) ?? el.webkitRequestFullscreen?.bind(el)
  return Promise.resolve(req?.({ navigationUI: 'hide' })).catch(() => {})
}

/**
 * The app only runs in full screen. Screen intros wait behind this gate (see ./gate.js) so they
 * play once the visitor is in, and the gate returns whenever full screen is left.
 * Devices without the Fullscreen API (iPhone Safari) never see it.
 */
export default function FullscreenGate() {
  const [open, setOpen] = useState(() => supported() && !isFull())
  const [mounted, setMounted] = useState(open)

  useEffect(() => {
    const sync = () => {
      const show = supported() && !isFull()
      setOpen(show)
      if (show) setMounted(true)
    }
    doc.addEventListener('fullscreenchange', sync)
    doc.addEventListener('webkitfullscreenchange', sync)
    return () => {
      doc.removeEventListener('fullscreenchange', sync)
      doc.removeEventListener('webkitfullscreenchange', sync)
    }
  }, [])

  useEffect(() => setCovered('fullscreen', open), [open])

  useEffect(() => {
    if (!open) return
    const onKey = (e) => {
      e.preventDefault()
      e.stopImmediatePropagation()
      enter()
    }
    window.addEventListener('keydown', onKey, true)
    return () => window.removeEventListener('keydown', onKey, true)
  }, [open])

  if (!mounted) return null

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Enter full screen"
      onClick={enter}
      onTransitionEnd={(e) => e.target === e.currentTarget && !open && setMounted(false)}
      className={`gate fixed inset-0 z-90 flex cursor-pointer items-center justify-center overflow-hidden bg-forest-950 text-ivory transition-opacity duration-700 ${open ? 'opacity-100' : 'pointer-events-none opacity-0'}`}
    >
      <Terrain side="bottom" seed={17} amp={70} className="absolute inset-x-0 top-0 h-[12vh] w-full text-forest-900" />
      <Terrain side="top" seed={5} amp={70} className="absolute inset-x-0 bottom-0 h-[14vh] w-full text-forest-900" />
      <Botanical kind="fern" seed={3} depth={16} sway={0} className="bottom-[12vh] left-0 w-[22vw] min-w-36 text-gold/25" />
      <Botanical kind="umbel" seed={6} depth={-12} sway={0} className="right-0 top-[10vh] w-[13vw] min-w-24 text-gold/25" />

      <div className="gate-in relative flex flex-col items-center px-6 text-center">
        <div className="relative grid size-[clamp(6.5rem,15vh,9rem)] place-items-center">
          <svg viewBox="0 0 100 100" className="absolute inset-0 size-full -rotate-90 text-gold" aria-hidden="true">
            <circle cx="50" cy="50" r="48" fill="none" stroke="currentColor" strokeOpacity="0.2" strokeWidth="0.6" />
            <circle className="gate-ring" cx="50" cy="50" r="48" fill="none" stroke="currentColor" strokeWidth="0.8" pathLength="100" />
          </svg>
          <div className="w-[48%] text-gold">
            <Mark />
          </div>
        </div>

        <p className="eyebrow mt-[5vh] text-gold-lit">Urban Reserve</p>
        <h2 className="display mt-[2vh] text-[clamp(1.8rem,5vh,3.4rem)] font-normal">
          Best experienced
          <br />
          in full screen
        </h2>

        <span className="btn btn-solid mt-[5vh]">
          <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
            <path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" />
          </svg>
          Enter full screen
        </span>
        <p className="label mt-[3vh] text-ivory/50">Tap or click anywhere</p>
      </div>
    </div>
  )
}
