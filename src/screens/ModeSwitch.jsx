import { useEffect } from 'react'
import { useNav } from '../app/nav'
import { comparison, compareQuery } from '../data/content'
import { Segmented } from '../components/ui'

const MODES = [
  { id: 'visual', label: 'Visual Selection' },
  { id: 'compare', label: 'Unit finder' },
]

// Where each way in was left, so switching back returns there. The first comparison is the one an
// empty ?compare opens: three homes, one of each kind (see `comparison`).
const left = { visual: '', compare: compareQuery(comparison('?compare').homes) }

/**
 * The two ways into the homes, at the head of Residences' screens: Visual Selection goes from the
 * towers to a floor's plan to a home on it, and Unit Comparison sets two or three homes side by side.
 */
export default function ModeSwitch({ tone = 'light', className = '' }) {
  const { shown, go } = useNav()
  const mode = comparison(shown.search) ? 'compare' : 'visual'
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
