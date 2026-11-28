import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { gsap, reduced } from '../gsap/gsapConfig'
import { useNav, introDelay } from '../app/nav'
import { holdIntro } from '../app/gate'
import { comparison, isFinder } from '../data/content'
import { Segmented } from '../components/ui'

// (a phone on its side gives the switch a narrow column, and a shorter name)
const MODES = [
  {
    id: 'visual',
    label: (
      <>
        <span className="sideways:hidden">Visual Selection</span>
        <span className="hidden sideways:inline">Visual</span>
      </>
    ),
  },
  { id: 'compare', label: 'Unit finder' },
]

// Where each way in was left, so switching back returns there. The unit finder opens on its filters.
const left = { visual: '', compare: '?units' }

// Where the switch stood on the screen that was left, and when: the next screen's switch glides on
// from there (the towers keep it with their words; a floor and the unit finder at the top).
let last = null
const FRESH = 6000

/**
 * The two ways into the homes, on Residences' screens: Visual Selection goes from the towers to a
 * floor's plan to a home on it, and the unit finder filters the homes and compares them. It brings
 * itself in: from where the last screen had it, gliding to its place here as the screen comes up,
 * or else rising in with the screen's other words.
 */
export default function ModeSwitch({ tone = 'light', className = '' }) {
  const box = useRef(null)
  const { shown, go } = useNav()
  const mode = comparison(shown.search) || isFinder(shown.search) ? 'compare' : 'visual'
  // read once as it mounts (the global is only read here, so React's dev double-run reads it alike)
  const [from] = useState(() => (last && performance.now() - last.t < FRESH ? last : null))
  useEffect(() => {
    left[mode] = shown.search
  }, [mode, shown.search])

  useLayoutEffect(() => {
    const el = box.current
    const r = el.getBoundingClientRect()
    // in a context, so a teardown puts it back as it was (React's dev double-run included)
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ delay: introDelay() })
      if (!reduced()) {
        const dx = from ? from.x - r.left : 0
        const dy = from ? from.y - r.top : 0
        if (Math.hypot(dx, dy) > 4) tl.from(el, { x: dx, y: dy, duration: 1.1, ease: 'power3.inOut', clearProps: 'transform' }, 0)
        else tl.from(el, { y: 14, autoAlpha: 0, duration: 0.8 }, 0.1)
      }
      holdIntro(tl)
    })
    return () => {
      // where it stands as its screen goes, for the next one's to glide on from
      const q = el.getBoundingClientRect()
      if (q.width) last = { x: q.left, y: q.top, t: performance.now() }
      ctx.revert()
    }
  }, [from])

  // the names are spaced tighter than a label's usual, so both fit a tablet's narrow column
  return (
    <div ref={box} className="relative z-20">
      <Segmented
        items={MODES}
        value={mode}
        onChange={(id) => id !== mode && go('residences', left[id])}
        tone={tone}
        size="sm"
        className={`*:tracking-[0.14em] ${className}`}
      />
    </div>
  )
}
