import { useEffect, useRef } from 'react'
import Marzipano from 'marzipano'
import { reduced } from '../gsap/gsapConfig'

/*
 * Cube-tiled panoramas as the Marzipano tool exports them, set up the way its own viewer does.
 * scenes: [{ key, tiles, data, heading, group }] — `data` is one of APP_DATA.scenes, its tiles at
 * `${tiles}/{z}/{f}/{y}/{x}.jpg` beside a preview.jpg; `heading` (radians) is how far the scene is
 * turned from the others of its `group` (see scripts/headings.mjs). A scene is built the first time
 * it is shown, so only the floors actually visited are fetched.
 * `facing` ({ group, angle }) opens that group on a chosen direction instead: `angle` is a yaw plus
 * the scene's heading, so one angle faces the same way in every scene of the group.
 */
const wrap = (a) => Math.atan2(Math.sin(a), Math.cos(a))

export default function PanoramaViewer({ scenes, active, autorotate = true, mouseViewMode = 'drag', facing = null }) {
  const host = useRef(null)
  const state = useRef({})

  useEffect(() => {
    const viewer = new Marzipano.Viewer(host.current, { controls: { mouseViewMode }, stage: { progressive: true } })
    const made = new Map()
    const sceneFor = (key) => {
      if (made.has(key)) return made.get(key)
      const { tiles, data, heading = 0, group } = scenes.find((s) => s.key === key)
      const source = Marzipano.ImageUrlSource.fromString(`${tiles}/{z}/{f}/{y}/{x}.jpg`, { cubeMapPreviewUrl: `${tiles}/preview.jpg` })
      const geometry = new Marzipano.CubeGeometry(data.levels)
      const limiter = Marzipano.RectilinearView.limit.traditional(data.faceSize, (100 * Math.PI) / 180, (120 * Math.PI) / 180)
      const view = new Marzipano.RectilinearView(data.initialViewParameters, limiter)
      const entry = { scene: viewer.createScene({ source, geometry, view, pinFirstLevel: true }), view, start: data.initialViewParameters, heading, group }
      made.set(key, entry)
      return entry
    }
    // the scene last shown from each group
    state.current = { viewer, sceneFor, last: {} }
    return () => {
      state.current = {}
      viewer.destroy()
    }
  }, [scenes, mouseViewMode])

  // A group's first scene opens on its exported starting view, or on `facing`. From then on the view
  // carries over from the group's last scene, turned by the difference in their headings, so a change
  // of tower, floor or time of day keeps facing the same way, and coming back to a group picks up
  // where it was left. Then it turns slowly until the visitor takes over.
  useEffect(() => {
    const { viewer, sceneFor, shown, last } = state.current
    if (!viewer) return
    const next = sceneFor(active)
    viewer.stopMovement()
    viewer.setIdleMovement(Infinity)
    if (next !== shown) {
      const from = last[next.group]
      if (!from) next.view.setParameters(facing?.group === next.group ? { ...next.start, yaw: wrap(facing.angle - next.heading) } : next.start)
      else if (from !== next) {
        const { yaw, pitch, fov } = from.view.parameters()
        next.view.setParameters({ yaw: yaw + from.heading - next.heading, pitch, fov })
      }
      next.scene.switchTo({ transitionDuration: 900 })
      state.current.shown = last[next.group] = next
    }
    if (autorotate && !reduced()) {
      const spin = Marzipano.autorotate({ yawSpeed: 0.03, targetPitch: 0, targetFov: Math.PI / 2 })
      viewer.startMovement(spin)
      viewer.setIdleMovement(3000, spin)
    }
  }, [active, scenes, autorotate, mouseViewMode, facing])

  return <div ref={host} className="absolute inset-0 cursor-grab active:cursor-grabbing" />
}
