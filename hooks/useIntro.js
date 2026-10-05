import { useLayoutEffect } from 'react'
import { gsap, useGSAP, reduced, lite, DRAWABLE } from '../gsap/gsapConfig'
import { introDelay, useNav } from '../app/nav'
import { holdIntro } from '../app/gate'

/**
 * Standard entrance for a screen, timed to start as the curtain clears:
 *   [data-in]    rise + fade (DOM order)
 *   [data-mask]  wipe open from the bottom
 *   [data-draw]  line art draws itself
 *   [data-fill]  traced art fills in once its outline has drawn
 * Elements inside `[data-defer]` are skipped so a screen can animate them later (slides, tabs).
 */
export function useIntro(scope, build) {
  useGSAP(
    () => {
      const tl = gsap.timeline({ delay: introDelay() })
      if (reduced()) return
      const pick = (sel) => gsap.utils.toArray(sel, scope.current).filter((el) => !el.closest('[data-defer]'))
      const ins = pick('[data-in]')
      const masks = pick('[data-mask]')
      const lines = pick(DRAWABLE)
      const fills = pick('[data-fill]')
      if (masks.length) tl.fromTo(masks, { clipPath: 'inset(100% 0% 0% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.5, stagger: 0.12, ease: 'expo.inOut' }, 0)
      if (ins.length) tl.from(ins, { y: 34, autoAlpha: 0, duration: 1.2, stagger: 0.06 }, 0.15)
      if (lines.length) tl.from(lines, { drawSVG: 0, duration: 2.4, stagger: { amount: 1.2 }, ease: 'power2.inOut' }, 0.2)
      if (fills.length) tl.from(fills, { fillOpacity: 0, duration: 1.6, stagger: { amount: 1.2 }, ease: 'power1.inOut' }, lite() ? 0.3 : 1.5)
      build?.(tl)
      holdIntro(tl)
    },
    { scope },
  )
}

// Plays the same entrance on a sub-tree (a slide or tab) that was deferred.
export function playIn(el, delay = 0) {
  if (!el || reduced()) return gsap.timeline()
  const tl = gsap.timeline({ delay })
  const ins = el.querySelectorAll('[data-in]')
  const masks = el.querySelectorAll('[data-mask]')
  const lines = el.querySelectorAll(DRAWABLE)
  const fills = el.querySelectorAll('[data-fill]')
  if (masks.length) tl.fromTo(masks, { clipPath: 'inset(100% 0% 0% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.3, stagger: 0.1, ease: 'expo.inOut' }, 0)
  if (ins.length) tl.fromTo(ins, { y: 30, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 1.1, stagger: 0.055 }, 0.1)
  if (lines.length) tl.fromTo(lines, { drawSVG: 0 }, { drawSVG: '100%', duration: 2.2, stagger: { amount: 1 }, ease: 'power2.inOut' }, 0.15)
  if (fills.length) tl.fromTo(fills, { fillOpacity: 0 }, { fillOpacity: 1, duration: 1.5, stagger: { amount: 1 }, ease: 'power1.inOut' }, lite() ? 0.3 : 1.3)
  return tl
}

// `tone` is 'dark' | 'light' | [leftTone, rightTone]; compared by value so inline arrays are safe.
export function useTone(tone) {
  const { setTone } = useNav()
  const key = [tone].flat().join('|')
  useLayoutEffect(() => {
    const parts = key.split('|')
    setTone(parts.length > 1 ? parts : parts[0])
  }, [key, setTone])
}
