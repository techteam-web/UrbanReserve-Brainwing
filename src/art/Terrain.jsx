import { f } from './rng'
import { tear, hills, LEN, DEPTH } from './edges'

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
