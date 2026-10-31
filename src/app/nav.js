import { createContext, useContext } from 'react'
import { SECTIONS } from '../data/content'

export const NavContext = createContext(null)
export const useNav = () => useContext(NavContext)

export const SECTION_IDS = SECTIONS.map((s) => s.id)
export const ROUTES = ['landing', 'menu', ...SECTION_IDS]

export const isPage = (id) => id !== 'landing' && id !== 'menu'

export const pathFor = (id) => (id === 'landing' ? '/' : `/${id}`)

export function idFor(pathname) {
  const id = pathname.replace(/^\/+|\/+$/g, '') || 'landing'
  return ROUTES.includes(id) ? id : null
}

// Screens read this once on mount: on arriving through the curtain their intro starts as it lifts,
// so the two make one fade rather than a blank pause between two.
let delay = 0.15
export const introDelay = () => delay
export const setIntroDelay = (d) => {
  delay = d
}
