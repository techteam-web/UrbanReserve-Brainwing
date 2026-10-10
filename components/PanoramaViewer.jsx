import { useEffect, useRef } from 'react'
import Marzipano from 'marzipano'
import { reduced } from '../gsap/gsapConfig'

/*
 * Cube-tiled panoramas as the Marzipano tool exports them, set up the way its own viewer does.
 * scenes: [{ key, tiles, data, heading }] — `data` is one of APP_DATA.scenes, its tiles at
 * `${tiles}/{z}/{f}/{y}/{x}.jpg` beside a preview.jpg; `heading` (radians) is how far the scene is
 * turned from the others (see scripts/headings.mjs). A scene is built the first time it is shown,
 * so only the floors actually visited are fetched.
 */
export default function PanoramaViewer({ scenes, active, autorotate = true, mouseViewMode = 'drag' }) {
  const host = useRef(null)
  const state = useRef({})

  useEffect(() => {
    const viewer = new Marzipano.Viewer(host.current, { controls: { mouseViewMode }, stage: { progressive: true } })
    const made = new Map()
    const sceneFor = (key) => {
      if (made.has(key)) return made.get(key)
      const { tiles, data, heading = 0 } = scenes.find((s) => s.key === key)
      const source = Marzipano.ImageUrlSource.fromString(`${tiles}/{z}/{f}/{y}/{x}.jpg`, { cubeMapPreviewUrl: `${tiles}/preview.jpg` })
      const geometry = new Marzipano.CubeGeometry(data.levels)
      const limiter = Marzipano.RectilinearView.limit.traditional(data.faceSize, (100 * Math.PI) / 180, (120 * Math.PI) / 180)
      const view = new Marzipano.RectilinearView(data.initialViewParameters, limiter)
      const entry = { scene: viewer.createScene({ source, geometry, view, pinFirstLevel: true }), view, start: data.initialViewParameters, heading }
      made.set(key, entry)
      return entry
    }
    state.current = { viewer, sceneFor }
    return () => {
      state.current = {}
      viewer.destroy()
    }
  }, [scenes, mouseViewMode])

  // The first scene opens on its exported starting view. From then on the view carries over from
  // scene to scene, turned by the difference in their headings, so a change of tower or floor keeps
  // facing the same way. Then it turns slowly until the visitor takes over.
  useEffect(() => {
    const { viewer, sceneFor, shown } = state.current
    if (!viewer) return
    const next = sceneFor(active)
    viewer.stopMovement()
    viewer.setIdleMovement(Infinity)
    if (next !== shown) {
      if (shown) {
        const { yaw, pitch, fov } = shown.view.parameters()
        next.view.setParameters({ yaw: yaw + shown.heading - next.heading, pitch, fov })
      } else next.view.setParameters(next.start)
      next.scene.switchTo({ transitionDuration: 900 })
      state.current.shown = next
    }
    if (autorotate && !reduced()) {
      const spin = Marzipano.autorotate({ yawSpeed: 0.03, targetPitch: 0, targetFov: Math.PI / 2 })
      viewer.startMovement(spin)
      viewer.setIdleMovement(3000, spin)
    }
  }, [active, scenes, autorotate, mouseViewMode])

  return <div ref={host} className="absolute inset-0 cursor-grab active:cursor-grabbing" />
}
