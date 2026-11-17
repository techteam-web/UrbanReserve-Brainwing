import { useRef, useState } from 'react'
import { Observer } from 'gsap/Observer'
import { gsap, useGSAP, reduced } from '../gsap/gsapConfig'
import { playIn } from './useIntro'

gsap.registerPlugin(Observer)

/**
 * A run of slides inside `root` (each a `[data-slide]`, all but the first rendered inside
 * `data-defer`): paged with the controls above the dock (DeckPager), the arrow keys or a swipe,
 * never the wheel (a trackpad's flick ran them on by themselves). They only move when asked, and
 * the last leads back round to the first. The new slide fades up over the old one, which stays
 * still beneath it, and its words wait until the old ones have all but gone.
 * Returns the slide on show and the controls, { go(n), next(), prev() }.
 */
export function useDeck(root, count) {
  const cur = useRef(0)
  const until = useRef(0)
  const [idx, setIdx] = useState(0)
  const nav = useRef({ go: () => {}, next: () => {}, prev: () => {} })

  useGSAP(
    (context, contextSafe) => {
      const slides = gsap.utils.toArray('[data-slide]')
      gsap.set(slides.slice(1), { visibility: 'hidden' })

      const go = contextSafe((n) => {
        const now = performance.now()
        if (now < until.current || n === cur.current || n < 0 || n >= count) return
        const from = slides[cur.current]
        const to = slides[n]
        cur.current = n
        setIdx(n)
        if (reduced()) {
          gsap.set(from, { visibility: 'hidden' })
          gsap.set(to, { visibility: 'visible' })
          return
        }
        until.current = now + 900
        gsap.set(to, { autoAlpha: 0, zIndex: 2 })
        gsap.set(from, { zIndex: 1 })
        gsap.to(to, {
          autoAlpha: 1,
          duration: 0.7,
          ease: 'sine.inOut',
          onComplete: () => {
            gsap.set(from, { visibility: 'hidden', clearProps: 'zIndex' })
            gsap.set(to, { clearProps: 'zIndex' })
          },
        })
        playIn(to, 0.5)
      })
      const next = () => go((cur.current + 1) % count)
      const prev = () => go((cur.current - 1 + count) % count)
      nav.current = { go, next, prev }

      // a horizontal swipe only, so a phone's panes still scroll up and down
      Observer.create({ target: root.current, type: 'touch', tolerance: 40, lockAxis: true, onLeft: () => next(), onRight: () => prev() })

      const onKey = (e) => {
        if (e.key === 'ArrowRight' || e.key === 'PageDown') next()
        else if (e.key === 'ArrowLeft' || e.key === 'PageUp') prev()
      }
      window.addEventListener('keydown', onKey)
      return () => window.removeEventListener('keydown', onKey)
    },
    { scope: root },
  )

  return { idx, nav }
}
