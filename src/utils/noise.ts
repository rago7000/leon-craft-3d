import { createNoise2D } from 'simplex-noise';
import alea from 'alea';

const SEED = 'leon-craft-world';
const prng = alea(SEED);
const noise2D = createNoise2D(prng);

export function getNoise2D(x: number, z: number): number {
  return noise2D(x, z);
}

export function getTerrainHeight(wx: number, wz: number, baseHeight: number): number {
  const h =
    baseHeight +
    getNoise2D(wx / 100, wz / 100) * 20 +
    getNoise2D(wx / 50, wz / 50) * 10 +
    getNoise2D(wx / 25, wz / 25) * 4;
  return Math.floor(Math.max(1, Math.min(127, h)));
}

// Deterministic per-position random for tree placement etc.
const treePrng = alea(SEED + '-trees');
export function posRandom(x: number, z: number): number {
  // Simple hash-based deterministic random
  let h = (x * 374761393 + z * 668265263 + 1274126177) | 0;
  h = Math.imul(h ^ (h >>> 13), 1103515245);
  h = h ^ (h >>> 16);
  return (h >>> 0) / 4294967296;
}
