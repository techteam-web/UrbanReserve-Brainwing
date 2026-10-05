import { createContext, useContext } from 'react'
import { SECTIONS } from '../data/content'

export const NavContext = createContext(null)
export const useNav = () => useContext(NavContext)

export const SECTION_IDS = SECTIONS.map((s) => s.id)
export const ROUTES = ['landing', 'menu', ...SECTION_IDS, 'enquire']

export const isPage = (id) => id !== 'landing' && id !== 'menu'

export const pathFor = (id) => (id === 'landing' ? '/' : `/${id}`)

export function idFor(pathname) {
  const id = pathname.replace(/^\/+|\/+$/g, '') || 'landing'
  return ROUTES.includes(id) ? id : null
}

const depth = (id) => (id === 'landing' ? 0 : id === 'menu' ? 1 : 2)

export function direction(from, to) {
  const d = depth(to) - depth(from)
  if (d) return Math.sign(d)
  return ROUTES.indexOf(to) >= ROUTES.indexOf(from) ? 1 : -1
}

// Screens read this once on mount so their intro starts as the curtain clears.
let delay = 0.15
export const introDelay = () => delay
export const setIntroDelay = (d) => {
  delay = d
}
