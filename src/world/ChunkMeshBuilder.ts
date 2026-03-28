import * as THREE from 'three';
import { CHUNK_SIZE, WORLD_HEIGHT, ATLAS_TILES } from '../utils/constants';
import { BLOCKS, isTransparent } from './BlockRegistry';

// Face normals: [dx, dy, dz] and the 4 vertex offsets for each face
const FACES = [
  { dir: [0, 1, 0], corners: [[0,1,1],[1,1,1],[1,1,0],[0,1,0]], name: 'top' as const },    // +Y
  { dir: [0,-1, 0], corners: [[0,0,0],[1,0,0],[1,0,1],[0,0,1]], name: 'bottom' as const },  // -Y
  { dir: [0, 0, 1], corners: [[0,0,1],[1,0,1],[1,1,1],[0,1,1]], name: 'north' as const },   // +Z
  { dir: [0, 0,-1], corners: [[1,0,0],[0,0,0],[0,1,0],[1,1,0]], name: 'south' as const },   // -Z
  { dir: [1, 0, 0], corners: [[1,0,1],[1,0,0],[1,1,0],[1,1,1]], name: 'east' as const },    // +X
  { dir: [-1,0, 0], corners: [[0,0,0],[0,0,1],[0,1,1],[0,1,0]], name: 'west' as const },    // -X
];

type GetNeighborBlock = (wx: number, wy: number, wz: number) => number;

export function buildChunkMesh(
  blocks: Uint8Array,
  cx: number,
  cz: number,
  getNeighborBlock: GetNeighborBlock,
  opaqueMaterial: THREE.Material,
  transparentMaterial: THREE.Material,
): { opaque: THREE.Mesh | null; transparent: THREE.Mesh | null } {
  const opaquePositions: number[] = [];
  const opaqueNormals: number[] = [];
  const opaqueUVs: number[] = [];
  const opaqueIndices: number[] = [];

  const transPositions: number[] = [];
  const transNormals: number[] = [];
  const transUVs: number[] = [];
  const transIndices: number[] = [];

  const wx0 = cx * CHUNK_SIZE;
  const wz0 = cz * CHUNK_SIZE;

  for (let ly = 0; ly < WORLD_HEIGHT; ly++) {
    for (let lz = 0; lz < CHUNK_SIZE; lz++) {
      for (let lx = 0; lx < CHUNK_SIZE; lx++) {
        const idx = ly * CHUNK_SIZE * CHUNK_SIZE + lz * CHUNK_SIZE + lx;
        const blockId = blocks[idx];
        if (blockId === 0) continue;

        const block = BLOCKS[blockId];
        const isBlockTransparent = block.transparent;
        const wx = wx0 + lx;
        const wz = wz0 + lz;

        for (const face of FACES) {
          const nx = wx + face.dir[0];
          const ny = ly + face.dir[1];
          const nz = wz + face.dir[2];

          const neighborId = getNeighborBlock(nx, ny, nz);

          // Show face if neighbor is transparent and different type (or air)
          let showFace = false;
          if (isBlockTransparent) {
            // Transparent blocks only show faces against different block types
            showFace = neighborId !== blockId && isTransparent(neighborId);
          } else {
            // Opaque blocks show faces against any transparent neighbor
            showFace = isTransparent(neighborId);
          }

          if (!showFace) continue;

          const positions = isBlockTransparent ? transPositions : opaquePositions;
          const normals = isBlockTransparent ? transNormals : opaqueNormals;
          const uvs = isBlockTransparent ? transUVs : opaqueUVs;
          const indices = isBlockTransparent ? transIndices : opaqueIndices;

          const vertexOffset = positions.length / 3;

          // UV from atlas
          const tile = block.faces[face.name];
          const u0 = tile[0] / ATLAS_TILES;
          const u1 = (tile[0] + 1) / ATLAS_TILES;
          const v0 = 1 - (tile[1] + 1) / ATLAS_TILES;
          const v1 = 1 - tile[1] / ATLAS_TILES;

          // Water: lower top face slightly
          const yOffset = (blockId === 7 && face.name === 'top') ? -0.1 : 0;

          for (const corner of face.corners) {
            positions.push(
              lx + corner[0],
              ly + corner[1] + yOffset,
              lz + corner[2],
            );
            normals.push(face.dir[0], face.dir[1], face.dir[2]);
          }

          uvs.push(u0, v0, u1, v0, u1, v1, u0, v1);

          indices.push(
            vertexOffset, vertexOffset + 1, vertexOffset + 2,
            vertexOffset, vertexOffset + 2, vertexOffset + 3,
          );
        }
      }
    }
  }

  const opaque = buildMeshFromArrays(opaquePositions, opaqueNormals, opaqueUVs, opaqueIndices, opaqueMaterial);
  const transparent = buildMeshFromArrays(transPositions, transNormals, transUVs, transIndices, transparentMaterial);

  if (opaque) {
    opaque.position.set(wx0, 0, wz0);
  }
  if (transparent) {
    transparent.position.set(wx0, 0, wz0);
    transparent.renderOrder = 1;
  }

  return { opaque, transparent };
}

function buildMeshFromArrays(
  positions: number[],
  normals: number[],
  uvs: number[],
  indices: number[],
  material: THREE.Material,
): THREE.Mesh | null {
  if (positions.length === 0) return null;

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geo.setIndex(indices);

  return new THREE.Mesh(geo, material);
}
