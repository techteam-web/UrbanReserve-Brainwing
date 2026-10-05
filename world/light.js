// One sun for the whole world: the 3D lights and shadows, the map's building light and the clouds.
// Its height is the HDRI's own; the HDRI is turned so its sun comes from SUN_AZ as well.
export const SUN_AZ = 250 // degrees clockwise from north (west-south-west, late afternoon)
export const SUN_EL = 26.9 // degrees above the horizon

const R = Math.PI / 180
// direction towards the sun as [east, north, up]
export const SUN = [Math.sin(SUN_AZ * R) * Math.cos(SUN_EL * R), Math.cos(SUN_AZ * R) * Math.cos(SUN_EL * R), Math.sin(SUN_EL * R)]

// meadow_2_1k.exr is made by scripts/hdri.mjs; stood z-up, its sun sits at azimuth 126.2°.
export const HDRI = { url: '/hdri/meadow_2_1k.exr', sunAz: 126.2 }
