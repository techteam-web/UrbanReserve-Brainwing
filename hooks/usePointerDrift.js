import { useEffect } from 'react'
import { gsap, reduced } from '../gsap/gsapConfig'

// Feeds eased cursor position (-1..1) into --mx/--my for every `.drift` element.
export function usePointerDrift() {
  useEffect(() => {
    if (reduced() || !window.matchMedia('(pointer: fine)').matches) return
    const root = document.documentElement.style
    let tx = 0, ty = 0, x = 0, y = 0
    const move = (e) => {
      tx = (e.clientX / window.innerWidth) * 2 - 1
      ty = (e.clientY / window.innerHeight) * 2 - 1
    }
    const tick = () => {
      if (Math.abs(tx - x) < 0.0005 && Math.abs(ty - y) < 0.0005) return
      x += (tx - x) * 0.055
      y += (ty - y) * 0.055
      root.setProperty('--mx', x.toFixed(4))
      root.setProperty('--my', y.toFixed(4))
    }
    window.addEventListener('pointermove', move, { passive: true })
    gsap.ticker.add(tick)
    return () => {
      window.removeEventListener('pointermove', move)
      gsap.ticker.remove(tick)
    }
  }, [])
}
