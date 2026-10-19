import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react'
import { gsap, reduced } from '../gsap/gsapConfig'

const MAX = 4
const clampS = (s) => Math.min(MAX, Math.max(1, s))

/**
 * A plan, map or image the visitor can pinch, drag, scroll and double-tap to zoom.
 * `children` are overlays laid out in the image's own box, so `left/top` percentages
 * line up with the artwork at any zoom. Pass `--zs` to counter-scale overlay labels.
 * The ref exposes `focus(u, v, scale)` (u/v are 0..1 across the image) and `reset()`.
 */
const ZoomPan = forwardRef(function ZoomPan({ src, alt, aspect, className = '', imgClassName = '', controls = true, tone = 'light', children }, ref) {
  const box = useRef(null)
  const content = useRef(null)
  const t = useRef({ x: 0, y: 0, s: 1 })
  const fit = useRef({ W: 0, H: 0, left: 0, top: 0, cw: 0, ch: 0 })
  const [zoomed, setZoomed] = useState(false)

  const apply = useCallback(() => {
    const el = content.current
    if (!el) return
    const { x, y, s } = t.current
    el.style.transform = `translate3d(${x}px, ${y}px, 0) scale(${s})`
    el.style.setProperty('--zs', s)
    const z = s > 1.02
    setZoomed((prev) => (prev === z ? prev : z))
  }, [])

  // keeps the image covering the frame once zoomed, and centred while it is smaller than it
  const clamp = useCallback((x, y, s) => {
    const { W, H, left, top, cw, ch } = fit.current
    const axis = (v, full, off, size) => {
      const span = size * s
      if (span <= full) return (size - span) / 2
      return Math.min(-off, Math.max(full - off - span, v))
    }
    return { x: axis(x, W, left, cw), y: axis(y, H, top, ch), s }
  }, [])

  const set = useCallback((x, y, s) => {
    t.current = clamp(x, y, clampS(s))
    apply()
  }, [apply, clamp])

  const tweenTo = useCallback(
    (target, duration = 0.9) => {
      const to = clamp(target.x, target.y, clampS(target.s))
      gsap.killTweensOf(t.current)
      if (reduced()) {
        t.current = to
        apply()
        return
      }
      gsap.to(t.current, { ...to, duration, ease: 'expo.inOut', onUpdate: apply })
    },
    [apply, clamp],
  )

  // zoom about a point in frame coordinates
  const zoomAt = useCallback(
    (px, py, s, animate = false) => {
      const { left, top } = fit.current
      const cur = t.current
      const ns = clampS(s)
      const k = ns / cur.s
      const nx = px - left - (px - left - cur.x) * k
      const ny = py - top - (py - top - cur.y) * k
      if (animate) tweenTo({ x: nx, y: ny, s: ns }, 0.6)
      else set(nx, ny, ns)
    },
    [set, tweenTo],
  )

  useImperativeHandle(ref, () => ({
    focus(u, v, s = 2.4) {
      const { W, H, left, top, cw, ch } = fit.current
      tweenTo({ x: W / 2 - left - u * cw * s, y: H / 2 - top - v * ch * s, s })
    },
    reset() {
      tweenTo({ x: 0, y: 0, s: 1 }, 0.7)
    },
  }))

  // fit the image inside the frame (object-contain), re-fit on resize
  useEffect(() => {
    const el = box.current
    const measure = () => {
      // the observer can fire once more after unmount, when the ref is already cleared
      const c = content.current
      if (!c) return
      const W = el.clientWidth
      const H = el.clientHeight
      const cw = Math.min(W, H * aspect)
      const ch = cw / aspect
      fit.current = { W, H, cw, ch, left: (W - cw) / 2, top: (H - ch) / 2 }
      c.style.width = `${cw}px`
      c.style.height = `${ch}px`
      c.style.left = `${fit.current.left}px`
      c.style.top = `${fit.current.top}px`
      set(t.current.x, t.current.y, t.current.s)
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [aspect, set])

  // pointer drag, two-finger pinch, wheel / trackpad and double-tap
  useEffect(() => {
    const el = box.current
    const pts = new Map()
    let last = null // { x, y, d } of the previous frame
    let moved = 0
    let lastTap = 0

    const local = (e) => {
      const r = el.getBoundingClientRect()
      return [e.clientX - r.left, e.clientY - r.top]
    }
    const snapshot = () => {
      const p = [...pts.values()]
      if (p.length === 1) return { x: p[0][0], y: p[0][1], d: 0 }
      const [a, b] = p
      return { x: (a[0] + b[0]) / 2, y: (a[1] + b[1]) / 2, d: Math.hypot(a[0] - b[0], a[1] - b[1]) }
    }

    const down = (e) => {
      if (e.pointerType === 'mouse' && e.button !== 0) return
      gsap.killTweensOf(t.current)
      pts.set(e.pointerId, local(e))
      last = snapshot()
      if (pts.size === 1) moved = 0
    }
    const move = (e) => {
      if (!pts.has(e.pointerId)) return
      pts.set(e.pointerId, local(e))
      const now = snapshot()
      const dx = now.x - last.x
      const dy = now.y - last.y
      moved += Math.abs(dx) + Math.abs(dy)
      if (moved > 6 && !el.hasPointerCapture(e.pointerId)) el.setPointerCapture(e.pointerId)
      const cur = t.current
      if (pts.size >= 2 && last.d) {
        const ns = clampS(cur.s * (now.d / last.d))
        const k = ns / cur.s
        const { left, top } = fit.current
        set(now.x - left - (last.x - left - cur.x) * k, now.y - top - (last.y - top - cur.y) * k, ns)
      } else if (cur.s > 1.02) {
        set(cur.x + dx, cur.y + dy, cur.s)
      }
      last = now
    }
    const up = (e) => {
      if (!pts.has(e.pointerId)) return
      const [px, py] = pts.get(e.pointerId)
      pts.delete(e.pointerId)
      last = pts.size ? snapshot() : null
      if (pts.size || moved > 6) return
      const now = performance.now()
      if (now - lastTap < 320) {
        lastTap = 0
        const s = t.current.s
        if (s > 1.3) tweenTo({ x: 0, y: 0, s: 1 }, 0.6)
        else zoomAt(px, py, 2.4, true)
      } else lastTap = now
    }
    // a drag must not also count as a tap on a pin underneath it
    const click = (e) => {
      if (moved > 6) {
        e.stopPropagation()
        e.preventDefault()
      }
    }
    const wheel = (e) => {
      e.preventDefault()
      gsap.killTweensOf(t.current)
      const [px, py] = local(e)
      const cur = t.current
      const mouseWheel = e.deltaMode === 1 || (Math.abs(e.deltaY) >= 50 && e.deltaX === 0 && Number.isInteger(e.deltaY))
      if (e.ctrlKey) zoomAt(px, py, cur.s * Math.exp(-e.deltaY * 0.012))
      else if (mouseWheel) zoomAt(px, py, cur.s * Math.exp(-Math.sign(e.deltaY) * 0.22))
      else if (cur.s > 1.02) set(cur.x - e.deltaX, cur.y - e.deltaY, cur.s)
    }

    el.addEventListener('pointerdown', down)
    el.addEventListener('pointermove', move)
    el.addEventListener('pointerup', up)
    el.addEventListener('pointercancel', up)
    el.addEventListener('click', click, true)
    el.addEventListener('wheel', wheel, { passive: false })
    return () => {
      el.removeEventListener('pointerdown', down)
      el.removeEventListener('pointermove', move)
      el.removeEventListener('pointerup', up)
      el.removeEventListener('pointercancel', up)
      el.removeEventListener('click', click, true)
      el.removeEventListener('wheel', wheel)
      gsap.killTweensOf(t.current)
    }
  }, [set, tweenTo, zoomAt])

  const step = (f) => {
    const { W, H } = fit.current
    zoomAt(W / 2, H / 2, t.current.s * f, true)
  }

  const btn = `grid size-11 place-items-center rounded-full backdrop-blur-md transition-colors active:scale-95 ${
    tone === 'dark' ? 'bg-forest-950/70 text-ivory hover:bg-forest-950/90' : 'bg-white/85 text-forest-900 shadow-[0_6px_20px_-8px_rgb(20_52_41/0.45)] hover:bg-white'
  }`

  return (
    // callers position the frame (absolute inset-0, or relative with a size)
    <div className={`isolate overflow-hidden ${className}`}>
      <div ref={box} className={`absolute inset-0 touch-none select-none ${zoomed ? 'cursor-grab active:cursor-grabbing' : 'cursor-zoom-in'}`}>
        <div ref={content} className="absolute origin-top-left will-change-transform" style={{ '--zs': 1 }}>
          <img src={src} alt={alt} draggable="false" className={`absolute inset-0 h-full w-full ${imgClassName}`} />
          {children}
        </div>
      </div>
      {controls && (
        <div className="absolute bottom-3 right-3 z-10 flex flex-col gap-2">
          <button type="button" onClick={() => step(1.6)} className={btn} aria-label="Zoom in">
            <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 5v14M5 12h14" /></svg>
          </button>
          <button type="button" onClick={() => step(1 / 1.6)} className={btn} aria-label="Zoom out">
            <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M5 12h14" /></svg>
          </button>
          <button type="button" onClick={() => tweenTo({ x: 0, y: 0, s: 1 }, 0.7)} className={`${btn} ${zoomed ? '' : 'pointer-events-none opacity-0'} transition-opacity`} aria-label="Reset zoom">
            <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" /></svg>
          </button>
        </div>
      )}
    </div>
  )
})

export default ZoomPan

// A pulsing marker placed at (u, v) on a ZoomPan image; stays the same size at any zoom.
// `quiet` pins are invisible (but still tappable) until active, for artwork that already marks the spot.
export function Pin({ u, v, active, label, onClick, tone = 'ember', quiet = false }) {
  const ring = tone === 'gold' ? 'bg-gold' : 'bg-ember'
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="absolute z-[1] -translate-x-1/2 -translate-y-1/2"
      style={{ left: `${u * 100}%`, top: `${v * 100}%`, scale: 'calc(1 / var(--zs))' }}
    >
      <span className="relative grid size-11 place-items-center">
        <span className={`absolute inset-0 rounded-full ${ring} transition-opacity duration-500 ${active ? 'animate-ping opacity-30' : 'opacity-0'}`} />
        <span className={`absolute inset-2 rounded-full ${ring} transition-opacity duration-500 ${active ? 'opacity-35' : 'opacity-0'}`} />
        <span className={`relative rounded-full border-2 border-white ${ring} shadow transition-all duration-500 ${active ? 'size-3.5' : quiet ? 'size-2.5 opacity-0' : 'size-2.5 opacity-70'}`} />
      </span>
      {active && label && !quiet && (
        <span className="label absolute left-1/2 top-full mt-1 -translate-x-1/2 whitespace-nowrap rounded-full bg-forest-950/85 px-3 py-1.5 text-[max(0.6rem,9px)] text-ivory shadow-lg">
          {label}
        </span>
      )}
    </button>
  )
}
