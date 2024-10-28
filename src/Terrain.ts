import { clamp } from './utils/utils';
import * as THREE from 'three';

export class Terrain extends THREE.Mesh {
  size: number;

  constructor(size: number) {
    super();

    this.size = size;

    this.createGometry();
    this.material = new THREE.MeshToonMaterial({
      color: 0xcccccc,
      // wireframe: true,
    });

    this.rotation.x = -Math.PI / 2;
    this.receiveShadow = true;
  }

  public createGometry() {
    this.geometry?.dispose();
    const size = clamp(Math.pow(this.size, 1.5), 10, Infinity);
    const segments = Math.floor(size);

    this.geometry = new THREE.PlaneGeometry(size, size, segments, segments);
    this.position.set(this.size / 2, 0, this.size / 2);
  }
}
