/*
 * The button click (public/audio/Click.mp3), played through Web Audio so it sounds at once and
 * quick clicks overlap instead of cutting each other off. The file is decoded ahead of time (an
 * offline context needs no user gesture); the context that plays it is made on the first click,
 * which is one. The recording opens with a little silence, so it plays from just before the
 * click itself.
 */
const FILE = '/audio/Click.mp3'
const VOLUME = 0.9

let clip = null
let loading = null
let context = null

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

export function playClick() {
  if (!clip) return
  try {
    context ??= new AudioContext()
    if (context.state === 'suspended') context.resume()
    const source = context.createBufferSource()
    source.buffer = clip.buffer
    const gain = context.createGain()
    gain.gain.value = VOLUME
    source.connect(gain).connect(context.destination)
    source.start(0, clip.from)
  } catch {
    // no audio here: the click goes silent
  }
}
