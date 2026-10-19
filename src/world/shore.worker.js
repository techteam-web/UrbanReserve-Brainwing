import { shoreDistances } from './shore'

// Works out the shore field off the main thread (a couple of hundred milliseconds of filling and
// measuring that would otherwise stall the page while it loads).
self.onmessage = ({ data: { outlines, grid } }) => {
  const field = shoreDistances(outlines, grid)
  self.postMessage(field, [field.buffer])
}
