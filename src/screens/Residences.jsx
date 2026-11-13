import { useNav } from '../app/nav'
import { comparison, isFinder } from '../data/content'
import { pickedFloor } from '../data/residences'
import Building from './Building'
import FloorPlan from './FloorPlan'
import UnitFinder from './UnitFinder'
import { ComparePlans, CompareViews } from './FloorCompare'

/**
 * The homes, two ways in. Visual Selection starts from the towers as they stand: a floor opens its
 * plan, and a home on the plan its details. The unit finder filters every kind of home, puts two or
 * three side by side, then shows the view from each. Where the visitor is lives in the address, so
 * Back, a reload or the dock's tab returns to it:
 *   /residences                                    the towers
 *   /residences?tower=towerA&floor=23(&flat=3)     a floor's plan (and a home's panel)
 *   /residences?units                              the unit finder
 *   /residences?compare=towerA.1.20,towerB.3.20    two homes side by side, or three after another comma
 *                                                  (&views: the views from them)
 */
export default function Residences() {
  const { shown } = useNav()
  const compared = comparison(shown.search)
  if (compared) {
    const { homes, views } = compared
    // other homes start afresh on the way each looks out; another floor or tower keeps the pictures
    return views ? <CompareViews key={homes.map((h) => h.unit.id).join()} homes={homes} /> : <ComparePlans homes={homes} />
  }
  if (isFinder(shown.search)) return <UnitFinder />
  const at = pickedFloor(shown.search)
  return at ? <FloorPlan at={at} /> : <Building />
}
