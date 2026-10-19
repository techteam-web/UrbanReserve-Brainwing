/*
 * The distance to the nearest shore over a size² grid `half` metres either side of the reserve,
 * in bytes: 0..255 for 0..`range` metres. The water polygons (local metres, outer ring then
 * holes) are filled by scanline, then every water cell measures its way to the nearest land
 * cell. Row 0 is the south edge. Plain arrays only, so a worker can run it.
 */
export function shoreDistances(outlines, { half, size, range }) {
  const wet = fill(outlines, half, size)
  const grid = new Float64Array(size * size)
  for (let i = 0; i < grid.length; i++) grid[i] = wet[i] ? 1e20 : 0
  distanceTransform(grid, size)
  const metres = (2 * half) / size
  const field = new Uint8Array(size * size)
  for (let i = 0; i < field.length; i++) field[i] = Math.min(255, Math.round(((Math.sqrt(grid[i]) * metres) / range) * 255))
  return field
}

// Marks the cells whose centres fall inside a polygon (even-odd, so holes stay dry).
function fill(outlines, half, size) {
  const wet = new Uint8Array(size * size)
  const at = (v) => ((v + half) / (2 * half)) * size
  const xs = []
  for (const rings of outlines) {
    const edges = []
    let low = Infinity
    let high = -Infinity
    for (const ring of rings) {
      for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
        const y0 = at(ring[j][1])
        const y1 = at(ring[i][1])
        if (y0 === y1) continue
        edges.push(at(ring[j][0]), y0, at(ring[i][0]), y1)
        low = Math.min(low, y0, y1)
        high = Math.max(high, y0, y1)
      }
    }
    const first = Math.max(0, Math.ceil(low - 0.5))
    const last = Math.min(size - 1, Math.floor(high - 0.5))
    for (let r = first; r <= last; r++) {
      const y = r + 0.5
      xs.length = 0
      for (let e = 0; e < edges.length; e += 4) {
        const y0 = edges[e + 1]
        const y1 = edges[e + 3]
        if (y0 <= y !== y1 <= y) xs.push(edges[e] + ((y - y0) / (y1 - y0)) * (edges[e + 2] - edges[e]))
      }
      xs.sort((a, b) => a - b)
      for (let k = 0; k + 1 < xs.length; k += 2) {
        const c1 = Math.min(size - 1, Math.floor(xs[k + 1] - 0.5))
        for (let c = Math.max(0, Math.ceil(xs[k] - 0.5)); c <= c1; c++) wet[r * size + c] = 1
      }
    }
  }
  return wet
}

// Squared Euclidean distance transform of an n×n grid, in place (Felzenszwalb & Huttenlocher):
// zero cells are the shore, and every other cell gets its squared distance to the nearest one.
function distanceTransform(grid, n) {
  const f = new Float64Array(n)
  const d = new Float64Array(n)
  const v = new Int32Array(n)
  const z = new Float64Array(n + 1)
  // the lower envelope of the parabolas rooted at each cell of one line
  const line = () => {
    let k = 0
    v[0] = 0
    z[0] = -Infinity
    z[1] = Infinity
    for (let q = 1; q < n; q++) {
      let s = (f[q] + q * q - (f[v[k]] + v[k] * v[k])) / (2 * q - 2 * v[k])
      while (s <= z[k]) {
        k--
        s = (f[q] + q * q - (f[v[k]] + v[k] * v[k])) / (2 * q - 2 * v[k])
      }
      k++
      v[k] = q
      z[k] = s
      z[k + 1] = Infinity
    }
    k = 0
    for (let q = 0; q < n; q++) {
      while (z[k + 1] < q) k++
      d[q] = (q - v[k]) ** 2 + f[v[k]]
    }
  }
  for (let x = 0; x < n; x++) {
    for (let y = 0; y < n; y++) f[y] = grid[y * n + x]
    line()
    for (let y = 0; y < n; y++) grid[y * n + x] = d[y]
  }
  for (let y = 0; y < n; y++) {
    for (let x = 0; x < n; x++) f[x] = grid[y * n + x]
    line()
    for (let x = 0; x < n; x++) grid[y * n + x] = d[x]
  }
}
