import { Icon } from '../components/ui'
import { Mark } from '../art/Brand'

// Positioned every frame by World; the anchor point is the element's top-left corner.
export function Anchor({ id, register, show, children }) {
  return (
    <div ref={(el) => register(id, el)} className="invisible absolute left-0 top-0 will-change-transform">
      <div className={`transition-opacity duration-700 ${show ? 'opacity-[calc(1_-_var(--fog,0))]' : 'pointer-events-none opacity-0'}`}>{children}</div>
    </div>
  )
}

export function Pin({ place, active, dim, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`group pointer-events-auto relative flex -translate-x-1/2 -translate-y-full flex-col items-center transition-opacity duration-700 ${dim ? 'opacity-40 hover:opacity-100' : ''}`}
      aria-label={`${place.name}, ${place.mins} minutes away`}
    >
      <span
        className={`flex items-center gap-2.5 rounded-full border py-1 pl-1 pr-3.5 shadow-[0_10px_30px_-10px_rgb(0_0_0/0.6)] backdrop-blur-md transition-colors duration-500 ${
          active ? 'border-gold bg-forest-950/85' : 'border-ivory/15 bg-forest-950/60 group-hover:border-gold/60'
        }`}
      >
        <span className={`grid size-7 shrink-0 place-items-center rounded-full transition-colors duration-500 ${active ? 'bg-gold text-forest-950' : 'bg-sand text-white'}`}>
          <Icon name={place.type} className="size-3.5" />
        </span>
        <span className="whitespace-nowrap font-display text-[0.95rem] italic leading-none text-gold-lit">{place.mins} min</span>
        <span
          className={`label grid whitespace-nowrap text-[0.58rem] text-ivory/85 transition-[grid-template-columns,opacity] duration-500 ${
            active ? 'grid-cols-[1fr] opacity-100' : 'grid-cols-[0fr] opacity-0 group-hover:grid-cols-[1fr] group-hover:opacity-100'
          }`}
        >
          <span className="overflow-hidden">{place.name}</span>
        </span>
      </span>
      <span className={`w-px bg-linear-to-b from-gold/80 to-gold/0 transition-[height] duration-700 ${active ? 'h-16' : 'h-9'}`} />
      <span className="size-1.5 rounded-full bg-gold shadow-[0_0_10px_3px_rgb(230_201_131/0.7)]" />
    </button>
  )
}

export function Hotspot({ index, label, left, onClick }) {
  return (
    <button onClick={onClick} className="group pointer-events-auto relative flex -translate-x-1/2 -translate-y-1/2 items-center" aria-label={`Explore ${label}`}>
      <span className="relative grid size-9 place-items-center">
        <span className="absolute inset-0 animate-ping rounded-full bg-gold/35 [animation-duration:2.6s]" />
        <span className="absolute inset-1 rounded-full border border-gold/80 bg-forest-950/75 backdrop-blur transition-colors duration-500 group-hover:bg-gold" />
        <span className="relative font-display text-[0.8rem] text-gold-lit transition-colors duration-500 group-hover:text-forest-950">{index}</span>
      </span>
      <span className={`label absolute whitespace-nowrap ${left ? 'right-full mr-2' : 'left-full ml-2'} rounded-full border border-ivory/10 bg-forest-950/70 px-3 py-1.5 text-[0.58rem] text-ivory/90 backdrop-blur-md transition-colors duration-500 group-hover:border-gold/60`}>
        {label}
      </span>
    </button>
  )
}

// Sits on the middle of the road route to a place.
export function RouteLabel({ mins, km }) {
  return (
    <div className="flex -translate-x-1/2 translate-y-[-130%] items-center gap-2.5 whitespace-nowrap rounded-full border border-white/70 bg-ember py-1.5 pl-2 pr-3.5 text-white shadow-[0_12px_30px_-12px_rgb(120_45_10/0.7)]">
      <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M5 16l1.6-5.2A2 2 0 018.5 9.4h7a2 2 0 011.9 1.4L19 16M5 16h14v3H5zM7.5 19v1.5M16.5 19v1.5" />
      </svg>
      <span className="font-display text-[1.05rem] italic leading-none">{mins} min</span>
      <span className="h-3.5 w-px bg-white/45" />
      <span className="label text-[0.56rem]">{km} km by road</span>
    </div>
  )
}

// Runs along the route from the reserve, so the way reads at a glance.
export function Traveller() {
  return (
    <span className="relative block size-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-ember shadow-[0_0_0_6px_rgb(224_112_42/0.25),0_0_18px_4px_rgb(224_112_42/0.55)]" />
  )
}

export function Badge() {
  return (
    <div className="flex -translate-x-1/2 -translate-y-full flex-col items-center">
      <span className="relative grid size-14 place-items-center rounded-full border border-gold/60 bg-forest-900/90 shadow-[0_0_40px_rgb(201_163_90/0.35)] backdrop-blur">
        <span className="absolute -inset-2 animate-ping rounded-full border border-gold/40 [animation-duration:3s]" />
        <span className="w-7 text-gold">
          <Mark />
        </span>
      </span>
      <span className="label mt-2 whitespace-nowrap text-[0.6rem] text-gold-lit">Urban Reserve</span>
      <span className="mt-1 h-10 w-px bg-linear-to-b from-gold/70 to-transparent" />
    </div>
  )
}
