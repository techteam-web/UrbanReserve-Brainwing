import { useCallback, useRef, useState } from 'react'
import { useNav } from '../app/nav'
import { useIntro, useTone } from '../hooks/useIntro'
import { RESIDENCES, INTERIORS } from '../data/content'
import { Swap, Lightbox, Icon, Segmented } from '../components/ui'
import ZoomPan, { Pin } from '../components/ZoomPan'
import Botanical from '../art/Botanical'

const TYPES = RESIDENCES.map(({ id, label }) => ({ id, label }))

function Plan({ plan, room, onRoom, className = '' }) {
  return (
    <ZoomPan key={plan.id} src={plan.plan} alt={plan.title} aspect={plan.aspect} className={`rounded-[1.25rem] bg-white shadow-[0_40px_60px_-50px_rgb(20_52_41/0.6)] ${className}`}>
      {plan.rooms.map(([name, , u, v], i) => (
        <Pin key={name} u={u} v={v} label={name} active={room === i} onClick={() => onRoom(i)} />
      ))}
    </ZoomPan>
  )
}

function Explore({ plan, onEnquire }) {
  const [room, setRoom] = useState(null)
  const zp = useRef(null)

  const pick = (i) => {
    if (room === i) {
      setRoom(null)
      zp.current?.reset()
      return
    }
    setRoom(i)
    const [, , u, v] = plan.rooms[i]
    zp.current?.focus(u, v, 1.9)
  }

  return (
    <>
      <div data-swap data-mask className="relative min-h-[46vh] lg:min-h-0">
        <ZoomPan ref={zp} key={plan.id} src={plan.plan} alt={plan.title} aspect={plan.aspect} className="absolute inset-0 rounded-[1.25rem] bg-white shadow-[0_40px_60px_-50px_rgb(20_52_41/0.6)]">
          {plan.rooms.map(([name, , u, v], i) => (
            <Pin key={name} u={u} v={v} label={name} active={room === i} onClick={() => pick(i)} />
          ))}
        </ZoomPan>
        <p className="label pointer-events-none absolute left-4 top-4 rounded-full bg-forest-950/80 px-4 py-2 text-[max(0.58rem,9px)] text-ivory backdrop-blur">Pinch to zoom · tap a room</p>
      </div>

      <div className="flex min-h-0 flex-col justify-center">
        <div data-swap data-in className="flex items-end justify-between gap-4">
          <h3 className="display text-[clamp(1.4rem,3.4vh,2.2rem)] text-ember-deep">{plan.label}</h3>
          <img src={plan.key} alt="Key plan" className="w-[clamp(4rem,9vh,6.5rem)] shrink-0 mix-blend-multiply" />
        </div>
        <ul data-swap data-in className="mt-[2vh] text-[clamp(0.82rem,1.7vh,0.98rem)]">
          {plan.rooms.map(([name, size], i) => (
            <li key={name}>
              <button
                onClick={() => pick(i)}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-[1.05vh] text-left transition-colors duration-300 active:scale-[0.98] ${room === i ? 'bg-ember text-white' : 'hover:bg-forest-900/5'}`}
              >
                <span className={`size-2 shrink-0 rounded-full ${room === i ? 'bg-white' : 'bg-ember/70'}`} />
                <span className={`flex-1 ${room === i ? '' : 'text-ink/70'}`}>{name}</span>
                <span className="font-medium">{size}</span>
              </button>
            </li>
          ))}
        </ul>
        <div data-swap data-in className="mt-[3.5vh]">
          <button onClick={onEnquire} className="btn btn-solid w-full active:scale-[0.98]">Request price</button>
        </div>
      </div>
    </>
  )
}

function Compare({ a, setA, b, setB }) {
  const A = RESIDENCES.find((r) => r.id === a)
  const B = RESIDENCES.find((r) => r.id === b)
  const [room, setRoom] = useState(null)
  // rooms share names and order across layouts, so one pick highlights it on both plans
  const pick = (i) => setRoom(room === i ? null : i)
  return (
    <>
      <div data-swap data-mask className="grid min-h-[60vh] grid-cols-2 gap-3 lg:min-h-0">
        {[
          [A, setA, b],
          [B, setB, a],
        ].map(([p, setP, other], k) => (
          <div key={k} className="flex min-h-0 flex-col gap-2">
            <Segmented items={TYPES.filter((t) => t.id !== other)} value={p.id} onChange={setP} size="sm" />
            <Plan plan={p} room={room} onRoom={pick} className="relative min-h-0 flex-1" />
          </div>
        ))}
      </div>

      <div className="flex min-h-0 flex-col justify-center">
        <h3 data-swap data-in className="display text-[clamp(1.4rem,3.4vh,2.2rem)] text-ember-deep">Side by side</h3>
        <table data-swap data-in className="mt-[2vh] w-full text-[clamp(0.78rem,1.6vh,0.95rem)]">
          <thead>
            <tr className="label text-[max(0.58rem,9px)] text-ink/55">
              <th className="pb-2 text-left font-medium">Room</th>
              <th className="pb-2 text-right font-medium">{A.label}</th>
              <th className="pb-2 text-right font-medium">{B.label}</th>
            </tr>
          </thead>
          <tbody>
            {A.rooms.map(([name, size], i) => {
              const other = B.rooms.find((r) => r[0] === name)?.[1] ?? '—'
              const diff = other !== size
              return (
                <tr key={name} onClick={() => pick(i)} className={`cursor-pointer border-t border-forest-900/10 transition-colors ${room === i ? 'bg-ember/10' : ''}`}>
                  <th className="py-[0.95vh] pr-2 text-left font-normal text-ink/70">
                    <span className="flex items-center gap-2">
                      {diff && <span className="size-1.5 rounded-full bg-ember" />}
                      {name}
                    </span>
                  </th>
                  <td className={`py-[0.95vh] text-right ${diff ? 'font-medium text-ember-deep' : ''}`}>{size}</td>
                  <td className={`py-[0.95vh] pl-3 text-right ${diff ? 'font-medium text-ember-deep' : ''}`}>{other}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
        <p data-swap data-in className="mt-[2vh] flex items-center gap-2 text-[clamp(0.75rem,1.5vh,0.88rem)] text-ink/60">
          <span className="size-1.5 rounded-full bg-ember" /> Differs between the two layouts
        </p>
      </div>
    </>
  )
}

export default function Residences() {
  const root = useRef(null)
  const { go } = useNav()
  const [id, setId] = useState(RESIDENCES[0].id)
  const [mode, setMode] = useState('plan') // plan | compare | interiors
  const [other, setOther] = useState(RESIDENCES[1].id)
  const [photo, setPhoto] = useState(null)
  const close = useCallback(() => setPhoto(null), [])
  useTone('light')
  useIntro(root)

  const plan = RESIDENCES.find((r) => r.id === id)
  const setA = (v) => {
    if (v === other) setOther(id)
    setId(v)
  }

  return (
    <section ref={root} className="screen bg-paper text-forest-900">
      <Botanical kind="monstera" seed={8} depth={12} className="right-0 top-0 w-[11vw] rotate-180 text-forest-700/12" />

      <div className="safe pane h-full">
        <div className="grid min-h-full gap-[3vh] lg:h-full lg:grid-cols-[minmax(15rem,22%)_1fr_minmax(15rem,22%)] lg:gap-[2.5vw]">
          <div className="flex flex-col justify-center">
            <p data-in className="eyebrow text-ember">Residences</p>
            <h2 data-in className="display mt-[1.5vh] text-[clamp(1.9rem,5vh,3.7rem)] text-forest-800">
              Homes designed
              <br />
              to breathe
            </h2>

            <div data-in className="mt-[3.5vh] space-y-2">
              {RESIDENCES.map((r) => {
                const on = mode !== 'interiors' && id === r.id
                return (
                  <button
                    key={r.id}
                    onClick={() => {
                      setA(r.id)
                      if (mode === 'interiors') setMode('plan')
                    }}
                    className={`flex w-full items-center gap-4 rounded-2xl border px-4 py-[1.4vh] text-left transition-all duration-300 active:scale-[0.98] ${
                      on ? 'border-forest-900 bg-forest-900 text-ivory shadow-lg' : 'border-forest-900/15 bg-white/50 hover:border-forest-900/40'
                    }`}
                  >
                    <span className={`grid size-10 shrink-0 place-items-center rounded-xl ${on ? 'bg-ivory/10 text-gold-lit' : 'bg-forest-900/5 text-ember'}`}>
                      <Icon name="plan" className="size-5" />
                    </span>
                    <span className="flex-1">
                      <span className="block font-display text-[clamp(1.1rem,2.4vh,1.5rem)] uppercase tracking-[0.04em]">{r.label}</span>
                      <span className={`block text-[max(0.7rem,10px)] ${on ? 'text-ivory/60' : 'text-ink/50'}`}>{r.rooms.length} spaces · planted balcony</span>
                    </span>
                  </button>
                )
              })}
            </div>

            <div data-in className="mt-[2.5vh] grid grid-cols-2 gap-2">
              <button
                onClick={() => setMode(mode === 'compare' ? 'plan' : 'compare')}
                className={`label flex items-center justify-center gap-2 rounded-full border px-3 py-3 transition-colors active:scale-95 ${mode === 'compare' ? 'border-ember bg-ember text-white' : 'border-forest-900/20 hover:border-forest-900/50'}`}
              >
                <Icon name="compare" className="size-4" /> Compare
              </button>
              <button
                onClick={() => setMode(mode === 'interiors' ? 'plan' : 'interiors')}
                className={`label flex items-center justify-center gap-2 rounded-full border px-3 py-3 transition-colors active:scale-95 ${mode === 'interiors' ? 'border-ember bg-ember text-white' : 'border-forest-900/20 hover:border-forest-900/50'}`}
              >
                <Icon name="spark" className="size-4" /> Interiors
              </button>
            </div>
          </div>

          <Swap id={`${mode}-${mode === 'interiors' ? '' : id}`} className="contents">
            {mode === 'plan' && <Explore key={plan.id} plan={plan} onEnquire={() => go('enquire')} />}
            {mode === 'compare' && <Compare a={id} setA={setA} b={other} setB={setOther} />}
            {mode === 'interiors' && (
              <>
                <div data-swap className="grid min-h-[50vh] grid-cols-[1.25fr_1fr] grid-rows-2 gap-3 lg:min-h-0">
                  {INTERIORS.map((p, i) => (
                    <button key={p.image} onClick={() => setPhoto(i)} className={`group relative overflow-hidden rounded-[1.25rem] active:scale-[0.98] ${i === 0 ? 'row-span-2' : ''}`}>
                      <img src={p.image} alt={p.label} className="absolute inset-0 h-full w-full object-cover transition-transform duration-[1400ms] ease-[cubic-bezier(.16,1,.3,1)] group-hover:scale-105" />
                      <span className="label absolute bottom-3 left-3 rounded-full bg-forest-950/60 px-3 py-1.5 text-ivory backdrop-blur-sm">{p.label}</span>
                    </button>
                  ))}
                </div>
                <div data-swap className="flex flex-col justify-center">
                  <h3 className="display text-[clamp(1.4rem,3.4vh,2.2rem)] text-ember-deep">Interiors</h3>
                  <p className="copy mt-[2vh] text-ink/70">Light-filled rooms in warm, natural finishes, framed by the city and the forest beyond.</p>
                  <p className="label mt-[3vh] text-ink/45">Tap a photo to view it full screen</p>
                </div>
              </>
            )}
          </Swap>
        </div>
      </div>

      {photo != null && <Lightbox photos={INTERIORS} index={photo} onClose={close} />}
    </section>
  )
}
