// Makes the light, web-sized copy of an HDRI used for the Residences 3D lighting, and reports
// where its sun is (so the scene's sun, shadows and map light can match it). The sun disc is
// capped at `cap` luminance: a directional light with shadows plays the sun, so the sky only
// has to supply the soft fill and the reflections.
//   node scripts/hdri.mjs public/hdri/meadow_2_4k.exr public/hdri/meadow_2_1k.exr [width=1024] [cap=16]
import { readFileSync, writeFileSync } from 'node:fs'
import { DataTexture, FloatType, HalfFloatType, LinearFilter, RGBAFormat } from 'three'
import { EXRLoader } from 'three/examples/jsm/loaders/EXRLoader.js'
import { EXRExporter, ZIP_COMPRESSION } from 'three/examples/jsm/exporters/EXRExporter.js'

const [src, out, w = '1024', cap = '16'] = process.argv.slice(2)
if (!src || !out) throw new Error('usage: node scripts/hdri.mjs <in.exr> <out.exr> [width] [cap]')

const loader = new EXRLoader().setDataType(FloatType)
const buf = readFileSync(src)
const exr = loader.parse(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength))
const { width: W, height: H, data } = exr
const C = data.length / (W * H)

// box-filter down to the target size
const ow = Number(w)
const oh = ow / 2
const f = W / ow
const small = new Float32Array(ow * oh * 4)
for (let y = 0; y < oh; y++) {
  for (let x = 0; x < ow; x++) {
    const acc = [0, 0, 0]
    for (let j = 0; j < f; j++) {
      for (let i = 0; i < f; i++) {
        const k = ((y * f + j) * W + (x * f + i)) * C
        acc[0] += data[k]
        acc[1] += data[k + 1]
        acc[2] += data[k + 2]
      }
    }
    const o = (y * ow + x) * 4
    const rgb = acc.map((c) => c / (f * f))
    const l = rgb[0] * 0.2126 + rgb[1] * 0.7152 + rgb[2] * 0.0722
    const k = l > Number(cap) ? Number(cap) / l : 1
    small.set([rgb[0] * k, rgb[1] * k, rgb[2] * k, 1], o)
  }
}

// the sun: brightest pixel of the full-resolution image
let best = -1
let at = [0, 0]
for (let y = 0; y < H; y++) {
  for (let x = 0; x < W; x++) {
    const k = (y * W + x) * C
    const l = data[k] * 0.2126 + data[k + 1] * 0.7152 + data[k + 2] * 0.0722
    if (l > best) {
      best = l
      at = [x, y]
    }
  }
}
// three's equirect lookup: u = atan(z, x) / 2π + 0.5, v = asin(y) / π + 0.5 (y up, rows bottom-up)
const u = (at[0] + 0.5) / W
const v = (at[1] + 0.5) / H
const el = (v - 0.5) * Math.PI
const az = (u - 0.5) * 2 * Math.PI
const dir = [Math.cos(az) * Math.cos(el), Math.sin(el), Math.sin(az) * Math.cos(el)]

const tex = new DataTexture(small, ow, oh, RGBAFormat, FloatType)
tex.minFilter = tex.magFilter = LinearFilter
const bytes = await new EXRExporter().parse(tex, { type: HalfFloatType, compression: ZIP_COMPRESSION })
writeFileSync(out, bytes)
console.log(`${src} ${W}x${H} -> ${out} ${ow}x${oh} (${(bytes.length / 1024).toFixed(0)} KB)`)
console.log(`sun: pixel ${at} luminance ${best.toFixed(0)}, elevation ${((el * 180) / Math.PI).toFixed(1)} deg, env direction (y up) [${dir.map((n) => n.toFixed(4))}]`)
