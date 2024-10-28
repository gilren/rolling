import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import gsap from 'gsap';
import {
  pathIndicator,
  randomInt,
  randomWithExclusion,
  Reference,
  shuffle,
  sounds,
  vectorToKey,
} from './utils/utils';
import { COLORS, DELAY, ITERATIVE, SHOW_ALL, SHUFFLE, SPEED } from './settings';

export class CubeManager {
  instance!: THREE.InstancedMesh;

  references: Reference[] = [];

  count: number;

  scene: THREE.Scene;
  size: number;

  sounds: { pop: Howl; roll: Howl; squeakIn: Howl; squeakOut: Howl } = sounds;

  colors = COLORS;

  stepIndex: number = 0;

  speed: number = SPEED;
  delay: number = DELAY;
  shuffle: boolean = SHUFFLE;
  iterative: boolean = ITERATIVE;
  showAll: boolean = SHOW_ALL;

  path: THREE.Vector3[] | null = null;

  constructor(scene: THREE.Scene, size: number) {
    this.scene = scene;
    this.size = size;
    this.count = Math.pow(size, 3);

    this.initializeCubes();

    // fake cubes for testing
    // const ref: Reference = {
    //   start: new THREE.Vector3(0.5, 0.5, 0.5),
    //   destination: new THREE.Vector3(0.5, 0.5, 0.5),
    //   current: new THREE.Vector3(0.5, 0.5, 0.5),
    //   isAtDestination: true,
    //   isVisible: true,
    // };
    // const ref2: Reference = {
    //   start: new THREE.Vector3(1.5, 0.5, -0.5),
    //   destination: new THREE.Vector3(1.5, 0.5, -0.5),
    //   current: new THREE.Vector3(1.5, 0.5, -0.5),
    //   isAtDestination: true,
    //   isVisible: true,
    // };
    // const ref3: Reference = {
    //   start: new THREE.Vector3(1.5, 0.5, 1.5),
    //   destination: new THREE.Vector3(1.5, 0.5, 1.5),
    //   current: new THREE.Vector3(1.5, 0.5, 1.5),
    //   isAtDestination: true,
    //   isVisible: true,
    // };

    // this.references.push(ref);
    // this.references.push(ref2);
    // this.references.push(ref3);

    // const geometry = new RoundedBoxGeometry(1, 1, 1, 5, 0.0625);
    // const material = new THREE.MeshPhongMaterial({ color: 0x00ff00 });
    // const mesh = new THREE.Mesh(geometry, material);

    // mesh.position.set(ref.current.x, ref.current.y, ref.current.z);
    // this.scene.add(mesh);

    // const mesh2 = new THREE.Mesh(geometry, material);
    // mesh2.position.set(ref2.current.x, ref2.current.y, ref2.current.z);
    // this.scene.add(mesh2);

    // const mesh3 = new THREE.Mesh(geometry, material);
    // mesh3.position.set(ref3.current.x, ref3.current.y, ref3.current.z);
    // this.scene.add(mesh3);

    // console.log(this.references);
    this.showCube(this.stepIndex);

    // this.revealCube(this.stepIndex).then(() => this.searchPath(this.stepIndex));
    // this.searchPath(this.stepIndex);
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
          this.instance.setMatrixAt(index, startPosition.matrix);

          this.instance.setColorAt(
            index,
            new THREE.Color(
              this.colors[Math.floor(Math.random() * this.colors.length)]
            )
          );

          index++;
          const ref: Reference = {
            id: `${endX},${endY},${endZ}`,
            start: startPosition.position,
            destination: new THREE.Vector3(endX, endY, endZ),
            current: startPosition.position,
            isAtDestination: false,
            isVisible: false,
          };

          this.references.push(ref);
        }
      }
    }
    if (this.shuffle) {
      this.references = shuffle(this.references);
    }

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

  showCube(index: number) {
    if (index === this.count) return;

    const ref = this.references[index];

    const currentMatrix = new THREE.Matrix4();
    this.instance.getMatrixAt(index, currentMatrix);

    const path = this.findPathToDestination(index);

    // console.log(index, path);

    const sphere = new THREE.SphereGeometry(0.1);
    const color = new THREE.Color(0x0000ff);
    color.setHex(Math.random() * 0xffffff);

    // this.scene.add(pathIndicator(ref.start));

    path?.forEach((position) => {
      const mesh = new THREE.Mesh(
        sphere,
        new THREE.MeshBasicMaterial({ color: color })
      );
      mesh.position.set(position.x, position.y, position.z);
      this.scene.add(mesh);
    });

    const tl = gsap.timeline({
      onComplete: () => {
        if (this.iterative) {
          this.animateMovementAlongPath(index, path!).then(() => {
            // if (this.stepIndex < 1) {
            ref.isVisible = true;
            this.stepIndex++;
            this.showCube(this.stepIndex);
            // }
          });
        }
      },
    });

    // Reference this so we can clear it after
    if (!this.iterative) {
      setTimeout(() => {
        this.stepIndex++;
        this.animateMovementAlongPath(index, this.path!);
      }, this.delay);
    }

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
        setTimeout(() => {}, (this.speed * 1.5) / 10);
      },

      onUpdate: () => {
        currentMatrix.makeScale(scale.x, scale.y, scale.z);
        currentMatrix.setPosition(revealPosition);

        this.updateInstanceMatrix(index, currentMatrix);
      },
    });

    console.log(ref);

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
        onComplete: () => {},
      },
      '<'
    );
  }

  async animateMovementAlongPath(
    index: number,
    paths: THREE.Vector3[]
  ): Promise<void> {
    const ref = this.references[index];
    let currentPosition = new THREE.Vector3().copy(ref.current);

    console.log('PATHS', paths);

    return new Promise(async (resolve) => {
      for (const path of paths) {
        // Calculate the direction to move on this step
        const diffX = path.x - currentPosition.x;
        const diffY = path.y - currentPosition.y;
        const diffZ = path.z - currentPosition.z;

        const direction =
          diffX !== 0
            ? { x: diffX }
            : diffY !== 0
            ? { y: diffY }
            : { z: diffZ };
        const axis = Object.keys(direction)[0];
        const value = direction[axis];

        await this.animateMovementInDirection(ref, axis, value, index); // Await each movement step to enforce sequence
        currentPosition = new THREE.Vector3().copy(path); // Update current position after each step
      }

      ref.isAtDestination = true;
      resolve(); // Resolves once all steps are complete
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
        // Resolve promise when this timeline completes
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

  findPathToDestination(index: number): THREE.Vector3[] | null {
    const ref = this.references[index];

    console.log(
      `START : ${ref.start.x}, ${ref.start.y}, ${ref.start.z} => DESTINATION : ${ref.destination.x}, ${ref.destination.y}, ${ref.destination.z}`
    );
    // console.log(this.references);

    const start = ref.start;
    const destination = ref.destination;

    // console.log(ref.current.y);

    // destination.y = 0.5;

    // If destination is higher in the y axis and no cube is beneath it, go to the next cube

    // this.scene.add(pathIndicator(destination, 0xff0000));

    if (
      start.x === destination.x &&
      start.y === destination.y &&
      start.z === destination.z
    )
      return [];

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

      if (
        candidate.x === destination.x &&
        candidate.y === destination.y &&
        candidate.z === destination.z
      ) {
        // console.log(`Path found (visited ${counter} candidates)`);
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

    // console.log(`CURR : ${curr.x}, ${curr.y}, ${curr.z}`);
    while (vectorToKey(curr) !== vectorToKey(start)) {
      const prev = cameFrom.get(vectorToKey(curr));
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

    let isGoingUp = false;
    let isGoingDown = false;

    // Check each primary direction
    const directions = [
      { dx: 0, dz: -1 }, // NORTH
      { dx: 1, dz: 0 }, // EAST
      { dx: 0, dz: 1 }, // SOUTH
      { dx: -1, dz: 0 }, // WEST
    ];

    for (const { dx, dz } of directions) {
      const neighborPosition = new THREE.Vector3(x + dx, y, z + dz);
      neighbors.push(neighborPosition);

      // UP
      if (
        this.findCubeReferenceAtPosition(neighborPosition)?.isAtDestination &&
        !isGoingUp
      ) {
        const upwardPosition = new THREE.Vector3(x, y + 1, z);
        neighbors.push(upwardPosition);
        isGoingUp = true;
      }

      // DOWN
      if (y > 0.5 && !isGoingDown) {
        const neighborDownWardPosition = new THREE.Vector3(
          x + dx,
          y - 1,
          z + dz
        );
        if (!this.findCubeReferenceAtPosition(neighborDownWardPosition)) {
          const upwardPosition = new THREE.Vector3(x, y - 1, z);
          neighbors.push(upwardPosition);
          isGoingDown = true;
        }
      }
    }

    const newCost = cost.get(vectorToKey(cubePosition))! + 1;

    neighbors = neighbors
      .filter((neighbor) => {
        if (
          !cost.has(vectorToKey(neighbor)) ||
          newCost < cost.get(vectorToKey(neighbor))!
        ) {
          // Assign additional costs based on movement type
          if (neighbor.y > cubePosition.y) {
            cost.set(vectorToKey(neighbor), newCost + 2); // Moving up, higher cost
          } else if (neighbor.y < cubePosition.y) {
            cost.set(vectorToKey(neighbor), newCost + 1); // Moving down, moderate cost
          } else {
            cost.set(vectorToKey(neighbor), newCost); // Horizontal move, standard cost
          }
          return true;
        } else {
          return false;
        }
      })
      .filter((neighbor) => {
        const ref = this.findCubeReferenceAtPosition(neighbor);
        return !(ref && ref.isVisible);
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
    return (
      this.references.find(
        (ref) =>
          ref.current.x === position.x &&
          ref.current.y === position.y &&
          ref.current.z === position.z
      ) || null
    );
  }
}
