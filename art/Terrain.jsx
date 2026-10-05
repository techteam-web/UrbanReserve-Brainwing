import { rng, f } from './rng'
import RIDGES from './ridges'

const LEN = 1000
const DEPTH = 100

// The brochure cover's torn edge. Each seed takes a different window of it, optionally mirrored.
function tear(seed, amp) {
  const r = rng(seed)
  const base = RIDGES[0]
  const span = 0.5 + r() * 0.5
  const start = r() * (1 - span)
  const flip = r() > 0.5
  const at = (s) => {
    const x = s * (base.length - 1)
    const i = Math.floor(x)
    return base[i] + (base[Math.min(i + 1, base.length - 1)] - base[i]) * (x - i)
  }
  const raw = []
  for (let t = 0; t <= LEN; t += 2) {
    const u = t / LEN
    raw.push(at(start + (flip ? 1 - u : u) * span))
  }
  const lo = Math.min(...raw)
  const hi = Math.max(...raw)
  // light 3-tap smoothing softens the stair-steps of the low-res source without losing the tear
  return raw.map((v, i) => {
    const s = ((raw[i - 1] ?? v) + v + (raw[i + 1] ?? v)) / 3
    const n = (s - lo) / (hi - lo || 1)
    return [i * 2, Math.min(DEPTH - 2, Math.max(2, DEPTH / 2 + (n - 0.5) * amp * 1.5))]
  })
}

// Soft rolling hills for landscape silhouettes (not a paper tear).
function hills(seed, amp) {
  const r = rng(seed)
  const waves = [0, 1, 2].map((i) => ({ k: (1.5 + r() * 2.5) * (i + 1), p: r() * Math.PI * 2, a: amp * (0.5 / (i + 1)) }))
  const slope = (r() - 0.5) * amp * 0.9
  const pts = []
  for (let t = 0; t <= LEN; t += 5) {
    const u = t / LEN
    let y = DEPTH * 0.5 + slope * (u - 0.5)
    for (const w of waves) y += Math.sin(u * w.k * Math.PI + w.p) * w.a
    pts.push([t, Math.min(DEPTH - 3, Math.max(3, y))])
  }
  return pts
}

const PATHS = {
  top: (p) => `M0 ${DEPTH}` + p.map(([t, y]) => `L${t} ${f(y)}`).join('') + `L${LEN} ${DEPTH}Z`,
  bottom: (p) => 'M0 0' + p.map(([t, y]) => `L${t} ${f(y)}`).join('') + `L${LEN} 0Z`,
  left: (p) => `M${DEPTH} 0` + p.map(([t, y]) => `L${f(y)} ${t}`).join('') + `L${DEPTH} ${LEN}Z`,
  right: (p) => 'M0 0' + p.map(([t, y]) => `L${f(y)} ${t}`).join('') + `L0 ${LEN}Z`,
}

// `side` is where the edge sits; the fill extends away from it.
export default function Terrain({ side = 'top', seed = 7, amp = 60, kind = 'tear', className = '', fill = 'currentColor' }) {
  const vertical = side === 'left' || side === 'right'
  const pts = kind === 'hills' ? hills(seed, amp) : tear(seed, amp)
  return (
    <svg
      viewBox={vertical ? `0 0 ${DEPTH} ${LEN}` : `0 0 ${LEN} ${DEPTH}`}
      preserveAspectRatio="none"
      className={`pointer-events-none block ${className}`}
      aria-hidden="true"
    >
      <path d={PATHS[side](pts)} fill={fill} />
    </svg>
  )
}
