import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import gsap from 'gsap';
import { PriorityQueue } from '@datastructures-js/priority-queue';
import {
  randomInt,
  randomWithExclusion,
  Reference,
  sounds,
  vectorToKey,
} from './utils/utils';
import { COLORS, DELAY, ITERATIVE, SHOW_ALL, SHUFFLE, SPEED } from './settings';

export class CubeManager {
  instance!: THREE.InstancedMesh;

  references: Reference[];

  queue: PriorityQueue<Reference>;

  count: number;

  scene: THREE.Scene;
  size: number;

  sounds: { pop: Howl; roll: Howl; squeakIn: Howl; squeakOut: Howl } = sounds;

  stepIndex: number = 0;

  // Options
  colors = COLORS;
  speed: number = SPEED;
  delay: number = DELAY;
  shuffle: boolean = SHUFFLE;
  iterative: boolean = ITERATIVE;
  showAll: boolean = SHOW_ALL;

  constructor(scene: THREE.Scene, size: number) {
    this.scene = scene;
    this.size = size;
    this.count = Math.pow(size, 3);

    this.queue = new PriorityQueue((a, b) => {
      if (a.destination.y > b.destination.y) {
        return 1;
      } else {
        return -1;
      }
    });

    this.references = [];

    this.initializeCubes();
    this.processQueue();

    // setTimeout(() => {
    //   this.processQueue();
    // }, 2000);
  }

  async processQueue() {
    while (!this.queue.isEmpty()) {
      const ref = this.queue.dequeue();

      await this.showCube(ref);
      this.references.push(ref);

      const path = this.findPathToDestination(ref);

      // const sphere = new THREE.SphereGeometry(0.1);
      // const color = new THREE.Color(0x0000ff);
      // color.setHex(Math.random() * 0xffffff);

      // path?.forEach((position) => {
      //   const mesh = new THREE.Mesh(
      //     sphere,
      //     new THREE.MeshBasicMaterial({ color: color })
      //   );
      //   mesh.position.set(position.x, position.y, position.z);
      //   this.scene.add(mesh);
      // });

      if (path) {
        await this.animateMovementAlongPath(ref, path);
      } else {
        console.error('Could not find path');
      }
    }
  }

  initializeCubes() {
    const geometry = new RoundedBoxGeometry(1, 1, 1, 5, 0.0625);
    const material = new THREE.MeshPhongMaterial({});
    this.instance = new THREE.InstancedMesh(geometry, material, this.count);

    this.instance.castShadow = true;
    this.instance.receiveShadow = true;

    let index = 0;

    for (let z = 0; z < this.size; z++) {
      for (let x = this.size - 1; x >= 0; x--) {
        for (let y = 0; y < this.size; y++) {
          const endX = x + 0.5;
          const endY = y + 0.5;
          const endZ = z + 0.5;

          const startPosition = this.generateRandomStartPosition();

          this.instance.setColorAt(
            index,
            new THREE.Color(
              this.colors[Math.floor(Math.random() * this.colors.length)]
            )
          );

          const ref: Reference = {
            id: index,
            start: startPosition.position,
            destination: new THREE.Vector3(endX, endY, endZ),
            current: startPosition.position,
            isAtDestination: false,
          };

          this.updateInstanceMatrix(index, startPosition.matrix);
          this.queue.enqueue(ref);
          index++;
        }
      }
    }
    // if (this.shuffle) {
    //   this.references = shuffle(this.references);
    // }

    this.scene.add(this.instance);
  }

  generateRandomStartPosition(): {
    position: THREE.Vector3;
    matrix: THREE.Matrix4;
  } {
    const matrix = new THREE.Matrix4();
    const startZ =
      Math.floor(randomInt(-this.size, this.size + this.size)) + 0.5;

    let startX = 0;
    if (startZ > -0.5 && startZ < this.size) {
      startX =
        Math.floor(
          randomWithExclusion(
            -this.size,
            this.size + this.size,
            -0.5,
            this.size + 0.5
          )
        ) + 0.5;
    } else {
      startX =
        Math.floor(randomInt(-this.size / 2, this.size + this.size / 2)) + 0.5;
    }

    if (!this.showAll) {
      matrix.makeScale(0, 0, 0);
    }
    matrix.setPosition(startX, 0.5, startZ);

    return {
      position: new THREE.Vector3(startX, 0.5, startZ),
      matrix: matrix,
    };
  }

