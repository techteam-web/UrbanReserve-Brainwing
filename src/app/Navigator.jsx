import { useEffect, useMemo, useRef, useState } from 'react'
import { flushSync } from 'react-dom'
import { useLocation, useNavigate } from 'react-router-dom'
import Curtain from './Curtain'
import { NavContext, idFor, isPage, pathFor, setIntroDelay } from './nav'
import { decodeImages } from './decode'
import { setTransition } from './gate'
import { ROUTE_GROUND, ROUTE_IMAGES, ROUTE_STEP } from '../data/routes'

// What a screen's images or colour are can depend on its query (the floor a home's view opens on).
const forRoute = (value, search) => (typeof value === 'function' ? value(search) : value)
const imagesFor = (id, search) => forRoute(ROUTE_IMAGES[id], search) ?? []
const groundFor = (id, search) => forRoute(ROUTE_GROUND[id], search)
const stepFor = (id, search) => forRoute(ROUTE_STEP[id] ?? ROUTE_GROUND[id], search)

/**
 * React Router owns the URL; this owns *when* the screen changes. A new location starts a fade, and
 * the rendered location (`shown`) only switches while the curtain covers the page.
 * One fade runs at a time; locations arriving during one are queued (latest wins).
 */
function createDirector(initialId, setShown) {
  const d = {
    current: initialId,
    lastPage: isPage(initialId) ? initialId : null,
    // the query each page was last shown with, so its tab in the dock returns to the same view
    // (a floor plan's tower, a home's view, a comparison)
    searches: isPage(initialId) ? { [initialId]: window.location.search } : {},
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
      // a change within a page's screen happens in place; a move to another of its screens (see
      // ROUTE_STEP) goes through the curtain like a new page, by any way there: a button, Back, the dock
      if (to === d.current && stepFor(to, location.search) === stepFor(to, d.searches[to] ?? '')) {
        if (isPage(to)) d.searches[to] = location.search
        setShown(location)
        return
      }
      d.busy = true
      setTransition(true)
      const ready = decodeImages(imagesFor(to, location.search))
      const tl = d.curtain.cover(
        groundFor(to, location.search),
        () => {
          setIntroDelay(0)
          d.current = to
          if (isPage(to)) {
            d.lastPage = to
            d.searches[to] = location.search
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
    // an address with no screen (an old /menu link) goes Home
    if (!idFor(location.pathname)) navigate(pathFor('landing'), { replace: true })
    else director.current?.run(location)
  }, [location, navigate])

  const route = idFor(shown.pathname) ?? 'landing'

  // Esc leaves a page for Home, and from Home goes back to the page it came from
  useEffect(() => {
    const onKey = (e) => {
      if (e.key !== 'Escape' || e.defaultPrevented) return
      const d = director.current
      if (isPage(d.current)) navigate(pathFor('landing'))
      else if (d.lastPage) navigate(pathFor(d.lastPage) + (d.searches[d.lastPage] ?? ''))
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [navigate])

  const value = useMemo(
    () => ({
      route,
      shown,
      // going where the address already is (a second click while the curtain runs) adds no history entry
      go: (id, search = '', { replace = false } = {}) => {
        const to = pathFor(id) + search
        navigate(to, { replace: replace || to === location.pathname + location.search })
      },
      searchOf: (id) => director.current?.searches[id] ?? '',
      // decodes a screen's images ahead of a likely visit (a pointer resting on its tab)
      warm: (id) => decodeImages(imagesFor(id, director.current?.searches[id] ?? '')),
    }),
    [route, shown, navigate, location],
  )

  return (
    <NavContext.Provider value={value}>
      {children}
      <Curtain ref={curtain} />
    </NavContext.Provider>
  )
}
