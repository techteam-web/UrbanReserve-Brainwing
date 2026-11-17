import { useEffect, useState } from 'react'
import { Mark } from '../art/Brand'

// a phone held upright: a touch screen, narrower than a tablet, in portrait
const PHONE_UPRIGHT = '(pointer: coarse) and (orientation: portrait) and (max-width: 47.99rem)'

/**
 * The app is made for desktop; on a phone it is meant to be shown sideways. Held upright, a phone gets
 * this note asking for it to be turned, which leaves on its own once it is. It can be waved away to
 * carry on upright (the pages still stack for portrait), and stays away for the rest of the visit.
 */
export default function RotateHint() {
  const [upright, setUpright] = useState(() => matchMedia(PHONE_UPRIGHT).matches)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    const mq = matchMedia(PHONE_UPRIGHT)
    const sync = () => setUpright(mq.matches)
    mq.addEventListener('change', sync)
    return () => mq.removeEventListener('change', sync)
  }, [])

  if (!upright || dismissed) return null

  return (
    <div role="dialog" aria-modal="true" aria-label="Turn your phone sideways" className="fixed inset-0 z-96 flex flex-col items-center justify-center bg-forest-950 px-8 text-center text-ivory">
      <div className="w-14 text-gold">
        <Mark />
      </div>
      <svg viewBox="0 0 48 48" className="rotate-hint mt-[6vh] size-16 text-gold-lit" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true">
        <rect x="15" y="6" width="18" height="36" rx="3" />
        <path d="M22 37h4" />
      </svg>
      <h2 className="display mt-[4vh] text-[clamp(1.6rem,7vw,2.2rem)] font-normal">
        Turn your phone
        <br />
        sideways
      </h2>
      <p className="label mt-[2vh] text-ivory/55">Urban Reserve is best seen in landscape</p>
      <button onClick={() => setDismissed(true)} className="label mt-[6vh] text-ivory/45 underline underline-offset-4">
        Continue anyway
      </button>
    </div>
  )
}