  showCube(ref: Reference): Promise<void> {
    return new Promise((resolve) => {
      const index = ref.id;
      const currentMatrix = new THREE.Matrix4();
      this.instance.getMatrixAt(index, currentMatrix);

      const tl = gsap.timeline({
        onComplete: () => {
          resolve();
        },
      });

      const revealPosition = new THREE.Vector3();
      revealPosition.copy(ref.current);
      revealPosition.y = this.size + Math.random() * 5;
      currentMatrix.setPosition(revealPosition);
      this.updateInstanceMatrix(index, currentMatrix);

      let scale = new THREE.Vector3();
      tl.to(scale, {
        x: 1,
        y: 1,
        z: 1,
        duration: this.speed * 1.5,
        ease: 'power2.out',

        onStart: () => {
          // TODO: Find a cleaner way to do this ?
          this.sounds.pop.play();
          // setTimeout(() => {
          // }, (this.speed * 1.5) / 10);
        },

        onUpdate: () => {
          currentMatrix.makeScale(scale.x, scale.y, scale.z);
          currentMatrix.setPosition(revealPosition);
          this.updateInstanceMatrix(index, currentMatrix);
        },
      });

      tl.to(revealPosition, {
        y: 0.5,
        duration: this.speed,
        ease: 'power2.inOut',

        onUpdate: () => {
          currentMatrix.setPosition(revealPosition);
          this.updateInstanceMatrix(index, currentMatrix);
        },
      });

      let scale2 = new THREE.Vector3(1, 1, 1);
      tl.to(
        scale2,
        {
          x: 1.25,
          y: 0.5,
          z: 1.25,
          duration: this.speed / 2,
          ease: 'power2.inOut',

          onStart: () => {
            this.sounds.squeakIn.play();
          },

          onUpdate: () => {
            currentMatrix.makeScale(scale2.x, scale2.y, scale2.z);
            currentMatrix.setPosition(revealPosition);
            this.updateInstanceMatrix(index, currentMatrix);
          },
        },
        `-=${this.speed / 10}`
      );

      tl.to(
        revealPosition,
        {
          y: 0,
          duration: this.speed / 4,
          ease: 'power2.inOut',

          onUpdate: () => {
            currentMatrix.setPosition(revealPosition);
            this.updateInstanceMatrix(index, currentMatrix);
          },
        },
        '<'
      );

      tl.to(revealPosition, {
        y: 0.5,
        duration: this.speed / 4,
        ease: 'power2.inOut',

        onComplete: () => {
          this.sounds.squeakOut.play();
        },
      });

      tl.to(
        scale2,
        {
          x: 1,
          y: 1,
          z: 1,
          duration: this.speed / 2,
          ease: 'power2.inOut',
          onUpdate: () => {
            currentMatrix.makeScale(scale2.x, scale2.y, scale2.z);
            currentMatrix.setPosition(revealPosition);

            this.updateInstanceMatrix(index, currentMatrix);
          },
        },
        '<'
      );
    });
  }

  async animateMovementAlongPath(
    ref: Reference,
    paths: THREE.Vector3[]
  ): Promise<void> {
    return new Promise(async (resolve) => {
      const index = ref.id;
      let currentPosition = new THREE.Vector3().copy(ref.current);
      for (const path of paths) {
        const diffX = path.x - currentPosition.x;
        const diffY = path.y - currentPosition.y;
        const diffZ = path.z - currentPosition.z;

        const direction =
          diffX !== 0
            ? { x: diffX }
            : diffY !== 0
            ? { y: diffY }
            : { z: diffZ };
        const axis = Object.keys(direction)[0] as 'x' | 'y' | 'z';
        const value = direction[axis] as number;

        await this.animateMovementInDirection(ref, axis, value, index);
        currentPosition = new THREE.Vector3().copy(path);
      }

      ref.isAtDestination = true;
      resolve();
    });
  }

  animateMovementInDirection(
    ref: Reference,
    axis: 'x' | 'y' | 'z',
    value: number,
    index: number
  ): Promise<void> {
    return new Promise((resolve) => {
      const rotationAxis = axis === 'x' ? 'z' : axis === 'z' ? 'x' : 'z';
      let rotationAngle =
        (axis === 'x' && value > 0) || (axis === 'z' && value < 0)
          ? -Math.PI / 2
          : Math.PI / 2;

      const currentRotation = new THREE.Euler(0, 0, 0);
      const tempTimeline = gsap.timeline({
        onComplete: () => resolve(),
      });

      // Animate rotation
      tempTimeline.to(currentRotation, {
        [rotationAxis]: rotationAngle,
        duration: this.speed,
        ease: 'power2.inOut',
        onComplete: () => {
          this.sounds.roll.play();
        },
      });

      // Animate movement
      tempTimeline.to(
        ref.current,
        {
          [axis]: ref.current[axis] + value,
          duration: this.speed,
          ease: 'power2.inOut',
          onUpdate: () => {
            const matrix = new THREE.Matrix4();
            const quaternion = new THREE.Quaternion().setFromEuler(
              currentRotation
            );
            matrix.compose(ref.current, quaternion, new THREE.Vector3(1, 1, 1));
            this.updateInstanceMatrix(index, matrix);
          },
        },
        '<'
      );
    });
  }

