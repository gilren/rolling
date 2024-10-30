import * as THREE from 'three';
import { Howl } from 'howler';

export const randomWithExclusion = (
  min: number,
  max: number,
  excludeMin: number,
  excludeMax: number
): number => {
  const range1 = excludeMin - min;
  const range2 = max - excludeMax;
  const totalRange = range1 + range2;

  const randomValue = Math.random() * totalRange;

  if (randomValue < range1) {
    return min + randomValue;
  } else {
    return excludeMax + (randomValue - range1);
  }
};

export const randomInt = (min: number, max: number) => {
  return Math.floor(Math.random() * (max - min + 1) + min);
};

export const roundToNearestHalf = (value: number) => {
  let rounded = Math.round(value * 2) / 2;

  // If the rounded value is 0, go lower (e.g., -0.5 or further)
  if (rounded === 0) {
    rounded = -0.5;
  }

  return rounded;
};

const soundPop = new Howl({
  src: ['./src/sounds/pop.mp3'],
  volume: 0.25,
});

const soundRoll = new Howl({
  src: ['./src/sounds/roll.mp3'],
  volume: 0.25,
});

const soundSqueakIn = new Howl({
  src: ['./src/sounds/squeak_in.mp3'],
  volume: 0.25,
});

const soundSqueakOut = new Howl({
  src: ['./src/sounds/squeak_out.mp3'],
  volume: 0.25,
});

export const sounds = {
  pop: soundPop,
  roll: soundRoll,
  squeakIn: soundSqueakIn,
  squeakOut: soundSqueakOut,
};

export type Reference = {
  id: number;
  startPosition: THREE.Vector3;
  destinationPosition: THREE.Vector3;
  currentPosition: THREE.Vector3;
  isAtDestination: boolean;
};

export const clamp = (num: number, lower: number, upper: number) => {
  return Math.min(Math.max(num, lower), upper);
};

export const vectorToKey = (vector: THREE.Vector3) =>
  `${vector.x},${vector.y},${vector.z}`;

export const pathIndicator = (
  position: THREE.Vector3,
  color: THREE.ColorRepresentation = 0x00ff00
) => {
  const geometry = new THREE.PlaneGeometry(1, 1, 1);

  let yPos = 0.25;
  if (color === 0xff0000) {
    yPos = 0.5;
  }
  const edges = new THREE.EdgesGeometry(geometry);
  const lineMaterial = new THREE.LineBasicMaterial({ color });
  const border = new THREE.LineSegments(edges, lineMaterial);

  border.position.set(position.x, yPos, position.z);
  border.rotation.x = -Math.PI / 2;

  const group = new THREE.Group();
  group.add(border);

  return group;
};

export const logVector = (vec: THREE.Vector3) => {
  return `${vec.x.toFixed(2)}, ${vec.y.toFixed(2)}, ${vec.z.toFixed(2)}`;
};

export function roundNearZero(vector: THREE.Vector3) {
  vector.x = Math.abs(vector.x) < 1e-10 ? 0 : vector.x;
  vector.y = Math.abs(vector.y) < 1e-10 ? 0 : vector.y;
  vector.z = Math.abs(vector.z) < 1e-10 ? 0 : vector.z;
  return vector;
}

export const shuffle = (array: any[]) => {
  return array
    .map((value) => ({ value, sort: Math.random() }))
    .sort((a, b) => a.sort - b.sort)
    .map(({ value }) => value);
};
