import { FLOOR_PLANS } from '../data/content'

// The typical floor's six homes (alike in both towers), and where each one's number sits: the middle
// of its outline.
const { viewBox, flats: FLATS } = FLOOR_PLANS[0]
const middleOf = (shape) => {
  const n = shape.split(/[\s,]+/).map(Number)
  const xs = n.filter((_, i) => i % 2 === 0)
  const ys = n.filter((_, i) => i % 2 === 1)
  return [(Math.min(...xs) + Math.max(...xs)) / 2, (Math.min(...ys) + Math.max(...ys)) / 2]
}
const MIDDLES = new Map(FLATS.map((f) => [f.id, middleOf(f.shape)]))

/**
 * Where a home sits on the floor: the six flats, numbered, with the `lit` ones filled. Given `onPick`
 * it is the unit finder's filter: each flat is a button that picks it, and the `dim` ones (no home
 * there fits the other filters) stand back and can't be picked.
 */
export default function KeyPlan({ lit = [], dim = [], onPick, label, className = '' }) {
  return (
    <svg viewBox={viewBox} role={onPick ? 'group' : 'img'} aria-label={label} className={`overflow-visible ${className}`}>
      {FLATS.map((f) => {
        const on = lit.includes(f.id)
        const off = !on && dim.includes(f.id)
        const [x, y] = MIDDLES.get(f.id)
        const fill = on
          ? 'fill-ember stroke-ember-deep'
          : off
            ? 'fill-forest-900/[0.03] stroke-forest-900/15'
            : `fill-forest-900/[0.07] stroke-forest-900/35 ${onPick ? 'group-hover/flat:fill-ember/35 group-hover/flat:stroke-ember-deep' : ''}`
        const art = (
          <>
            <polygon points={f.shape} vectorEffect="non-scaling-stroke" className={`stroke-1 transition-colors duration-300 ${fill}`} />
            <text x={x} y={y} textAnchor="middle" dominantBaseline="central" className={`pointer-events-none font-sans text-[68px] font-medium ${on ? 'fill-white' : off ? 'fill-forest-900/25' : 'fill-forest-900/65'}`}>
              {f.id}
            </text>
          </>
        )
        if (!onPick) return <g key={f.id}>{art}</g>
        const pick = () => !off && onPick(f.id)
        return (
          <g
            key={f.id}
            role="button"
            tabIndex={off ? -1 : 0}
            aria-pressed={on}
            aria-disabled={off}
            aria-label={`Flat ${f.id}`}
            onClick={pick}
            onKeyDown={(e) => {
              if (e.key !== 'Enter' && e.key !== ' ') return
              e.preventDefault()
              pick()
            }}
            className={`group/flat outline-none [&:focus-visible>polygon]:stroke-ember-deep [&:focus-visible>polygon]:stroke-[3] ${off ? 'cursor-not-allowed' : 'cursor-pointer'}`}
          >
            {art}
          </g>
        )
      })}
    </svg>
  )
}
