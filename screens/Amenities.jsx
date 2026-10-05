import { useCallback, useRef, useState } from 'react'
import { useIntro, useTone } from '../hooks/useIntro'
import { AMENITY_LEVELS } from '../data/content'
import { Tabs, Swap, Lightbox, Bullets } from '../components/ui'
import Botanical from '../art/Botanical'
import Terrain from '../art/Terrain'

function Thumb({ photo, onOpen, className = '' }) {
  return (
    <button onClick={onOpen} className={`group relative overflow-hidden bg-forest-800 ${className}`} aria-label={`View ${photo.label}`}>
      <img src={photo.image} alt={photo.label} className="absolute inset-0 h-full w-full object-cover transition-transform duration-[1400ms] ease-[cubic-bezier(.16,1,.3,1)] group-hover:scale-110" />
      <span className="absolute inset-0 bg-forest-950/0 transition-colors duration-500 group-hover:bg-forest-950/25" />
      <span className="label absolute bottom-2 left-2 translate-y-2 bg-forest-950/70 px-2 py-1 text-[max(0.58rem,9px)] text-ivory opacity-0 transition-all duration-500 group-hover:translate-y-0 group-hover:opacity-100">
        {photo.label}
      </span>
    </button>
  )
}

export default function Amenities() {
  const root = useRef(null)
  const [id, setId] = useState(AMENITY_LEVELS[0].id)
  const [photo, setPhoto] = useState(null)
  const close = useCallback(() => setPhoto(null), [])
  useTone('dark')
  useIntro(root)

  const lvl = AMENITY_LEVELS.find((l) => l.id === id)
  const small = 'text-[clamp(0.78rem,1.65vh,0.95rem)]'

  return (
    <section ref={root} className="screen bg-forest-900 text-ivory">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_12%_18%,rgb(63_111_98/0.35),transparent_55%)]" />
      <Botanical kind="monstera" seed={21} depth={16} className="bottom-0 left-0 w-[10vw] text-gold/15" />

      <div className="safe relative grid h-full gap-[4vh] pane lg:grid-cols-[minmax(20rem,35%)_1fr] lg:gap-[3.5vw]">
        <div className="flex flex-col justify-center-safe lg:min-h-0">
          <p data-in className="eyebrow text-gold-lit">Amenities</p>
          <div data-in className="mt-[2.5vh]">
            <Tabs items={AMENITY_LEVELS} value={id} onChange={setId} />
          </div>
          <Swap id={id} className="mt-[3vh]">
            <p data-swap data-in className="label text-ember">{lvl.tagline}</p>
            <h2 data-swap data-in className="display mt-[1.2vh] text-[clamp(1.7rem,4.6vh,3.3rem)] font-normal text-gold-lit">{lvl.heading}</h2>
            <p data-swap data-in className={`mt-[2vh] leading-relaxed text-ivory/75 ${small}`}>{lvl.body}</p>
            {lvl.list ? (
              <Bullets data-swap data-in items={lvl.list} className={`mt-[2.5vh] columns-2 gap-6 text-ivory/90 ${small}`} />
            ) : (
              <div data-swap data-in className="mt-[2.5vh] grid grid-cols-2 gap-6">
                {lvl.groups.slice(0, 2).map((g) => (
                  <div key={g.title}>
                    <h3 className="font-display text-[clamp(1.05rem,2.3vh,1.4rem)] text-gold-lit">{g.title}</h3>
                    <Bullets items={g.items} className={`mt-2 text-ivory/90 ${small}`} />
                  </div>
                ))}
              </div>
            )}
            {lvl.plan && (
              <div data-swap data-in className="mt-[3vh] grid grid-cols-4 gap-2">
                {lvl.photos.map((p, i) => (
                  <Thumb key={p.image} photo={p} onOpen={() => setPhoto(i)} className="aspect-[4/3]" />
                ))}
              </div>
            )}
          </Swap>
        </div>

        <Swap id={id} className="relative min-h-[45vh] lg:min-h-0">
          {lvl.plan ? (
            <div data-swap data-mask className="absolute inset-0 pt-[3.4vh]">
              <Terrain side="top" seed={id === 'ground' ? 61 : 67} amp={60} className="absolute inset-x-0 top-0 h-[3.6vh] w-full text-paper" />
              <div className="flex h-full items-center justify-center bg-paper p-[2vh]">
                <img src={lvl.plan} alt={`${lvl.label} plan`} className="max-h-full max-w-full object-contain mix-blend-multiply" />
              </div>
            </div>
          ) : (
            <div data-swap className="absolute inset-0 grid grid-cols-[1fr_1fr_1.15fr] grid-rows-[1fr_auto] gap-3">
              <Thumb photo={lvl.photos[1]} onOpen={() => setPhoto(1)} />
              <Thumb photo={lvl.photos[2]} onOpen={() => setPhoto(2)} />
              <Thumb photo={lvl.photos[0]} onOpen={() => setPhoto(0)} className="row-span-2" />
              <div className="relative col-span-2 bg-paper p-[2.4vh] text-forest-900">
                <Terrain side="top" seed={71} amp={55} className="absolute inset-x-0 -top-[2.4vh] h-[2.5vh] w-full text-paper" />
                <h3 className="font-display text-[clamp(1.05rem,2.3vh,1.4rem)] text-ember-deep">{lvl.groups[2].title}</h3>
                <Bullets items={lvl.groups[2].items} className={`mt-2 columns-3 gap-5 text-ink/80 ${small}`} />
              </div>
            </div>
          )}
        </Swap>
      </div>

      {photo != null && <Lightbox photos={lvl.photos} index={photo} onClose={close} />}
    </section>
  )
}
