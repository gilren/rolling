import * as THREE from 'three';

export class Terrain extends THREE.Mesh {
  size: number;

  constructor(size: number) {
    super();

    this.size = size;

    this.createGometry();
    this.material = new THREE.MeshStandardMaterial({
      color: 0xcccccc,
    });

    this.rotation.x = -Math.PI / 2;
    this.receiveShadow = true;
  }

  public createGometry() {
    this.geometry?.dispose();
    this.geometry = new THREE.PlaneGeometry(this.size, this.size);
    this.position.set(this.size / 2, 0, this.size / 2);
  }
}
