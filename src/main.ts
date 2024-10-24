import './style.css';

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import gsap from 'gsap';
import { Cube } from './Cube';
import Stats from 'three/addons/libs/stats.module.js';
import GUI from 'lil-gui';
import { Terrain } from './Terrain';

class App {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
  controls: OrbitControls;
  stats!: Stats;
  gui!: GUI;

  oneByOne: boolean = true;

  width: number;
  height: number;
  time: number;
  isPlaying: boolean;

  terrain!: Terrain;
  grid: THREE.Vector3[] = [];
  size: number;

  currentCube!: Cube;
  cubeCount: number = 0;

  stepIndex: number = 0;

  constructor(size: number = 20) {
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.size = size;

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
      30,
      this.width / this.height,
      0.1,
      1000
    );

    this.camera.position.set(0, 30, 30);
    this.controls = new OrbitControls(this.camera, canvas);
    this.time = 0;
    this.isPlaying = true;

    this.setGrid();
    this.addLights();
    this.addObjects();
    this.setStats();
    this.setGui();
    this.resize();
    this.setupResize();

    this.getHelpers();

    this.renderer.setAnimationLoop(this.render.bind(this));
  }

  setStats() {
    this.stats = new Stats();
    document.body.appendChild(this.stats.dom);
  }

  setGui() {
    this.gui = new GUI();

    const appFolder = this.gui.addFolder('App');
    appFolder.add(this, 'size', 2, 10, 1).name('Size');
    appFolder.add(this, 'oneByOne');
    appFolder.onChange(() => {
      this.resetScene();
    });
  }

  setGrid() {
    for (let z = 0; z < this.size; z++) {
      for (let x = this.size - 1; x >= 0; x--) {
        for (let y = 0; y < this.size; y++) {
          this.grid.push(new THREE.Vector3(x + 0.5, y + 0.5, z + 0.5));
        }
      }
    }
    console.log(this.grid);
  }

  // 0 // n-1, 0, 0
  // 1 // n-1, 1, 0
  // 2 // n-1, 2, 0
  // 3 // n-2, 0, 0
  // 4 // n-2, 1, 0
  // 5 // n-1, 3, 0

  // 6 // n-2, 2, 0

  getHelpers() {
    const axesHelper = new THREE.AxesHelper(5); // Size of the axes
    this.scene.add(axesHelper);
    // const cameraHelper = new THREE.CameraHelper(this.camera);
    // this.scene.add(cameraHelper);
    // const pointLightHelper = new THREE.PointLightHelper(pointLight, 1); // 1 is the size
    // scene.add(pointLightHelper);
    // const directionalLightHelper = new THREE.DirectionalLightHelper(
    //   directionalLight,
    //   5
    // ); // Size of the helper
    // scene.add(directionalLightHelper);
    // const spotLightHelper = new THREE.SpotLightHelper(spotLight);
    // scene.add(spotLightHelper);
  }

  setupResize() {
    window.addEventListener('resize', this.resize.bind(this));
  }

  resize() {
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.renderer.setSize(this.width, this.height);
    this.camera.aspect = this.width / this.height;
    this.camera.updateProjectionMatrix();
  }

  addObjects() {
    this.terrain = new Terrain(this.size);
    this.scene.add(this.terrain);

    this.createCube();
    // const cube2 = new Cube(1, 0, 0, 1, this.size - 1);
    // this.scene.add(cube2);
  }

  addLights() {
    const sun = new THREE.DirectionalLight();
    sun.position.set(1, 2, 3);

    this.scene.add(sun);

    const ambiant = new THREE.AmbientLight();
    ambiant.intensity = 0.5;

    this.scene.add(ambiant);
  }

  render() {
    this.stats.update();
    if (!this.isPlaying) return;
    this.time += 0.05;
    // requestAnimationFrame(this.render.bind(this));

    if (this.currentCube.isInPlace) {
      this.createCube();
    } else if (!this.oneByOne) {
      this.createCube();
    }

    this.renderer.render(this.scene, this.camera);

    // console.log(
    //   `Camera Position: x=${this.camera.position.x}, y=${this.camera.position.y}, z=${this.camera.position.z}`
    // );
    // console.log(
    //   `Camera Rotation: x=${this.camera.rotation.x}, y=${this.camera.rotation.y}, z=${this.camera.rotation.z}`
    // );
  }

  // stop() {
  //   this.isPlaying = false;
  // }

  // play() {
  //   if (!this.isPlaying) {
  //     this.isPlaying = true;
  //     this.render();
  //   }
  // }

  createCube() {
    if (this.cubeCount === Math.pow(this.size, 3)) return;
    this.currentCube = new Cube(-1, 0, 0, 1);
    const nextPosition = this.grid.shift();
    if (nextPosition) {
      this.currentCube.moveTo(nextPosition);
    }
    this.scene.add(this.currentCube);
    this.cubeCount++;
    console.log(this.cubeCount);
  }

  resetScene() {
    for (let i = this.scene.children.length - 1; i >= 0; i--) {
      const obj = this.scene.children[i];

      if (!(obj instanceof THREE.Light)) {
        this.scene.remove(obj);
      }
    }

    this.grid = [];
    this.cubeCount = 0;

    this.setGrid();

    this.addObjects();

    this.renderer.render(this.scene, this.camera);
  }
}

new App(4);
