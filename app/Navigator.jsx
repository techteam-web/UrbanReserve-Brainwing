import { useEffect, useMemo, useRef, useState } from 'react'
import { flushSync } from 'react-dom'
import { useLocation, useNavigate } from 'react-router-dom'
import Curtain from './Curtain'
import { NavContext, idFor, isPage, pathFor, setIntroDelay } from './nav'
import { decodeImages } from './decode'
import { setTransition } from './gate'
import { ROUTE_GROUND, ROUTE_IMAGES } from '../data/content'

// What a screen's images or colour are can depend on its query (the floor a home's view opens on).
const forRoute = (value, search) => (typeof value === 'function' ? value(search) : value)

/**
 * React Router owns the URL; this owns *when* the screen changes. A new location starts a fade, and
 * the rendered location (`shown`) only switches while the curtain covers the page.
 * One fade runs at a time; locations arriving during one are queued (latest wins).
 */
function createDirector(initialId, setShown) {
  const d = {
    current: initialId,
    lastPage: isPage(initialId) ? initialId : null,
    // and its query, so leaving the menu returns to the same view (a floor plan's tower, a home's view)
    lastSearch: isPage(initialId) ? window.location.search : '',
    busy: false,
    queued: null,
    curtain: null,
    run(location) {
      const to = idFor(location.pathname)
      if (!to) return
      if (d.busy) {
        d.queued = location
        return
      }
      if (to === d.current) {
        if (isPage(to)) d.lastSearch = location.search
        setShown(location)
        return
      }
      d.busy = true
      setTransition(true)
      // the menu's preview panel is desktop-only, so phones skip decoding its seven photos
      const desktop = window.matchMedia('(min-width: 64rem) and (orientation: landscape)').matches
      const ready = decodeImages(to === 'menu' && !desktop ? [] : (forRoute(ROUTE_IMAGES[to], location.search) ?? []))
      const tl = d.curtain.cover(
        forRoute(ROUTE_GROUND[to], location.search),
        () => {
          setIntroDelay(0)
          d.current = to
          if (isPage(to)) {
            d.lastPage = to
            d.lastSearch = location.search
          }
          flushSync(() => setShown(location))
        },
        ready,
      )
      tl.eventCallback('onComplete', () => {
        d.busy = false
        setTransition(false)
        const next = d.queued
        d.queued = null
        if (next) d.run(next)
      })
    },
  }
  return d
}

export default function Navigator({ children }) {
  const location = useLocation()
  const navigate = useNavigate()
  const [shown, setShown] = useState(location)
  const [tone, setTone] = useState('dark')
  const curtain = useRef(null)
  const director = useRef(null)

  useEffect(() => {
    const d = createDirector(idFor(window.location.pathname) ?? 'landing', setShown)
    d.curtain = curtain.current
    director.current = d
    // warm the likely next screens while the visitor is on the first one
    const warm = setTimeout(() => ['landing', 'overview'].forEach((r) => decodeImages(ROUTE_IMAGES[r])), 1200)
    return () => clearTimeout(warm)
  }, [])

  useEffect(() => {
    director.current?.run(location)
  }, [location])

  const route = idFor(shown.pathname) ?? 'landing'

  useEffect(() => {
    const onKey = (e) => {
      if (e.key !== 'Escape' || e.defaultPrevented) return
      const d = director.current
      if (isPage(d.current)) navigate(pathFor('menu'))
      else if (d.current === 'menu') navigate(pathFor(d.lastPage ?? 'landing') + d.lastSearch)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [navigate])

  const value = useMemo(
    () => ({
      route,
      shown,
      tone,
      setTone,
      // going where the address already is (a second click while the curtain runs) adds no history entry
      go: (id, search = '', { replace = false } = {}) => {
        const to = pathFor(id) + search
        navigate(to, { replace: replace || to === location.pathname + location.search })
      },
      lastPage: () => director.current?.lastPage ?? null,
      lastSearch: () => director.current?.lastSearch ?? '',
    }),
    [route, shown, tone, navigate, location],
  )

  return (
    <NavContext.Provider value={value}>
      {children}
      <Curtain ref={curtain} />
    </NavContext.Provider>
  )
}
