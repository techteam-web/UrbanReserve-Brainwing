import { EXRLoader } from 'three/examples/jsm/loaders/EXRLoader.js'

// Downloads and decodes the HDRI off the main thread: inflating a 1K EXR into half floats takes a
// few hundred milliseconds, enough to stall the page while it loads.
self.onmessage = async ({ data: url }) => {
  try {
    const buffer = await (await fetch(url)).arrayBuffer()
    const { data, width, height, format, type, colorSpace } = new EXRLoader().parse(buffer)
    self.postMessage({ data, width, height, format, type, colorSpace }, [data.buffer])
  } catch (e) {
    self.postMessage({ error: String(e?.message ?? e) })
  }
}
