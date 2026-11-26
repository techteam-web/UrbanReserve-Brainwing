import { useEffect } from 'react'
import { useNav } from '../app/nav'
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

/**
 * The two ways into the homes, at the head of Residences' screens: Visual Selection goes from the
 * towers to a floor's plan to a home on it, and the unit finder filters the homes and compares them.
 */
export default function ModeSwitch({ tone = 'light', className = '' }) {
  const { shown, go } = useNav()
  const mode = comparison(shown.search) || isFinder(shown.search) ? 'compare' : 'visual'
  useEffect(() => {
    left[mode] = shown.search
  }, [mode, shown.search])
  // the names are spaced tighter than a label's usual, so both fit a tablet's narrow column
  return (
    <Segmented
      items={MODES}
      value={mode}
      onChange={(id) => id !== mode && go('residences', left[id])}
      tone={tone}
      size="sm"
      className={`*:tracking-[0.14em] ${className}`}
    />
  )
}