  findPathToDestination(ref: Reference): THREE.Vector3[] | null {
    console.log(
      `START: ${ref.start.x}, ${ref.start.y}, ${ref.start.z} => DESTINATION: ${ref.destination.x}, ${ref.destination.y}, ${ref.destination.z}`
    );

    const start = ref.start;
    const destination = ref.destination;

    //TODO: Verify possibility of happening, might be useless
    if (start.equals(destination)) return [];

    let pathFound = false;
    const distance = 40;

    const cameFrom: Map<string, THREE.Vector3> = new Map();
    const cost: Map<string, number> = new Map();
    const frontier = [start];
    cost.set(vectorToKey(start), 0);

    let counter = 0;
    while (frontier.length > 0) {
      frontier.sort((v1, v2) => {
        const d1 = start.manhattanDistanceTo(v1);
        const d2 = start.manhattanDistanceTo(v2);
        return d1 - d2;
      });

      counter++;

      const candidate = frontier.shift()!;

      if (candidate.equals(destination)) {
        console.log(`Path found (visited ${counter} candidates)`);
        pathFound = true;
        break;
      }

      if (candidate.manhattanDistanceTo(start) > distance) {
        continue;
      }

      const neighbors = this.getNeighbors(candidate, cost);
      frontier.push(...neighbors);

      neighbors.forEach((neighbor) => {
        cameFrom.set(vectorToKey(neighbor), candidate);
      });
    }

    if (!pathFound) return null;

    let curr = destination;
    const path = [curr];

    while (vectorToKey(curr) !== vectorToKey(start)) {
      const prev = cameFrom.get(vectorToKey(curr)) as THREE.Vector3;
      path.push(prev);
      curr = prev;
    }

    path.reverse();
    path.shift();

    return path;
  }

  getNeighbors(cubePosition: THREE.Vector3, cost: Map<string, number>) {
    let neighbors: THREE.Vector3[] = [];
    const { x, y, z } = cubePosition;

    const directions = new Map<string, { dx: number; dy: number; dz: number }>([
      ['NORTH', { dx: 0, dy: 0, dz: -1 }],
      ['EAST', { dx: 1, dy: 0, dz: 0 }],
      ['SOUTH', { dx: 0, dy: 0, dz: 1 }],
      ['WEST', { dx: -1, dy: 0, dz: 0 }],
      ['DOWN', { dx: 0, dy: -1, dz: 0 }],
      ['UP', { dx: 0, dy: 1, dz: 0 }],
    ]);

    const belowCurrentPosition = new THREE.Vector3(x, y - 1, z);
    const isSupported =
      y === 0.5 || this.findCubeReferenceAtPosition(belowCurrentPosition);

    // Determine neighbors based on movement type
    for (const [directionKey, { dx, dy, dz }] of directions) {
      // Skip DOWN at ground level
      if (y === 0.5 && directionKey === 'DOWN') continue;

      const neighborPosition = new THREE.Vector3(x + dx, y + dy, z + dz);

      // Handle elevated positions
      if (y > 0.5) {
        if (directionKey === 'DOWN') {
          // Move down if unsupported
          if (!isSupported) neighbors.push(neighborPosition);
        } else if (directionKey === 'UP') {
          // Move up is always allowed
          neighbors.push(neighborPosition);
        } else {
          // Horizontal move only if there’s support below target position
          const belowNeighborPosition = new THREE.Vector3(
            neighborPosition.x,
            neighborPosition.y - 1,
            neighborPosition.z
          );

          if (
            !isSupported &&
            !this.findCubeReferenceAtPosition(belowNeighborPosition)
          )
            continue;
          neighbors.push(neighborPosition);
        }
      } else {
        // Ground level, allow all directions except DOWN (already checked)
        neighbors.push(neighborPosition);
      }
    }

    const newCost = cost.get(vectorToKey(cubePosition))! + 1;

    // Filter out neighbors that already have a cube in place
    neighbors = neighbors.filter(
      (neighbor) => !this.findCubeReferenceAtPosition(neighbor)
    );

    // Update cost map for each valid neighbor
    neighbors = neighbors.filter((neighbor) => {
      if (
        !cost.has(vectorToKey(neighbor)) ||
        newCost < cost.get(vectorToKey(neighbor))!
      ) {
        // Assign cost based on movement direction
        let movementCost = newCost;
        if (neighbor.y > cubePosition.y) {
          // Moving up, higher cost
          movementCost = newCost + 2;
        } else if (neighbor.y < cubePosition.y) {
          // Moving down, moderate cost
          movementCost = newCost + 1;
        }
        cost.set(vectorToKey(neighbor), movementCost);
        return true;
      } else {
        return false;
      }
    });

    return neighbors;
  }

  updateInstanceMatrix(index: number, matrix: THREE.Matrix4) {
    this.instance.setMatrixAt(index, matrix);
    this.instance.instanceMatrix.needsUpdate = true;
  }

  reset() {
    this.references = [];
    this.instance.clear();
    this.stepIndex = 0;
  }

  findCubeReferenceAtPosition(position: THREE.Vector3) {
    return this.references.find((ref: Reference) =>
      ref.current.equals(position)
    );
  }
}
