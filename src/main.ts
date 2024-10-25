import './style.css';

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import gsap from 'gsap';
import Stats from 'three/addons/libs/stats.module.js';
import GUI from 'lil-gui';
import { Terrain } from './Terrain';
import {
  randomInt,
  randomWithExclusion,
  shuffle,
  soundPop,
  soundRoll,
  soundSqueakIn,
  soundSqueakOut,
} from './utils';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { COLORS, DELAY, SHUFFLE, SIZE, SPEED } from './settings';

class App {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
  controls: OrbitControls;
  stats!: Stats;
  gui!: GUI;

  width: number;
  height: number;

  terrain!: Terrain;

  size: number;
  speed: number = SPEED;
  delay: number = DELAY;
  shuffle: boolean = SHUFFLE;

  cubeInstance!: THREE.InstancedMesh;
  cubeCount: number;
  cubeTransforms: THREE.Matrix4[] = [];

  soundPop: Howl = soundPop;
  soundRoll: Howl = soundRoll;
  soundSkeakIn: Howl = soundSqueakIn;
  soundSkeakOut: Howl = soundSqueakOut;

  material!: THREE.MeshPhongMaterial;

  cubeColors = COLORS;

  stepIndex: number = 0;

  constructor(size: number = SIZE) {
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.size = size;
    this.cubeCount = Math.pow(this.size, 3);

    const canvas = document.querySelector('canvas');
    if (!canvas) {
      throw new Error('Could not find canvas');
    }

    canvas.width = this.width;
    canvas.height = this.height;

    this.scene = new THREE.Scene();

    this.renderer = new THREE.WebGLRenderer({ canvas: canvas });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(this.width, this.height);
    this.renderer.setClearColor(0xeeeeee, 1);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    this.camera = new THREE.PerspectiveCamera(
      75,
      this.width / this.height,
      0.001,
      1000
    );

    this.camera.position.set(0, 30, 30);
    this.controls = new OrbitControls(this.camera, canvas);

    this.init();

    window.addEventListener('resize', this.onResize.bind(this));

    this.renderer.setAnimationLoop(this.render.bind(this));
  }

  init() {
    this.addLights();
    this.addObjects();
    this.addStats();
    this.addGui();
  }

  addStats() {
    this.stats = new Stats();
    document.body.appendChild(this.stats.dom);
  }

  addGui() {
    this.gui = new GUI();

    const appFolder = this.gui.addFolder('App');
    appFolder.add(this, 'size', 2, 10, 1).name('Size');
    appFolder.add(this, 'speed', 0.1, 1, 0.05).name('Speed');
    appFolder.add(this, 'delay', 1000, 10000, 1000).name('Delay');
    appFolder.add(this, 'shuffle');
    appFolder.onChange(() => {
      this.resetScene();
    });
  }

  setHelpers() {
    const axesHelper = new THREE.AxesHelper(5);
    this.scene.add(axesHelper);
  }

  addLights() {
    const sun = new THREE.DirectionalLight();
    sun.position.set(10, 50, 20);
    sun.intensity = 3;

    sun.castShadow = true;

    sun.shadow.camera.left = -this.size * 2;
    sun.shadow.camera.right = this.size * 2;
    sun.shadow.camera.top = this.size * 2;
    sun.shadow.camera.bottom = -this.size * 2;

    sun.shadow.camera.near = 0.5;
    sun.shadow.camera.far = 500;

    sun.shadow.mapSize.width = 1024;
    sun.shadow.mapSize.height = 1024;

    this.scene.add(sun);

    const ambiant = new THREE.AmbientLight();
    ambiant.intensity = 0.5;

    this.scene.add(ambiant);
  }

