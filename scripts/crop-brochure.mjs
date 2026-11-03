// Cuts artwork out of the brochure mockup spreads.
// 1. mutool draw -o "p%d.png" -r 220 <brochure.pdf>   (into a folder)
// 2. node scripts/crop-brochure.mjs <that folder>
import sharp from 'sharp'
import path from 'node:path'

const SRC = process.argv[2]
const OUT = 'public/assets/img'
const K = 220 / 90
const GUTTER = 720

// [name, page, x, y, w, h, opts] in 90dpi preview coordinates
const crops = [
  ['forest', 7, 725, 52, 470, 300],
  ['tower-day', 13, 612, 45, 400, 705, { gutter: true }],
  ['tower-dusk', 45, 726, 55, 448, 660],
  ['landscape', 11, 232, 40, 486, 710],
  ['leaf-texture', 11, 735, 45, 290, 235],
  ['plant', 9, 790, 110, 405, 580],
  ['lobby', 25, 275, 62, 670, 645, { gutter: true }],
  ['plan-ground', 17, 268, 165, 675, 500, { gutter: true }],
  ['plan-edeck', 21, 268, 185, 662, 480, { gutter: true }],
  ['am-jog', 19, 725, 52, 440, 450],
  ['am-yoga', 19, 272, 508, 400, 212],
  ['am-family', 19, 903, 508, 262, 212],
  ['am-kids', 19, 678, 508, 220, 212],
  ['ed-kids', 23, 255, 145, 195, 535],
  ['ed-gym', 23, 465, 145, 245, 268],
  ['ed-spa', 23, 465, 425, 245, 257],
  ['ed-dine', 23, 985, 143, 210, 542],
  ['ca-tennis', 41, 743, 92, 417, 323],
  ['ca-dog', 41, 278, 428, 425, 270],
  ['ca-cycle', 41, 743, 430, 417, 268],
  ['ca-pool', 43, 726, 58, 450, 655],
  ['location-map', 15, 247, 128, 468, 607],
]

// Flattens the dark/bright band the book spine leaves across a spread.
async function removeGutter(buf, width, height, x0) {
  const { data, info } = await sharp(buf).raw().toBuffer({ resolveWithObject: true })
  const ch = info.channels
  const col = new Float64Array(width)
  for (let x = 0; x < width; x++) {
    let s = 0
    for (let y = 0; y < height; y++) {
      const i = (y * width + x) * ch
      s += data[i] + data[i + 1] + data[i + 2]
    }
    col[x] = s / height / 3
  }
  const guess = Math.round((GUTTER - x0) * K)
  // the spine is a thin dark dip relative to its neighbours
  const dip = (x) => col[x] - (col[x - 8] + col[x + 8]) / 2
  let cx = guess
  for (let x = Math.max(9, guess - 110); x <= Math.min(width - 9, guess + 110); x++) if (dip(x) < dip(cx)) cx = x
  const w = 34
  const a = Math.max(0, cx - w - 4), b = Math.min(width - 1, cx + w + 4)
  // gains are measured per horizontal band so sky and facade are corrected independently
  const BAND = 24
  const bands = Math.ceil(height / BAND)
  const lum = (x, y0, y1) => {
    let s = 0
    for (let y = y0; y < y1; y++) {
      const i = (y * width + x) * ch
      s += data[i] + data[i + 1] + data[i + 2]
    }
    return s / (y1 - y0) / 3
  }
  const gains = []
  for (let k = 0; k < bands; k++) {
    const y0 = k * BAND, y1 = Math.min(height, y0 + BAND)
    const la = (lum(a, y0, y1) + lum(a + 1, y0, y1) + lum(a + 2, y0, y1)) / 3
    const lb = (lum(b, y0, y1) + lum(b - 1, y0, y1) + lum(b - 2, y0, y1)) / 3
    const g = new Float64Array(b - a + 1).fill(1)
    for (let x = a + 3; x < b - 2; x++) {
      const t = (x - a) / (b - a)
      g[x - a] = Math.min(1.6, Math.max(0.6, (la + (lb - la) * t) / Math.max(lum(x, y0, y1), 1)))
    }
    gains.push(g)
  }
  for (let y = 0; y < height; y++) {
    const f = Math.min(bands - 1, Math.max(0, y / BAND - 0.5))
    const k0 = Math.floor(f), k1 = Math.min(bands - 1, k0 + 1), t = f - k0
    for (let x = a + 3; x < b - 2; x++) {
      const gain = gains[k0][x - a] * (1 - t) + gains[k1][x - a] * t
      const i = (y * width + x) * ch
      for (let c = 0; c < 3; c++) data[i + c] = Math.min(255, data[i + c] * gain)
    }
  }
  // the fold line itself is too dark to lift, so rebuild it from the pixels either side
  const R = 8
  for (let y = 0; y < height; y++) {
    const l = (y * width + (cx - R - 1)) * ch, r = (y * width + (cx + R + 1)) * ch
    for (let x = cx - R; x <= cx + R; x++) {
      const t = (x - (cx - R - 1)) / (2 * R + 2)
      const i = (y * width + x) * ch
      for (let c = 0; c < 3; c++) data[i + c] = data[l + c] * (1 - t) + data[r + c] * t
    }
  }
  return sharp(data, { raw: info }).png().toBuffer()
}

for (const [name, page, x, y, w, h, o = {}] of crops) {
  let src = sharp(path.join(SRC, `p${page}.png`))
  if (o.white) {
    const [wx, wy, ww, wh] = o.white.map((v) => Math.round(v * K))
    const patch = await sharp({ create: { width: ww, height: wh, channels: 3, background: '#ffffff' } }).png().toBuffer()
    src = sharp(await src.composite([{ input: patch, left: wx, top: wy }]).png().toBuffer())
  }
  const width = Math.round(w * K), height = Math.round(h * K)
  let buf = await src.extract({ left: Math.round(x * K), top: Math.round(y * K), width, height }).png().toBuffer()
  if (o.gutter) buf = await removeGutter(buf, width, height, x)
  await sharp(buf).resize({ width: 1800, withoutEnlargement: true }).webp({ quality: 84 }).toFile(`${OUT}/${name}.webp`)
  process.stdout.write(name + ' ')
}

// Seamless felt tile for the sun, mirrored 2x2 from a bird-free patch of page 29.
const patch = await sharp(path.join(SRC, 'p29.png'))
  .extract({ left: Math.round(880 * K), top: Math.round(420 * K), width: Math.round(110 * K), height: Math.round(110 * K) })
  .png().toBuffer()
const s = Math.round(110 * K)
const flop = await sharp(patch).flop().toBuffer()
const flip = await sharp(patch).flip().toBuffer()
const both = await sharp(patch).flip().flop().toBuffer()
await sharp({ create: { width: s * 2, height: s * 2, channels: 3, background: '#000' } })
  .composite([{ input: patch, left: 0, top: 0 }, { input: flop, left: s, top: 0 }, { input: flip, left: 0, top: s }, { input: both, left: s, top: s }])
  .webp({ quality: 85 }).toFile(`${OUT}/sun-felt.webp`)
console.log('sun-felt')
