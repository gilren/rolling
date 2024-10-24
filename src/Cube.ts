import * as THREE from 'three';
import gsap from 'gsap';

export class Cube extends THREE.Mesh {
  size: number;
  rollCount: number = 0;

  speed: number = 0.5;

  isInPlace: boolean = false;

  constructor(x: number, y: number, z: number, size: number) {
    super();
    this.size = size;
    this.position.x = x;
    this.position.y = y;
    this.position.z = z;
    this.castShadow = true;

    this.createGometry();
    this.material = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.8,
      metalness: 0,
    });
  }

  public createGometry() {
    this.geometry?.dispose();
    this.geometry = new THREE.BoxGeometry(this.size, this.size, this.size);
    this.position.set(
      this.position.x + this.size / 2,
      this.position.y + this.size / 2,
      this.position.z + this.size / 2
    );
  }

  rollCube(direction: 'left' | 'right' | 'front' | 'back' | 'up') {
    let axis: THREE.Vector3;
    const angle = Math.PI / 2;
    const rotationState = { progress: 0 };
    const targetPosition = this.position.clone();

    switch (direction) {
      case 'left':
        axis = new THREE.Vector3(0, 0, 1);
        targetPosition.x -= 1;
        break;
      case 'right':
        axis = new THREE.Vector3(0, 0, -1);
        targetPosition.x += 1;
        break;
      case 'front':
        axis = new THREE.Vector3(1, 0, 0);
        targetPosition.z += 1;
        break;
      case 'back':
        axis = new THREE.Vector3(-1, 0, 0);
        targetPosition.z -= 1;
        break;
      case 'up':
        axis = new THREE.Vector3(0, 0, -1);

        targetPosition.y += 1;
        break;
    }

    gsap.to(rotationState, {
      progress: 1,
      duration: this.speed,
      ease: 'power2.inOut',
      onUpdate: () => {
        const currentAngle = angle * rotationState.progress;
        this.rotation.set(0, 0, 0);
        this.rotateOnAxis(axis, currentAngle);
      },
    });

    gsap.to(this.position, {
      x: targetPosition.x,
      y: targetPosition.y,
      z: targetPosition.z,
      duration: this.speed,
      ease: 'power2.inOut',
    });
  }

  moveTo(position: THREE.Vector3) {
    // console.log(this.position, position);
    let direction: 'left' | 'right' | 'front' | 'back' | 'up' = 'left';
    if (this.position.equals(position)) {
      this.isInPlace = true;
      return;
    }

    if (this.position.x !== position.x) {
      direction = 'right';
    }

    // ony go up if has a previous block
    if (this.position.y !== position.y) {
      if (this.position.x === position.x - 1) direction = 'up';
    }

    if (this.position.z !== position.z) {
      direction = 'front';
    }

    this.rollCube(direction);

    gsap.delayedCall(this.speed, this.moveTo.bind(this, position));
  }
}
