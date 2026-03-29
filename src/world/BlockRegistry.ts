export interface BlockDef {
  id: number;
  name: string;
  transparent: boolean;
  solid: boolean;
  // UV tile coords for each face: [tileX, tileY] in the atlas grid
  faces: {
    top: [number, number];
    bottom: [number, number];
    north: [number, number];
    south: [number, number];
    east: [number, number];
    west: [number, number];
  };
  color: string; // for hotbar icon fallback
}

// Face directions: +Y top, -Y bottom, +Z north, -Z south, +X east, -X west
function uniform(tile: [number, number]): BlockDef['faces'] {
  return { top: tile, bottom: tile, north: tile, south: tile, east: tile, west: tile };
}

export const BLOCKS: BlockDef[] = [
  // 0: Air
  { id: 0, name: 'Air', transparent: true, solid: false, faces: uniform([0, 0]), color: 'transparent' },
  // 1: Grass
  { id: 1, name: 'Grass', transparent: false, solid: true, faces: {
    top: [0, 0], bottom: [2, 0], north: [1, 0], south: [1, 0], east: [1, 0], west: [1, 0],
  }, color: '#4caf50' },
  // 2: Dirt
  { id: 2, name: 'Dirt', transparent: false, solid: true, faces: uniform([2, 0]), color: '#8d6e3f' },
  // 3: Stone
  { id: 3, name: 'Stone', transparent: false, solid: true, faces: uniform([3, 0]), color: '#888' },
  // 4: Wood
  { id: 4, name: 'Wood', transparent: false, solid: true, faces: {
    top: [5, 0], bottom: [5, 0], north: [4, 0], south: [4, 0], east: [4, 0], west: [4, 0],
  }, color: '#6d4c2a' },
  // 5: Leaves
  { id: 5, name: 'Leaves', transparent: true, solid: true, faces: uniform([6, 0]), color: '#2e7d32' },
  // 6: Sand
  { id: 6, name: 'Sand', transparent: false, solid: true, faces: uniform([7, 0]), color: '#dcc27a' },
  // 7: Water
  { id: 7, name: 'Water', transparent: true, solid: false, faces: uniform([8, 0]), color: '#1976d2' },
  // 8: Coal Ore
  { id: 8, name: 'Coal Ore', transparent: false, solid: true, faces: uniform([9, 0]), color: '#555' },
  // 9: Brick
  { id: 9, name: 'Brick', transparent: false, solid: true, faces: uniform([10, 0]), color: '#a0522d' },
  // 10: Glass
  { id: 10, name: 'Glass', transparent: true, solid: true, faces: uniform([11, 0]), color: '#b3e5fc' },
  // 11: Arcoiris
  { id: 11, name: 'Arcoiris', transparent: false, solid: true, faces: uniform([12, 0]), color: '#ff6b6b' },
  // 12: Nube
  { id: 12, name: 'Nube', transparent: false, solid: true, faces: uniform([13, 0]), color: '#eceff1' },
  // 13: Estrella
  { id: 13, name: 'Estrella', transparent: false, solid: true, faces: uniform([14, 0]), color: '#ffd740' },
  // 14: Brillante
  { id: 14, name: 'Brillante', transparent: false, solid: true, faces: uniform([15, 0]), color: '#4fc3f7' },
  // 15: Caramelo
  { id: 15, name: 'Caramelo', transparent: false, solid: true, faces: uniform([0, 1]), color: '#f48fb1' },
  // 16: Espacial
  { id: 16, name: 'Espacial', transparent: false, solid: true, faces: uniform([1, 1]), color: '#7c4dff' },
];

export function getBlock(id: number): BlockDef {
  return BLOCKS[id] ?? BLOCKS[0];
}

export function isTransparent(id: number): boolean {
  return id === 0 || (BLOCKS[id]?.transparent ?? true);
}

export function isSolid(id: number): boolean {
  return BLOCKS[id]?.solid ?? false;
}
