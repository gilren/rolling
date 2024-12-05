import './style.css';

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import gsap from 'gsap';
import Stats from 'three/addons/libs/stats.module.js';
import GUI from 'lil-gui';
import { Terrain } from './Terrain';

import { SHOW_ALL, SIZE, SPEED } from './settings';
import { CubeManager } from './CubeManager';

class App {
  scene!: THREE.Scene;
  camera!: THREE.PerspectiveCamera;
  renderer!: THREE.WebGLRenderer;
  controls!: OrbitControls;
  stats!: Stats;
  gui!: GUI;

  width: number;
  height: number;

  terrain!: Terrain;

  cubeManager!: CubeManager;

  size: number = SIZE;
  speed: number = SPEED;

  showAll: boolean = SHOW_ALL;

  constructor(size: number = SIZE) {
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.size = size;

    this.initStats();
    this.initScene();
    this.initLights();
    this.initManagers();
    this.addObjects();

    this.initGui();
    window.addEventListener('resize', this.onResize.bind(this));
  }

  initScene() {
    this.scene = new THREE.Scene();

    const canvas = document.querySelector('canvas');
    if (!canvas) {
      throw new Error('Could not find canvas');
    }

    canvas.width = this.width;
    canvas.height = this.height;

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

    this.camera.position.set(0, 15, 15);
    this.controls = new OrbitControls(this.camera, canvas);
    this.renderer.setAnimationLoop(this.render.bind(this));
  }

  initManagers() {
    this.cubeManager = new CubeManager(this.scene, this.size, this.speed);
  }

  initStats() {
    this.stats = new Stats();
    document.body.appendChild(this.stats.dom);
  }

  initGui() {
    this.gui = new GUI();

    this.gui.add(this, 'size', 2, 10, 1).name('Size');
    this.gui.add(this, 'speed', 0, 1, 0.05).name('Speed');

    this.gui.onChange(() => {
      this.resetScene();
    });
  }

  setupResize() {
    window.addEventListener('resize', this.onResize.bind(this));
  }

  initHelpers() {
    const axesHelper = new THREE.AxesHelper(5);
    this.scene.add(axesHelper);
  }

  initLights() {
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
  }

  onResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
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

    this.cubeManager.reset();
    this.initStats();
    this.initScene();
    this.addObjects();
    this.initManagers();
    this.initLights();

    this.renderer.render(this.scene, this.camera);
  }
}

new App();
