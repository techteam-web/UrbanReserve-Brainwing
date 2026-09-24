import { useCallback, useRef, useState } from 'react'
import { useIntro, useTone } from '../hooks/useIntro'
import { AMENITY_LEVELS } from '../data/content'
import { Segmented, Swap, Lightbox, Icon } from '../components/ui'
import ZoomPan, { Pin } from '../components/ZoomPan'
import Botanical from '../art/Botanical'

function Thumb({ photo, onOpen, className = '' }) {
  return (
    <button onClick={onOpen} className={`group relative overflow-hidden rounded-[1.25rem] bg-forest-800 active:scale-[0.98] ${className}`} aria-label={`View ${photo.label}`}>
      <img src={photo.image} alt={photo.label} className="absolute inset-0 h-full w-full object-cover transition-transform duration-[1400ms] ease-[cubic-bezier(.16,1,.3,1)] group-hover:scale-110" />
      <span className="label absolute bottom-3 left-3 rounded-full bg-forest-950/70 px-3 py-1.5 text-[max(0.58rem,9px)] text-ivory backdrop-blur-sm">{photo.label}</span>
    </button>
  )
}

function Chip({ on, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 rounded-full border px-3.5 py-2 text-left text-[clamp(0.75rem,1.55vh,0.9rem)] transition-colors duration-300 active:scale-95 ${
        on ? 'border-gold bg-gold text-forest-950' : 'border-ivory/20 text-ivory/85 hover:border-ivory/50'
      }`}
    >
      {children}
    </button>
  )
}

// Ground level and E-Deck: the plan is the interface; picking an amenity flies to it.
function Level({ lvl, onPhoto }) {
  const zp = useRef(null)
  const [spot, setSpot] = useState(null)
  const s = spot != null ? lvl.spots[spot] : null

  const pick = (i) => {
    if (spot === i) {
      setSpot(null)
      zp.current?.reset()
      return
    }
    setSpot(i)
    zp.current?.focus(...lvl.spots[i].at, 2)
  }

  return (
    <>
      <div data-swap data-in className="mt-[2.5vh] flex flex-wrap gap-2">
        {lvl.spots.map((sp, i) => (
          <Chip key={sp.name} on={spot === i} onClick={() => pick(i)}>
            {sp.name}
            {sp.photo != null && <Icon name="spark" className="size-3.5 opacity-60" />}
          </Chip>
        ))}
      </div>
      <button data-swap data-in onClick={() => onPhoto(0)} className="label mt-[2.5vh] flex w-fit items-center gap-2 text-gold-lit active:scale-95">
        <Icon name="arrow" className="size-4" /> Photo gallery · {lvl.photos.length}
      </button>

      <div data-swap data-mask className="relative min-h-[50vh] lg:absolute lg:inset-y-0 lg:left-[calc(30%+2.5vw)] lg:right-0 lg:min-h-0">
        <ZoomPan ref={zp} src={lvl.plan} alt={`${lvl.label} plan`} aspect={lvl.aspect} className="absolute inset-0 rounded-[1.25rem] bg-paper" imgClassName="mix-blend-multiply">
          {lvl.spots.map((sp, i) => (
            <Pin key={sp.name} u={sp.at[0]} v={sp.at[1]} label={sp.name} active={spot === i} onClick={() => pick(i)} quiet />
          ))}
        </ZoomPan>
        {s && (
          <div key={s.name} className="card-in absolute bottom-3 left-3 flex max-w-[min(26rem,80%)] items-center gap-3 rounded-2xl bg-forest-950/90 p-2 pr-5 text-ivory shadow-2xl backdrop-blur-md">
            {s.photo != null ? (
              <button onClick={() => onPhoto(s.photo)} className="relative size-20 shrink-0 overflow-hidden rounded-xl active:scale-95" aria-label={`View ${s.name} photo`}>
                <img src={lvl.photos[s.photo].image} alt="" className="h-full w-full object-cover" />
              </button>
            ) : (
              <span className="grid size-14 shrink-0 place-items-center rounded-xl bg-ivory/10 text-gold-lit">
                <Icon name="pin" className="size-6" />
              </span>
            )}
            <span>
              <span className="label block text-[max(0.58rem,9px)] text-gold-lit">{lvl.label}</span>
              <span className="mt-1 block font-display text-[clamp(1.1rem,2.4vh,1.5rem)] leading-tight">{s.name}</span>
              {s.photo != null && <span className="mt-0.5 block text-xs text-ivory/60">Tap the photo to enlarge</span>}
            </span>
          </div>
        )}
      </div>
    </>
  )
}

function Common({ lvl, onPhoto }) {
  const [g, setG] = useState(0)
  return (
    <>
      <div data-swap data-in className="mt-[2.5vh] flex flex-wrap gap-2">
        {lvl.groups.map((grp, i) => (
          <Chip key={grp.title} on={g === i} onClick={() => setG(i)}>
            <Icon name={grp.icon} className="size-4" />
            {grp.title}
          </Chip>
        ))}
      </div>
      <ul data-swap data-in className="mt-[2.5vh] grid grid-cols-2 gap-x-4 gap-y-[1vh] text-[clamp(0.8rem,1.65vh,0.95rem)] text-ivory/85">
        {lvl.groups[g].items.map((t) => (
          <li key={t} className="flex items-center gap-2.5">
            <span className="size-1.5 shrink-0 rounded-full bg-ember" />
            {t}
          </li>
        ))}
      </ul>

      <div data-swap className="relative grid min-h-[50vh] grid-cols-[1fr_1fr_1.15fr] grid-rows-2 gap-3 lg:absolute lg:inset-y-0 lg:left-[calc(30%+2.5vw)] lg:right-0 lg:min-h-0">
        <Thumb photo={lvl.photos[1]} onOpen={() => onPhoto(1)} />
        <Thumb photo={lvl.photos[2]} onOpen={() => onPhoto(2)} />
        <Thumb photo={lvl.photos[0]} onOpen={() => onPhoto(0)} className="row-span-2" />
        <Thumb photo={lvl.photos[3]} onOpen={() => onPhoto(3)} className="col-span-2" />
      </div>
    </>
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

  return (
    <section ref={root} className="screen bg-forest-900 text-ivory">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_12%_18%,rgb(63_111_98/0.35),transparent_55%)]" />
      <Botanical kind="monstera" seed={21} depth={16} className="bottom-0 left-0 w-[10vw] text-gold/15" />

      <div className="safe pane relative h-full">
        <div className="relative min-h-full lg:h-full">
          <div className="flex flex-col justify-center-safe lg:h-full lg:w-[30%]">
            <p data-in className="eyebrow text-gold-lit">Amenities</p>
            <div data-in className="mt-[2.5vh]">
              <Segmented items={AMENITY_LEVELS} value={id} onChange={setId} tone="dark" />
            </div>
            <Swap id={id} className="contents">
              <p data-swap data-in className="label mt-[3vh] text-ember">{lvl.tagline}</p>
              <h2 data-swap data-in className="display mt-[1vh] text-[clamp(1.7rem,4.4vh,3.2rem)] font-normal text-gold-lit">{lvl.heading}</h2>
              <p data-swap data-in className="mt-[1.5vh] text-[clamp(0.8rem,1.65vh,0.95rem)] leading-relaxed text-ivory/70">{lvl.body}</p>
              {lvl.plan ? <Level key={lvl.id} lvl={lvl} onPhoto={setPhoto} /> : <Common lvl={lvl} onPhoto={setPhoto} />}
            </Swap>
          </div>
        </div>
      </div>

      {photo != null && <Lightbox photos={lvl.photos} index={photo} onClose={close} />}
    </section>
  )
}
