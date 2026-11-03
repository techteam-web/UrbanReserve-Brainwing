import { useNav } from '../app/nav'
import { comparison } from '../data/content'
import { pickedFloor } from '../data/residences'
import Building from './Building'
import FloorPlan from './FloorPlan'
import { ComparePlans, CompareViews } from './FloorCompare'

/**
 * The homes, two ways in. Visual Selection starts from the towers as they stand: a floor opens its
 * plan, and a home on the plan its details. Unit Comparison sets two homes side by side, then the
 * views from them. Where the visitor is lives in the address, so Back, a reload or the dock's tab
 * returns to it:
 *   /residences                                    the towers
 *   /residences?tower=towerA&floor=23(&flat=3)     a floor's plan (and a home's panel)
 *   /residences?compare=towerA.1.20,towerB.3.20    two homes (&views: the views from them)
 */
export default function Residences() {
  const { shown } = useNav()
  const compared = comparison(shown.search)
  if (compared) {
    const { homes, views } = compared
    // a different pair of homes starts afresh, on the way each one looks out
    return views ? <CompareViews key={homes.map((h) => `${h.tower.id}.${h.unit.id}`).join()} homes={homes} /> : <ComparePlans homes={homes} />
  }
  const at = pickedFloor(shown.search)
  return at ? <FloorPlan at={at} /> : <Building />
}
