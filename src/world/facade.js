import * as THREE from 'three'
import BUILDING from '../data/building.json'

/*
 * The towers in the renders' colours. The export gathers every opaque part of the facade into one
 * material ("wall"), with no textures or colours of its own, so its parts are told apart here by
 * their shape and place, triangle by triangle, and each is given its colour (a vertex colour):
 *   - the narrow ends of each tower: charcoal, as the renders' dark sides
 *   - the short upright panels (under the windows, the balcony fronts): orange
 *   - the slabs and ledges: a lighter sand
 *   - everything else upright (the piers and walls): the warm sand of the body
 *   - the podium, under the deck: a pale stone
 * The model itself is left as it is; only the colours it's drawn in change.
 */

// the renders' colours (sRGB), sampled from them and taken down a little, as the sun and the walls'
// glow lift them
const COLOURS = {
  body: '#bb9675',
  ledge: '#ccae90',
  panel: '#b4521a',
  side: '#454c55',
  podium: '#d2c9b9',
}
// an upright piece no taller than this (m) is a panel
const PANEL = 1.5
// how far in from each tower's west and east points (m) its dark end runs
const END = 3.5

/**
 * Paints the wall geometry by its parts. `toMetres` takes its positions to the model's own y-up
 * metres (x east). Returns a new, unindexed geometry with a colour attribute, so each triangle keeps
 * its own colour.
 */
export function paintFacade(geometry, toMetres) {
  const g = geometry.index ? geometry.toNonIndexed() : geometry.clone()
  const pos = g.attributes.position
  const colours = Object.fromEntries(Object.entries(COLOURS).map(([k, css]) => [k, new THREE.Color(css)]))
  const ends = BUILDING.towers.map((t) => [t.west[0], t.east[0]])
  const out = new Float32Array(pos.count * 3)
  const [a, b, c, n] = [new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3()]
  const ab = new THREE.Vector3()
  for (let i = 0; i < pos.count; i += 3) {
    a.fromBufferAttribute(pos, i).applyMatrix4(toMetres)
    b.fromBufferAttribute(pos, i + 1).applyMatrix4(toMetres)
    c.fromBufferAttribute(pos, i + 2).applyMatrix4(toMetres)
    n.subVectors(c, b).cross(ab.subVectors(a, b)).normalize()
    const top = Math.max(a.y, b.y, c.y)
    const x = (a.x + b.x + c.x) / 3
    let kind
    if (top < BUILDING.deck + 0.5) kind = 'podium'
    else if (Math.abs(n.y) > 0.7) kind = 'ledge'
    else if (ends.some(([w, e]) => (x > w - 1 && x < w + END) || (x < e + 1 && x > e - END))) kind = 'side'
    else kind = top - Math.min(a.y, b.y, c.y) < PANEL ? 'panel' : 'body'
    for (let k = 0; k < 3; k++) colours[kind].toArray(out, (i + k) * 3)
  }
  g.setAttribute('color', new THREE.BufferAttribute(out, 3))
  return g
}
