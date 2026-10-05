const done = new Map()

// Fetches and decodes images off the main thread so the reveal doesn't pay for it.
export function decodeImages(srcs) {
  return Promise.all(
    srcs.map((src) => {
      if (!done.has(src)) {
        const img = new Image()
        img.decoding = 'async'
        img.src = src
        done.set(src, img.decode().catch(() => {}))
      }
      return done.get(src)
    }),
  )
}

const wait = (ms) => new Promise((r) => setTimeout(r, ms))
const frames = (n) => new Promise((r) => (function f(k) { requestAnimationFrame(() => (k ? f(k - 1) : r())) })(n))

// Resolves once the images are ready (capped) and the freshly mounted screen has painted.
export const settled = (ready, cap = 900) => Promise.race([ready, wait(cap)]).then(() => frames(2))
