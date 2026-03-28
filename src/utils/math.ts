import { CHUNK_SIZE } from './constants';

export function worldToChunk(wx: number, wz: number): [number, number] {
  return [Math.floor(wx / CHUNK_SIZE), Math.floor(wz / CHUNK_SIZE)];
}

export function worldToLocal(wx: number, wy: number, wz: number): [number, number, number] {
  return [
    ((wx % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE,
    wy,
    ((wz % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE,
  ];
}

export function chunkKey(cx: number, cz: number): string {
  return `${cx},${cz}`;
}

export function localIndex(x: number, y: number, z: number): number {
  return y * CHUNK_SIZE * CHUNK_SIZE + z * CHUNK_SIZE + x;
}
