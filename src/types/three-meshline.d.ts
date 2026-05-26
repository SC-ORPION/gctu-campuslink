declare module 'three.meshline' {
  export class MeshLine extends THREE.BufferGeometry {
    constructor();
    setPoints(points: THREE.Vector3[] | number[], widthCallback?: (p: number) => number): void;
    setGeometry(geometry: THREE.BufferGeometry, widthCallback?: (p: number) => number): void;
  }

  export class MeshLineMaterial extends THREE.ShaderMaterial {
    constructor(parameters: {
      color?: THREE.Color | string | number;
      opacity?: number;
      transparent?: boolean;
      depthWrite?: boolean;
      lineWidth?: number;
      resolution?: THREE.Vector2;
      sizeAttenuation?: number;
      near?: number;
      far?: number;
    });
  }
}