  addObjects() {
    this.terrain = new Terrain(this.size);
    this.scene.add(this.terrain);

    gsap.fromTo(
      this.terrain.scale,
      {
        x: 0,
        y: 0,
        z: 0,
      },
      {
        x: 1,
        y: 1,
        z: 1,
        duration: 2,
        ease: 'elastic.out(1,0.3)',
      }
    );

    this.material = new THREE.MeshPhongMaterial({});

    const geometry = new RoundedBoxGeometry(1, 1, 1, 5, 0.0625);

    const count = Math.pow(this.size, 3);

    this.cubeInstance = new THREE.InstancedMesh(geometry, this.material, count);
    this.cubeInstance.castShadow = true;
    this.cubeInstance.receiveShadow = true;
    const matrix = new THREE.Matrix4();
    matrix.makeScale(0, 0, 0);
    let index = 0;

    for (let z = 0; z < this.size; z++) {
      for (let x = this.size - 1; x >= 0; x--) {
        for (let y = 0; y < this.size; y++) {
          const endPositionMatrix = new THREE.Matrix4();

          const endX = x + 0.5;
          const endY = y + 0.5;
          const endZ = z + 0.5;

          endPositionMatrix.setPosition(endX, endY, endZ);
          this.cubeTransforms.push(endPositionMatrix);

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
              Math.floor(randomInt(-this.size / 2, this.size + this.size / 2)) +
              0.5;
          }

          matrix.makeScale(0, 0, 0);
          matrix.setPosition(startX, this.size + Math.random() * 5, startZ);

          this.cubeInstance.setMatrixAt(index, matrix.clone());

          this.cubeInstance.setColorAt(
            index,
            new THREE.Color(
              this.cubeColors[
                Math.floor(Math.random() * this.cubeColors.length)
              ]
            )
          );

          index++;
        }
      }
    }
    if (this.shuffle) {
      this.cubeTransforms = shuffle(this.cubeTransforms);
    }

    this.scene.add(this.cubeInstance);

