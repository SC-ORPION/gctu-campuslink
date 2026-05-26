declare module 'three.meshline' {
  import * as THREE from 'three'

  export class MeshLine extends THREE.BufferGeometry {
    isMeshLine: boolean
    points: THREE.Vector3[]

    constructor()
    setPoints(points: THREE.Vector3[] | Float32Array, w?: ((p: number) => number) | number): void
    dispose(): void
  }

  export class MeshLineMaterial extends THREE.ShaderMaterial {
    constructor(parameters?: {
      color?: THREE.Color | string | number
      opacity?: number
      transparent?: boolean
      depthWrite?: boolean
      lineWidth?: number
      sizeAttenuation?: number
      dashArray?: number
      dashOffset?: number
      dashRatio?: number
      resolution?: THREE.Vector2
      map?: THREE.Texture
      useMap?: boolean
      repeat?: THREE.Vector2
    })
    lineWidth: number
    color: THREE.Color
    opacity: number
    resolution: THREE.Vector2
  }
}
