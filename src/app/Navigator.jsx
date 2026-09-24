import { useEffect, useMemo, useRef, useState } from 'react'
import { flushSync } from 'react-dom'
import { useLocation, useNavigate } from 'react-router-dom'
import Curtain from './Curtain'
import { NavContext, direction, idFor, pathFor, setIntroDelay } from './nav'
import { decodeImages, settled } from './decode'
import { gsap, reduced } from '../gsap/gsapConfig'
import { ALL_IMAGES, ROUTE_IMAGES } from '../data/content'

const layerOf = (location) => document.querySelector(`[data-layer="${location.key}"]`)

/**
 * The new screen is mounted as a layer above the old one and animated in, then the old layer is
 * dropped. Opened from a home tile, it grows out of that tile's rectangle; from the dock it slides
 * and fades. Screens do not wait for a page turn, which is what makes it feel like an app.
 */
function enter(location, prev, dir) {
  const el = layerOf(location)
  const old = prev && layerOf(prev)
  const origin = location.state?.origin
  const tl = gsap.timeline()
  if (!el || reduced()) return tl
  if (origin) {
    const { innerWidth: W, innerHeight: H } = window
    const inset = `inset(${origin.y}px ${W - origin.x - origin.w}px ${H - origin.y - origin.h}px ${origin.x}px round 1.25rem)`
    tl.fromTo(el, { clipPath: inset }, { clipPath: 'inset(0px 0px 0px 0px round 0rem)', duration: 0.8, ease: 'expo.inOut' }, 0)
    if (old) tl.to(old, { scale: 0.95, autoAlpha: 0.4, duration: 0.8, ease: 'expo.inOut' }, 0)
  } else {
    tl.fromTo(el, { autoAlpha: 0, x: dir * 36 }, { autoAlpha: 1, x: 0, duration: 0.55, ease: 'power3.out' }, 0)
    if (old) tl.to(old, { autoAlpha: 0, x: -dir * 24, duration: 0.4, ease: 'power2.in' }, 0)
  }
  return tl.set(el, { clearProps: 'clipPath,transform,opacity,visibility' })
}

function createDirector(initialId, setStage) {
  const d = {
    current: initialId,
    shown: null,
    busy: false,
    queued: null,
    curtain: null,
    finish() {
      d.busy = false
      const next = d.queued
      d.queued = null
      if (next) d.run(next)
    },
    run(location) {
      const to = idFor(location.pathname)
      if (!to) return
      if (d.busy) {
        d.queued = location
        return
      }
      const prev = d.shown
      if (to === d.current) {
        d.shown = location
        setStage({ cur: location, prev: null })
        return
      }
      d.busy = true
      const from = d.current
      const dir = direction(from, to)
      const ready = decodeImages(ROUTE_IMAGES[to] ?? [])

      // the cover is the one place that keeps the full curtain: it opens and closes the app
      if (from === 'landing' || to === 'landing') {
        const tl = d.curtain.sweep(
          dir,
          () => {
            setIntroDelay(0.22)
            d.current = to
            d.shown = location
            flushSync(() => setStage({ cur: location, prev: null }))
          },
          ready,
        )
        tl.eventCallback('onComplete', d.finish)
        return
      }

      settled(ready, 350).then(() => {
        setIntroDelay(location.state?.origin ? 0.35 : 0.1)
        d.current = to
        d.shown = location
        flushSync(() => setStage({ cur: location, prev }))
        enter(location, prev, dir).eventCallback('onComplete', () => {
          setStage((s) => (s.cur === location ? { cur: location, prev: null } : s))
          d.finish()
        })
      })
    },
  }
  return d
}

export default function Navigator({ children }) {
  const location = useLocation()
  const navigate = useNavigate()
  const [stage, setStage] = useState({ cur: location, prev: null })
  const [tone, setTone] = useState('dark')
  const curtain = useRef(null)
  const director = useRef(null)

  useEffect(() => {
    const d = createDirector(idFor(window.location.pathname) ?? 'landing', setStage)
    d.curtain = curtain.current
    d.shown = location
    director.current = d
    // warm the whole app in the background so every tap after the first feels instant
    const warm = setTimeout(() => decodeImages(ALL_IMAGES), 1500)
    return () => clearTimeout(warm)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    director.current?.run(location)
  }, [location])

  const route = idFor(stage.cur.pathname) ?? 'landing'

  useEffect(() => {
    const onKey = (e) => {
      if (e.key !== 'Escape' || e.defaultPrevented) return
      const cur = director.current.current
      if (cur !== 'landing' && cur !== 'home') navigate(pathFor('home'))
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [navigate])

  const value = useMemo(
    () => ({
      route,
      stage,
      tone,
      setTone,
      // `origin` is the tapped tile's rectangle; the next screen grows out of it
      go: (id, origin) => navigate(pathFor(id), origin ? { state: { origin } } : undefined),
    }),
    [route, stage, tone, navigate],
  )

  return (
    <NavContext.Provider value={value}>
      {children}
      <Curtain ref={curtain} />
    </NavContext.Provider>
  )
}
