import gsap from 'gsap'
import { CustomEase } from 'gsap/CustomEase'
import { DrawSVGPlugin } from 'gsap/DrawSVGPlugin'
import { useGSAP } from '@gsap/react'

gsap.registerPlugin(useGSAP, CustomEase, DrawSVGPlugin)

CustomEase.create('grow', '0.16, 1, 0.3, 1')
CustomEase.create('sweepIn', '0.55, 0, 0.9, 0.45')
CustomEase.create('sweepOut', '0.1, 0.55, 0.45, 1')

gsap.defaults({ ease: 'grow', duration: 1 })
// a dropped frame pauses motion instead of making it jump ahead to catch up
gsap.ticker.lagSmoothing(100, 16)

export const reduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

// Touch devices get the cheaper variants of the always-on decorative effects.
export const lite = () => window.matchMedia('(pointer: coarse)').matches

export const DRAWABLE = '[data-draw] path, [data-draw] circle, [data-draw] line, [data-draw] ellipse'

export { gsap, useGSAP }
