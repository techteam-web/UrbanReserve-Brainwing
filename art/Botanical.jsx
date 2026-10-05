import { useRef } from 'react'
import { gsap, useGSAP, reduced, lite } from '../gsap/gsapConfig'
import { rng } from './rng'
import ART from './botanicalPaths'

// Pivot for the idle sway: where each traced drawing's stem leaves the brochure page.
const ORIGIN = {
  fern: '0% 22%',
  umbel: '96% 100%',
  star: '50% 100%',
  monstera: '0% 85%',
  leaf: '55% 100%',
  seed: '4% 100%',
}

/**
 * Line art vectorised from the brochure (scripts/trace-botanicals.mjs).
 * The screen intro draws its outline (`data-draw`), then fills it (`data-fill`); touch devices
 * skip the outline pass. The sway rotates a composited HTML layer so the complex path is
 * rasterised once rather than every frame.
 */
export default function Botanical({ kind, seed = 1, depth = 14, sway = 2, className = '' }) {
  const layer = useRef(null)
  const { w, h, d } = ART[kind]
  const drawn = !lite()

  useGSAP(() => {
    if (!sway || reduced()) return
    const r = rng(seed * 31)
    gsap.fromTo(
      layer.current,
      { rotation: -sway * 0.5 },
      {
        rotation: sway * 0.5,
        transformOrigin: ORIGIN[kind],
        duration: 4.5 + r() * 2.5,
        ease: 'sine.inOut',
        yoyo: true,
        repeat: -1,
        delay: -r() * 4,
      },
    )
  })

  return (
    <div className={`drift pointer-events-none absolute ${className}`} style={{ '--d': depth }} aria-hidden="true">
      <div ref={layer} className="will-change-transform">
        <svg viewBox={`0 0 ${w} ${h}`} className="block h-auto w-full overflow-visible">
          <path data-fill d={d} fill="currentColor" fillRule="evenodd" />
          {drawn && (
            <g data-draw fill="none" stroke="currentColor" strokeWidth={w / 520} strokeLinejoin="round">
              <path d={d} />
            </g>
          )}
        </svg>
      </div>
    </div>
  )
}
