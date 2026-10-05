import { useId, useRef } from 'react'
import { gsap, useGSAP, reduced, lite } from '../gsap/gsapConfig'
import { rng } from './rng'
import { holdIntro } from '../app/gate'

const BODY = 'M8 34C30 30 60 30 96 21C84 29 64 36 44 38C30 39 18 38 8 34Z'
const WING = 'M42 34C36 22 22 9 2 2C20 5 40 13 60 31C54 33 48 34 42 34Z'
const ROOT = '50 33'
// A baked relief shadow is a copy of the bird offset down-right; a live CSS drop-shadow would
// be re-filtered on every wing beat.
const SHADOW = [1.2, 2.4]
const SHADOW_ROOT = `${50 + SHADOW[0]} ${33 + SHADOW[1]}`

// Positions sampled from the brochure's breaker page (x%, y%, width%, depth).
const FLOCK = [
  [82.6, 8.3, 8.5, 34],
  [93, 14.6, 7.5, 40],
  [83.7, 20.6, 9, 30],
  [65.2, 22.8, 10, 24],
  [59.8, 29.3, 11, 20],
  [32.6, 22.4, 10.5, 22],
  [46.7, 34.8, 11, 18],
  [17.4, 40.2, 11.5, 26],
  [22.8, 55.4, 11, 16],
  [9.8, 63.7, 9.5, 30],
]

export default function SunBirds({ className = '', autoplay = true }) {
  const root = useRef(null)
  const gid = `foil${useId().replace(/:/g, '')}`

  useGSAP(
    () => {
      if (reduced()) return
      const r = rng(9)
      // the foil shimmer repaints every bird each frame, so it is desktop-only
      if (!lite()) gsap.to(`#${gid}`, { attr: { gradientTransform: 'translate(0.6 0)' }, duration: 5, ease: 'sine.inOut', yoyo: true, repeat: -1 })
      gsap.utils.toArray('[data-bird]', root.current).forEach((b, i) => {
        gsap.to(b.querySelectorAll('[data-wing]'), {
          scaleY: 0.3,
          svgOrigin: (k, el) => (el.closest('[data-shadow]') ? SHADOW_ROOT : ROOT),
          duration: 0.5 + r() * 0.3,
          ease: 'sine.inOut',
          yoyo: true,
          repeat: -1,
          repeatDelay: r() * 1.2,
          delay: r(),
        })
        gsap.to(b, {
          y: `+=${4 + r() * 6}`,
          x: `+=${3 + r() * 5}`,
          rotation: `+=${2 + r() * 3}`,
          duration: 2.6 + r() * 2,
          ease: 'sine.inOut',
          yoyo: true,
          repeat: -1,
          delay: i * 0.13,
        })
      })
      if (autoplay) {
        holdIntro(
          gsap
            .timeline({ delay: 0.25 })
            .from('[data-sun]', { scale: 0.86, autoAlpha: 0, duration: 1.8 })
            .from('[data-flight]', { x: -90, y: 60, autoAlpha: 0, duration: 2.2, stagger: 0.09, ease: 'power3.out' }, 0.25),
        )
      }
    },
    { scope: root },
  )

  return (
    <div ref={root} className={`relative aspect-square ${className}`} aria-hidden="true">
      <svg width="0" height="0" className="absolute">
        <defs>
          <linearGradient id={gid} x1="0" y1="0" x2="1" y2="1" spreadMethod="reflect" gradientTransform="translate(-0.4 0)">
            <stop offset="0" stopColor="#7d5a1f" />
            <stop offset="0.22" stopColor="#d6ae5a" />
            <stop offset="0.42" stopColor="#fbeab2" />
            <stop offset="0.6" stopColor="#c8973b" />
            <stop offset="0.8" stopColor="#f0d488" />
            <stop offset="1" stopColor="#8a6a2a" />
          </linearGradient>
        </defs>
      </svg>

      <div className="drift absolute left-[13.4%] top-[9.1%] w-[74%]" style={{ '--d': 8 }}>
        <div
          data-sun
          className="relative aspect-square rounded-full will-change-transform"
          style={{
            backgroundImage: 'url(/assets/img/sun-felt.webp)',
            backgroundSize: '36%',
            boxShadow: '0 50px 80px -40px rgb(140 45 10 / 0.6), 0 14px 30px -14px rgb(110 35 8 / 0.45)',
          }}
        >
          <div
            className="absolute inset-0 rounded-full"
            style={{
              background:
                'radial-gradient(circle at 32% 26%, rgb(255 196 150 / 0.3), transparent 52%), radial-gradient(circle at 72% 80%, rgb(90 18 0 / 0.38), transparent 62%)',
              boxShadow: 'inset 0 -16px 40px rgb(80 20 0 / 0.35), inset 0 8px 18px rgb(255 214 176 / 0.2)',
            }}
          />
        </div>
      </div>

      {FLOCK.map(([x, y, w, d], i) => (
        <div key={i} className="drift absolute" style={{ left: `${x}%`, top: `${y}%`, width: `${w * 1.35}%`, '--d': d }}>
          <div data-flight className="will-change-transform">
            <svg data-bird viewBox="0 0 100 44" className="block w-full -translate-x-1/2 -translate-y-1/2 overflow-visible">
              <g data-shadow transform={`translate(${SHADOW.join(' ')})`} fill="rgb(70 25 0 / 0.4)">
                <g transform="rotate(-10 50 30)">
                  <path d={BODY} />
                  <path data-wing d={WING} />
                </g>
              </g>
              <g transform="rotate(-10 50 30)" fill={`url(#${gid})`}>
                <path d={BODY} />
                <path data-wing d={WING} />
              </g>
            </svg>
          </div>
        </div>
      ))}
    </div>
  )
}
