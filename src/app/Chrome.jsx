import { Mark } from '../art/Brand'
import { useNav, isPage } from './nav'
import Dock from './Dock'

// The frame around every screen: the dock along the foot, and on the pages the mark at the top, which
// also goes Home.
export default function Chrome() {
  const { route, go } = useNav()
  return (
    <>
      {isPage(route) && (
        <div className="pointer-events-none fixed inset-x-0 top-0 z-50 flex h-(--chrome-top) items-center justify-center">
          <button onClick={() => go('landing')} className="pointer-events-auto w-9 text-gold transition-transform duration-500 hover:scale-110 md:w-10" aria-label="Home">
            <Mark />
          </button>
        </div>
      )}
      <Dock />
    </>
  )
}
