import { useEffect, useState } from 'react'
import { BRAND } from '../data/content'
import { Mark } from '../art/Brand'
import { useNav, isPage } from './nav'
import Horizon from './Horizon'

function Clock() {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 15000)
    return () => clearInterval(id)
  }, [])
  return (
    <div className="text-right leading-tight">
      <p className="font-display text-[clamp(1.2rem,2.6vh,1.6rem)]">{now.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' })}</p>
      <p className="label mt-0.5 opacity-60">{now.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}</p>
    </div>
  )
}

export default function Chrome() {
  const { route, go, tone } = useNav()
  if (!isPage(route)) return null

  const [left, right] = Array.isArray(tone) ? tone : [tone, tone]
  const ink = (t) => `transition-colors duration-700 ${t === 'light' ? 'text-forest-900' : 'text-ivory'}`

  return (
    <div className="pointer-events-none fixed inset-0 z-50">
      <div className="absolute inset-x-0 top-0 flex h-(--chrome-top) items-center justify-between px-(--gutter)">
        <button onClick={() => go('home')} className={`group pointer-events-auto flex items-center gap-3 py-2 ${ink(left)}`} aria-label="Home">
          <span className="w-9 text-gold transition-transform duration-500 group-active:scale-90 md:w-10">
            <Mark />
          </span>
          <span className="label hidden sm:block">{BRAND.name}</span>
        </button>

        <div className={`pointer-events-auto ${ink(right)}`}>
          {route === 'home' ? (
            <Clock />
          ) : route !== 'enquire' ? (
            <button onClick={() => go('enquire')} className={`btn !px-5 !py-2.5 active:scale-95 ${right === 'ember' ? 'border-forest-900 bg-forest-900 text-ivory' : 'btn-solid'}`}>
              Book a visit
            </button>
          ) : null}
        </div>
      </div>

      {/* home is itself the navigation, so the horizon only appears inside sections */}
      {route !== 'home' && <Horizon route={route} go={go} />}
    </div>
  )
}
