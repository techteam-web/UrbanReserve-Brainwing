/*
 * The button click (public/audio/Click.mp3), played through Web Audio so it sounds at once and
 * quick clicks overlap instead of cutting each other off. The file is decoded ahead of time (an
 * offline context needs no user gesture); the context that plays it is made on the first click,
 * which is one. The recording opens with a little silence, so it plays from just before the
 * click itself. The sound switch leaves it alone: it only turns the background ambience on and off.
 *
 * The dock's tabs also tick as a mouse passes over them: the press of the same recording without
 * its release (the click is the two, about 85 ms apart), softer and a little higher.
 */
const FILE = '/audio/Click.mp3'
const VOLUME = 0.9
// the hover tick: its level, its pitch against the click's, how much of the recording it plays
// (seconds, ending well before the release) and the least time between two (ms)
const HOVER = { volume: 0.3, rate: 1.2, length: 0.05, gap: 45 }

let clip = null
let loading = null
let context = null
let ticked = 0

export function preloadClick() {
  loading ??= fetch(FILE)
    .then((r) => r.arrayBuffer())
    .then((data) => new OfflineAudioContext(1, 1, 44100).decodeAudioData(data))
    .then((buffer) => {
      const samples = buffer.getChannelData(0)
      let peak = 0
      for (let i = 0; i < samples.length; i++) peak = Math.max(peak, Math.abs(samples[i]))
      const onset = Math.max(0, samples.findIndex((v) => Math.abs(v) > peak * 0.05))
      clip = { buffer, from: Math.max(0, onset / buffer.sampleRate - 0.004) }
    })
    .catch(() => {})
  return loading
}

// the recording through a gain of its own, ready to start
function voice(volume, rate = 1) {
  context ??= new AudioContext()
  // suspended, or interrupted (Safari, after a call or a trip to the background): a tap wakes it
  if (context.state !== 'running') context.resume()
  const source = context.createBufferSource()
  source.buffer = clip.buffer
  source.playbackRate.value = rate
  const gain = context.createGain()
  gain.gain.value = volume
  source.connect(gain).connect(context.destination)
  return { source, gain }
}

export function playClick() {
  if (!clip) return
  try {
    voice(VOLUME).source.start(0, clip.from)
  } catch {
    // no audio here: the click goes silent
  }
}

export function playHover() {
  // nothing before the visitor's first tap, when the browser would hold the sound back anyway
  if (!clip || !context) return
  const now = performance.now()
  if (now - ticked < HOVER.gap) return
  ticked = now
  try {
    const { source, gain } = voice(HOVER.volume, HOVER.rate)
    // the part played is measured in the recording's own time, which runs faster here
    const end = context.currentTime + HOVER.length / HOVER.rate
    // it closes with a quick fade rather than a cut
    gain.gain.setValueAtTime(HOVER.volume, end - 0.012)
    gain.gain.linearRampToValueAtTime(0, end)
    source.start(0, clip.from, HOVER.length)
  } catch {
    // no audio here: the tick goes silent
  }
}

// Some browsers only let sound start during a tap, so the first one anywhere (on desktop, the tap
// that takes the app full screen) wakes the context: then the tabs tick under a mouse before any
// has been pressed.
function wake() {
  // Esc and the like are no tap to a browser: it waits for a real one
  if (navigator.userActivation?.isActive === false) return
  window.removeEventListener('click', wake, true)
  window.removeEventListener('keydown', wake, true)
  try {
    context ??= new AudioContext()
    if (context.state !== 'running') context.resume()
  } catch {
    // no audio here: the clicks go silent
  }
}
window.addEventListener('click', wake, true)
window.addEventListener('keydown', wake, true)
