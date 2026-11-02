import { useSyncExternalStore } from 'react'

/*
 * The background sound: a nature ambience looping quietly under the whole app (public/audio/
 * ambience.m4a, a seamless loop cut from "Nature Ambience Sleep Music.wav", its fades trimmed and its
 * end crossfaded into its start). Browsers only allow sound after a visitor's tap, so it starts with
 * the first one anywhere (on desktop, the tap that takes the app full screen) unless the visitor has
 * turned it off before; that choice is remembered on the device. It plays through Web Audio so it can
 * fade in and out (an iPhone ignores an audio element's own volume), and it goes quiet while the tab
 * is hidden. The button clicks are separate and always sound.
 */
const FILE = '/audio/ambience.m4a'
const LEVEL = 0.35
const KEY = 'urban-reserve.sound'

let wanted = true
try {
  wanted = localStorage.getItem(KEY) !== 'off'
} catch {
  // no storage (a private window): it starts on
}
let playing = false
let audio = null
let graph = null
let pausing = 0
const listeners = new Set()
const emit = () => listeners.forEach((f) => f())

function ready() {
  if (graph) return graph
  audio = new Audio(FILE)
  audio.loop = true
  audio.preload = 'auto'
  const context = new AudioContext()
  const gain = context.createGain()
  gain.gain.value = 0
  context.createMediaElementSource(audio).connect(gain).connect(context.destination)
  audio.addEventListener('playing', () => {
    playing = true
    disarm()
    emit()
  })
  audio.addEventListener('pause', () => {
    playing = false
    emit()
  })
  graph = { context, gain }
  return graph
}

function fade(level, seconds) {
  const { context, gain } = graph
  const now = context.currentTime
  gain.gain.cancelScheduledValues(now)
  gain.gain.setValueAtTime(gain.gain.value, now)
  gain.gain.linearRampToValueAtTime(level, now + seconds)
}

function start() {
  try {
    const { context } = ready()
    clearTimeout(pausing)
    context.resume()
    audio.play().then(() => fade(LEVEL, 3)).catch(() => {})
  } catch {
    // no audio here: the app stays silent
  }
}

function stop() {
  if (!graph) return
  fade(0, 0.8)
  clearTimeout(pausing)
  pausing = setTimeout(() => audio.pause(), 850)
}

export function setSound(on) {
  wanted = on
  try {
    localStorage.setItem(KEY, on ? 'on' : 'off')
  } catch {
    // remembered for this visit only
  }
  if (on) start()
  else stop()
  emit()
}

// whether the ambience is actually sounding (not merely wanted, before the first tap)
export const useSoundPlaying = () =>
  useSyncExternalStore(
    (f) => {
      listeners.add(f)
      return () => listeners.delete(f)
    },
    () => playing,
  )

// The first tap anywhere starts it, all but a tap on the switch itself, which decides for itself.
function first(e) {
  if (e.target.closest?.('[data-sound-switch]')) return
  if (wanted && !playing) start()
}
function disarm() {
  window.removeEventListener('click', first, true)
  window.removeEventListener('keydown', first, true)
}
window.addEventListener('click', first, true)
window.addEventListener('keydown', first, true)

document.addEventListener('visibilitychange', () => {
  if (!graph || !wanted) return
  if (document.hidden) audio.pause()
  else start()
})
