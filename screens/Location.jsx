import { useRef } from 'react'
import { useIntro, useTone } from '../hooks/useIntro'
import { LOCATION } from '../data/content'
import { Mark } from '../art/Brand'
import Botanical from '../art/Botanical'
import Terrain from '../art/Terrain'
import { Icon } from '../components/ui'
import ICON_PATHS from '../components/iconPaths'


const VB = [1000, 760]
const O = [965, 735]
const RADII = [250, 470, 690]
const rad = (d) => (d * Math.PI) / 180
const pt = (r, deg) => [O[0] + r * Math.cos(rad(deg)), O[1] + r * Math.sin(rad(deg))]
const arc = (r) => `M${O[0] - r} ${O[1]}A${r} ${r} 0 0 1 ${O[0]} ${O[1] - r}`

function wrap(name, max = 17) {
  const words = name.split(' ')
  const lines = ['']
  for (const w of words) {
    const cur = lines[lines.length - 1]
    if (cur && (cur + ' ' + w).length > max) lines.push(w)
    else lines[lines.length - 1] = cur ? `${cur} ${w}` : w
  }
  return lines
}

function Rings() {
  return (
    <svg viewBox={`0 0 ${VB[0]} ${VB[1]}`} preserveAspectRatio="xMaxYMax meet" className="h-full w-full overflow-visible" aria-label="Travel times from Urban Reserve">
      {/* DrawSVG owns stroke-dasharray, so the dotted rings are revealed through a drawn mask */}
      <defs>
        <mask id="ring-reveal" maskUnits="userSpaceOnUse">
          <g data-draw fill="none" stroke="#fff" strokeWidth="14">
            {RADII.map((r) => (
              <path key={r} d={arc(r)} />
            ))}
          </g>
        </mask>
      </defs>
      <g mask="url(#ring-reveal)" fill="none" stroke="currentColor" className="text-forest-700/80" strokeWidth="3.2" strokeDasharray="0.1 13" strokeLinecap="round">
        {RADII.map((r) => (
          <path key={r} d={arc(r)} />
        ))}
      </g>

      {LOCATION.rings.map((ring, k) => {
        const r = RADII[k]
        const n = ring.places.length
        return (
          <g key={ring.mins}>
            <g data-in>
              <text x={O[0] - 16} y={O[1] - r - 14} textAnchor="end" className="fill-ember font-display" fontSize="30" fontStyle="italic">
                {ring.mins} mins
              </text>
            </g>
            {ring.places.map((p, i) => {
              const deg = n === 1 ? 226 : 196 + (60 * i) / (n - 1)
              const [x, y] = pt(r, deg)
              const lines = wrap(p.name)
              return (
                <g key={p.name} data-in>
                  <circle cx={x} cy={y} r="25" className="fill-sand" />
                  <g transform={`translate(${x - 13} ${y - 13}) scale(1.08)`} fill="none" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                    <path d={ICON_PATHS[p.type]} />
                  </g>
                  <text x={x} y={y + 50} textAnchor="middle" className="fill-forest-900 font-sans" fontSize="17" fontWeight="500">
                    {lines.map((l, j) => (
                      <tspan key={l} x={x} dy={j ? 20 : 0}>
                        {l}
                      </tspan>
                    ))}
                  </text>
                </g>
              )
            })}
          </g>
        )
      })}

      <g data-in>
        <circle cx={O[0]} cy={O[1]} r="78" className="fill-forest-900" />
        <foreignObject x={O[0] - 40} y={O[1] - 45} width="80" height="90">
          <div className="text-gold">
            <Mark />
          </div>
        </foreignObject>
      </g>
    </svg>
  )
}

export default function Location() {
  const root = useRef(null)
  useTone(['light', 'dark'])
  useIntro(root)

  return (
    <section ref={root} className="screen grid bg-paper text-forest-900 lg:grid-cols-[1.25fr_1fr]">
      <div className="relative min-h-0 overflow-hidden">
        <Botanical kind="fern" seed={9} depth={-10} className="bottom-[8vh] left-0 w-[17vw] text-gold-deep/15" />
        <div className="safe pane flex h-full flex-col lg:pr-[4vw]">
          <p data-in className="eyebrow text-ember">Location Advantage</p>
          <h2 data-in className="display mt-[1.5vh] text-[clamp(1.9rem,5.2vh,3.9rem)] text-forest-800">{LOCATION.heading}</h2>
          <p data-in className="copy mt-[2vh] max-w-xl text-ink/70">{LOCATION.body}</p>
          <div className="relative mt-[2vh] hidden min-h-0 flex-1 lg:block">
            <Rings />
          </div>
          <ol className="mt-6 space-y-6 lg:hidden">
            {LOCATION.rings.map((ring) => (
              <li key={ring.mins} data-in className="border-t border-forest-900/15 pt-4">
                <p className="font-display text-2xl italic text-ember">{ring.mins} mins</p>
                <ul className="mt-3 grid gap-3 sm:grid-cols-2">
                  {ring.places.map((p) => (
                    <li key={p.name} className="flex items-center gap-3 text-sm text-forest-900">
                      <span className="grid size-8 shrink-0 place-items-center rounded-full bg-sand text-white">
                        <Icon name={p.type} />
                      </span>
                      {p.name}
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ol>
        </div>
      </div>

      <div data-mask className="relative hidden overflow-hidden bg-forest-800 lg:block">
        <img src={LOCATION.map} alt="Map of landmarks around Urban Reserve" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-linear-to-t from-forest-950/40 to-transparent" />
        <Terrain side="right" seed={83} amp={60} className="absolute inset-y-0 left-0 h-full w-[2.6vw] text-paper" />
        <p className="label absolute bottom-(--chrome-bot) left-[4vw] text-ivory/70">Map not to scale</p>
      </div>
    </section>
  )
}
