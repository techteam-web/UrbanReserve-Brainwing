import { useEffect, useRef } from 'react'
import Marzipano from 'marzipano'

// scenes: [{ id, src }] — src is an equirectangular image (2:1)
export default function PanoramaViewer({ scenes, activeId }) {
  const host = useRef(null)
  const state = useRef({})

  useEffect(() => {
    const viewer = new Marzipano.Viewer(host.current, { stage: { progressive: true } })
    const limiter = Marzipano.RectilinearView.limit.traditional(8192, (100 * Math.PI) / 180)
    const made = {}
    scenes.forEach((s) => {
      const source = Marzipano.ImageUrlSource.fromString(s.src)
      const geometry = new Marzipano.EquirectGeometry([{ width: 8192 }])
      const view = new Marzipano.RectilinearView({ yaw: 0, pitch: 0, fov: (85 * Math.PI) / 180 }, limiter)
      made[s.id] = viewer.createScene({ source, geometry, view, pixelRatio: window.devicePixelRatio || 1 })
    })
    state.current = { viewer, made }
    viewer.setIdleMovement(3000, Marzipano.autorotate({ yawSpeed: 0.03, targetPitch: 0, targetFov: Math.PI / 2.2 }))
    return () => viewer.destroy()
  }, [scenes])

  useEffect(() => {
    const { made } = state.current
    if (made?.[activeId]) made[activeId].switchTo({ transitionDuration: 900 })
  }, [activeId, scenes])

  return <div ref={host} className="absolute inset-0 cursor-grab active:cursor-grabbing" />
}
