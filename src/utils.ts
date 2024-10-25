import { Howl, Howler } from 'howler';

export function randomWithExclusion(
  min: number,
  max: number,
  excludeMin: number,
  excludeMax: number
): number {
  const range1 = excludeMin - min;
  const range2 = max - excludeMax;
  const totalRange = range1 + range2;

  const randomValue = Math.random() * totalRange;

  if (randomValue < range1) {
    return min + randomValue;
  } else {
    return excludeMax + (randomValue - range1);
  }
}

export function randomInt(min: number, max: number) {
  // min and max included
  return Math.floor(Math.random() * (max - min + 1) + min);
}

export function roundToNearestHalf(value: number) {
  let rounded = Math.round(value * 2) / 2;

  // If the rounded value is 0, go lower (e.g., -0.5 or further)
  if (rounded === 0) {
    rounded = -0.5;
  }

  return rounded;
}

export function shuffle(array: any[]) {
  return array
    .map((value) => ({ value, sort: Math.random() }))
    .sort((a, b) => a.sort - b.sort)
    .map(({ value }) => value);
}

export const soundPop = new Howl({
  src: ['./src/pop.mp3'],
  onload: function () {
    console.log('Sound loaded successfully');
  },
  volume: 0.25,
});

export const soundRoll = new Howl({
  src: ['./src/roll.mp3'],
  onload: function () {
    console.log('Sound loaded successfully');
  },
  volume: 0.25,
});

export const soundSqueakIn = new Howl({
  src: ['./src/squeak_in.mp3'],
  onload: function () {
    console.log('Sound loaded successfully');
  },
  volume: 0.25,
});

export const soundSqueakOut = new Howl({
  src: ['./src/squeak_out.mp3'],
  onload: function () {
    console.log('Sound loaded successfully');
  },
  volume: 0.25,
});
