import { useCallback, useRef, useState } from 'react'
import { useNav } from '../app/nav'
import { useIntro, useTone } from '../hooks/useIntro'
import { RESIDENCES, INTERIORS } from '../data/content'
import { Tabs, Swap, Lightbox } from '../components/ui'
import Botanical from '../art/Botanical'
import Terrain from '../art/Terrain'

const TABS = [...RESIDENCES.map(({ id, label }) => ({ id, label })), { id: 'interiors', label: 'Interiors' }]

export default function Residences() {
  const root = useRef(null)
  const { go } = useNav()
  const [id, setId] = useState(RESIDENCES[0].id)
  const [photo, setPhoto] = useState(null)
  const close = useCallback(() => setPhoto(null), [])
  useTone('light')
  useIntro(root)

  const plan = RESIDENCES.find((r) => r.id === id)

  return (
    <section ref={root} className="screen bg-paper text-forest-900">
      <Botanical kind="monstera" seed={8} depth={12} className="right-0 top-0 w-[11vw] rotate-180 text-forest-700/12" />

      <div className="safe grid h-full gap-[4vh] pane lg:grid-cols-[minmax(14rem,21%)_1fr_minmax(14rem,21%)] lg:gap-[3vw]">
        <div className="flex flex-col justify-center">
          <p data-in className="eyebrow text-ember">Residences</p>
          <h2 data-in className="display mt-[2vh] text-[clamp(2rem,5.4vh,4rem)] text-forest-800">
            Homes designed
            <br />
            to breathe
          </h2>
          <p data-in className="copy mt-[2.5vh] text-ink/70">2 & 3 BHK-plus deck apartments with generous planted balconies and mesmerising city vistas.</p>
          <div data-in className="mt-[4vh]">
            <Tabs items={TABS} value={id} onChange={setId} vertical />
          </div>
        </div>

        <Swap id={id} className="relative min-h-[40vh] lg:min-h-0">
          {plan ? (
            <div data-swap data-mask className="absolute inset-0 pt-[3vh]">
              <Terrain side="top" seed={13} amp={55} className="absolute inset-x-0 top-0 h-[3.2vh] w-full text-white" />
              <div className="flex h-full items-center justify-center bg-white p-[2.5vh] shadow-[0_40px_60px_-50px_rgb(20_52_41/0.6)]">
                <img src={plan.plan} alt={plan.title} className="max-h-full max-w-full object-contain" />
              </div>
            </div>
          ) : (
            <div data-swap className="absolute inset-0 grid grid-cols-[1.25fr_1fr] grid-rows-2 gap-3">
              {INTERIORS.map((p, i) => (
                <button key={p.image} onClick={() => setPhoto(i)} className={`group relative overflow-hidden ${i === 0 ? 'row-span-2' : ''}`}>
                  <img src={p.image} alt={p.label} className="absolute inset-0 h-full w-full object-cover transition-transform duration-[1400ms] ease-[cubic-bezier(.16,1,.3,1)] group-hover:scale-105" />
                  <span className="label absolute bottom-3 left-3 bg-forest-950/60 px-3 py-1.5 text-ivory backdrop-blur-sm">{p.label}</span>
                </button>
              ))}
            </div>
          )}
        </Swap>

        <Swap id={id} className="flex flex-col justify-center">
          {plan ? (
            <>
              <div data-swap data-in className="flex items-end justify-between gap-4">
                <h3 className="display text-[clamp(1.4rem,3.4vh,2.2rem)] text-ember-deep">{plan.title}</h3>
                <img src={plan.key} alt="Key plan" className="w-[clamp(4rem,9vh,6.5rem)] shrink-0 mix-blend-multiply" />
              </div>
              <table data-swap data-in className="mt-[2.5vh] w-full text-[clamp(0.82rem,1.7vh,0.98rem)]">
                <tbody>
                  {plan.rooms.map(([room, size]) => (
                    <tr key={room} className="border-b border-forest-900/10">
                      <th className="py-[1vh] pr-4 text-left font-normal text-ink/65">{room}</th>
                      <td className="py-[1vh] text-right font-medium">{size}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div data-swap data-in className="mt-[4vh]">
                <button onClick={() => go('enquire')} className="btn btn-solid w-full">Request price</button>
              </div>
            </>
          ) : (
            <>
              <h3 data-swap className="display text-[clamp(1.4rem,3.4vh,2.2rem)] text-ember-deep">Interiors</h3>
              <p data-swap className="copy mt-[2vh] text-ink/70">Light-filled rooms in warm, natural finishes, framed by the city and the forest beyond.</p>
              <ul data-swap className="mt-[3vh] space-y-2">
                {INTERIORS.map((p, i) => (
                  <li key={p.label}>
                    <button onClick={() => setPhoto(i)} className="flex w-full items-baseline gap-3 border-b border-forest-900/10 py-2 text-left hover:text-ember-deep">
                      <span className="font-display text-sm text-ember">{String(i + 1).padStart(2, '0')}</span>
                      {p.label}
                    </button>
                  </li>
                ))}
              </ul>
            </>
          )}
        </Swap>
      </div>

      {photo != null && <Lightbox photos={INTERIORS} index={photo} onClose={close} />}
    </section>
  )
}