    this.moveCube(this.stepIndex);
  }

  moveCube(index: number) {
    if (index === this.cubeCount - 1) return;

    const targetMatrix = this.cubeTransforms[index];
    const endPosition = new THREE.Vector3();
    targetMatrix.decompose(
      endPosition,
      new THREE.Quaternion(),
      new THREE.Vector3()
    );

    const currentMatrix = new THREE.Matrix4();
    this.cubeInstance.getMatrixAt(index, currentMatrix);
    const startPosition = new THREE.Vector3();
    currentMatrix.decompose(
      startPosition,
      new THREE.Quaternion(),
      new THREE.Vector3()
    );

    let currentPosition = startPosition.clone();

    const tl = gsap.timeline({
      onComplete: () => {
        this.stepIndex++;
        this.moveCube(this.stepIndex);
      },
    });

    // Reference this so we can clear it after
    // setTimeout(() => {
    //   this.stepIndex++;
    //   this.moveCube(this.stepIndex);
    // }, this.delay);

    let scale = { value: 0 };
    tl.to(scale, {
      value: 1,
      duration: this.speed * 1.5,
      ease: 'power2.inOut',

      onStart: () => {
        this.soundPop.play();
      },

      onUpdate: () => {
        currentMatrix.makeScale(scale.value, scale.value, scale.value);
        currentMatrix.setPosition(
          currentPosition.x,
          currentPosition.y,
          currentPosition.z
        );

        this.cubeInstance.setMatrixAt(index, currentMatrix);
        this.cubeInstance.instanceMatrix.needsUpdate = true;
      },
    });

    tl.to(currentPosition, {
      y: 0.5,
      duration: this.speed,
      ease: 'power2.inOut',

      onUpdate: () => {
        currentMatrix.setPosition(
          currentPosition.x,
          currentPosition.y,
          currentPosition.z
        );

        this.cubeInstance.setMatrixAt(index, currentMatrix);
        this.cubeInstance.instanceMatrix.needsUpdate = true;
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
          this.soundSkeakIn.play();
        },

        onUpdate: () => {
          currentMatrix.makeScale(scale2.x, scale2.y, scale2.z);
          currentMatrix.setPosition(
            currentPosition.x,
            currentPosition.y,
            currentPosition.z
          );

          this.cubeInstance.setMatrixAt(index, currentMatrix);
          this.cubeInstance.instanceMatrix.needsUpdate = true;
        },
      },
      `-=${this.speed / 10}`
    );

    tl.to(
      currentPosition,
      {
        y: 0,
        duration: this.speed / 4,
        ease: 'power2.inOut',

        onUpdate: () => {
          currentMatrix.setPosition(
            currentPosition.x,
            currentPosition.y,
            currentPosition.z
          );

          this.cubeInstance.setMatrixAt(index, currentMatrix);
          this.cubeInstance.instanceMatrix.needsUpdate = true;
        },
      },
      '<'
    );

    tl.to(currentPosition, {
      y: 0.5,
      duration: this.speed / 4,
      ease: 'power2.inOut',

      onUpdate: () => {
        currentMatrix.setPosition(
          currentPosition.x,
          currentPosition.y,
          currentPosition.z
        );

        this.cubeInstance.setMatrixAt(index, currentMatrix);
        this.cubeInstance.instanceMatrix.needsUpdate = true;
      },

      onComplete: () => {
        this.soundSkeakOut.play();
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
          currentMatrix.setPosition(
            currentPosition.x,
            currentPosition.y,
            currentPosition.z
          );

          this.cubeInstance.setMatrixAt(index, currentMatrix);
          this.cubeInstance.instanceMatrix.needsUpdate = true;
        },
        onComplete: () => {
          tl.add(this.moveCubeByAxis('z', currentPosition, endPosition, index));
          tl.add(this.moveCubeByAxis('y', currentPosition, endPosition, index));
          tl.add(this.moveCubeByAxis('x', currentPosition, endPosition, index));
        },
      },
      '<'
    );
  }

  moveCubeByAxis(
    axis: 'x' | 'y' | 'z',
    currentPosition: THREE.Vector3,
    endPosition: THREE.Vector3,
    index: number
  ): gsap.core.Timeline {
    const diff = endPosition[axis] - currentPosition[axis];
    const steps = Math.abs(diff) / 1;
    let step = diff < 0 ? -1 : 1;
    const tl = gsap.timeline();

    let rotationAxis = '';

    let rotationAngle = (Math.PI / 2) * step;

    if (axis === 'x') {
      rotationAxis = 'z';
      rotationAngle *= -1;
    } else if (axis === 'z') {
      rotationAxis = 'x';
    } else if (axis === 'y') {
      rotationAxis = 'z';
      if (currentPosition.x < 0.5) {
        rotationAngle *= -1;
      }
    }

    let currentRotation = new THREE.Euler(0, 0, 0);
    for (let i = 0; i < steps; i++) {
      tl.to(currentRotation, {
        [rotationAxis]: rotationAngle * (i + 1),
        duration: this.speed,
        ease: 'power2.inOut',

        onUpdate: () => {
          const matrix = new THREE.Matrix4();

          const quaternion = new THREE.Quaternion().setFromEuler(
            currentRotation
          );

          matrix.compose(
            currentPosition,
            quaternion,
            new THREE.Vector3(1, 1, 1)
          );

          this.cubeInstance.setMatrixAt(index, matrix);
          this.cubeInstance.instanceMatrix.needsUpdate = true;
        },
        onComplete: () => {
          this.soundRoll.play();
        },
      });

      tl.to(
        currentPosition,
        {
          [axis]: currentPosition[axis] + step * (i + 1),
          duration: this.speed,
          ease: 'power2.inOut',
          onUpdate: () => {
            const matrix = new THREE.Matrix4();

            const quaternion = new THREE.Quaternion().setFromEuler(
              currentRotation
            );

            matrix.compose(
              currentPosition,
              quaternion,
              new THREE.Vector3(1, 1, 1)
            );

            this.cubeInstance.setMatrixAt(index, matrix);
            this.cubeInstance.instanceMatrix.needsUpdate = true;
          },
        },
        '<'
      );
    }

    return tl;
  }

  onResize() {
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.renderer.setSize(this.width, this.height);
    this.camera.aspect = this.width / this.height;
    this.camera.updateProjectionMatrix();
  }

  render() {
    this.stats.update();
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  }

  resetScene() {
    for (let i = this.scene.children.length - 1; i >= 0; i--) {
      const obj = this.scene.children[i];

      this.scene.remove(obj);
    }

    gsap.globalTimeline.clear();

    this.cubeTransforms = [];
    this.cubeInstance.clear();

    this.stepIndex = 0;

    this.init();

    this.renderer.render(this.scene, this.camera);
  }
}

new App();
