import * as THREE from 'three';
import { pow } from 'three/webgpu';

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
    this.geometry = new THREE.PlaneGeometry(
      Math.pow(this.size, 2.5),
      Math.pow(this.size, 2.5),
      this.size,
      this.size
    );
    this.position.set(this.size / 2, 0, this.size / 2);
  }
}
