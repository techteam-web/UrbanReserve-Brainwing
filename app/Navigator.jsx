import { useEffect, useMemo, useRef, useState } from 'react'
import { flushSync } from 'react-dom'
import { useLocation, useNavigate } from 'react-router-dom'
import Curtain from './Curtain'
import { NavContext, direction, idFor, isPage, pathFor, setIntroDelay } from './nav'
import { decodeImages } from './decode'
import { ROUTE_IMAGES } from '../data/content'

/**
 * React Router owns the URL; this owns *when* the screen changes. A new location starts a curtain
 * sweep, and the rendered location (`shown`) only switches while the curtain covers the page.
 * One sweep runs at a time; locations arriving mid-sweep are queued (latest wins).
 */
function createDirector(initialId, setShown) {
  const d = {
    current: initialId,
    lastPage: isPage(initialId) ? initialId : null,
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
        setShown(location)
        return
      }
      d.busy = true
      // the menu's preview panel is desktop-only, so phones skip decoding its seven photos
      const desktop = window.matchMedia('(min-width: 64rem) and (orientation: landscape)').matches
      const ready = decodeImages(to === 'menu' && !desktop ? [] : (ROUTE_IMAGES[to] ?? []))
      const tl = d.curtain.sweep(
        direction(d.current, to),
        () => {
          setIntroDelay(0.22)
          d.current = to
          if (isPage(to)) d.lastPage = to
          flushSync(() => setShown(location))
        },
        ready,
      )
      tl.eventCallback('onComplete', () => {
        d.busy = false
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
      else if (d.current === 'menu') navigate(pathFor(d.lastPage ?? 'landing'))
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
      go: (id) => navigate(pathFor(id)),
      lastPage: () => director.current?.lastPage ?? null,
    }),
    [route, shown, tone, navigate],
  )

  return (
    <NavContext.Provider value={value}>
      {children}
      <Curtain ref={curtain} />
    </NavContext.Provider>
  )
}
