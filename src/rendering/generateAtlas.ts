// Generates a 256x256 pixel art texture atlas at runtime
// 16x16 grid of 16x16 pixel tiles

export function generateAtlasDataURL(): string {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  // Fill transparent
  ctx.clearRect(0, 0, 256, 256);

  // Helper to draw a tile at grid position
  function drawTile(tx: number, ty: number, draw: (ctx: CanvasRenderingContext2D, x: number, y: number) => void) {
    draw(ctx, tx * 16, ty * 16);
  }

  // Tile 0,0: Grass top
  drawTile(0, 0, (c, x, y) => {
    c.fillStyle = '#4caf50';
    c.fillRect(x, y, 16, 16);
    // Darker grass specks
    c.fillStyle = '#388e3c';
    for (let i = 0; i < 12; i++) {
      const px = x + ((i * 7 + 3) % 16);
      const py = y + ((i * 11 + 5) % 16);
      c.fillRect(px, py, 1, 1);
    }
  });

  // Tile 1,0: Grass side
  drawTile(1, 0, (c, x, y) => {
    // Top strip green
    c.fillStyle = '#4caf50';
    c.fillRect(x, y, 16, 3);
    c.fillStyle = '#388e3c';
    c.fillRect(x + 2, y + 2, 1, 1);
    c.fillRect(x + 8, y + 2, 1, 1);
    c.fillRect(x + 14, y + 1, 1, 1);
    // Dirt body
    c.fillStyle = '#8d6e3f';
    c.fillRect(x, y + 3, 16, 13);
    c.fillStyle = '#7a5c30';
    for (let i = 0; i < 8; i++) {
      const px = x + ((i * 7 + 2) % 16);
      const py = y + 4 + ((i * 5 + 1) % 11);
      c.fillRect(px, py, 2, 1);
    }
  });

  // Tile 2,0: Dirt
  drawTile(2, 0, (c, x, y) => {
    c.fillStyle = '#8d6e3f';
    c.fillRect(x, y, 16, 16);
    c.fillStyle = '#7a5c30';
    for (let i = 0; i < 10; i++) {
      const px = x + ((i * 7 + 1) % 15);
      const py = y + ((i * 11 + 3) % 15);
      c.fillRect(px, py, 2, 2);
    }
  });

  // Tile 3,0: Stone
  drawTile(3, 0, (c, x, y) => {
    c.fillStyle = '#888';
    c.fillRect(x, y, 16, 16);
    c.fillStyle = '#999';
    c.fillRect(x + 1, y + 1, 6, 4);
    c.fillRect(x + 9, y + 2, 5, 3);
    c.fillRect(x + 2, y + 7, 7, 4);
    c.fillRect(x + 11, y + 8, 4, 5);
    c.fillRect(x + 0, y + 12, 5, 3);
    c.fillStyle = '#777';
    c.fillRect(x + 7, y + 0, 1, 6);
    c.fillRect(x + 0, y + 5, 9, 1);
    c.fillRect(x + 8, y + 5, 1, 3);
    c.fillRect(x + 9, y + 7, 7, 1);
    c.fillRect(x + 10, y + 13, 6, 1);
    c.fillRect(x + 5, y + 11, 1, 5);
  });

  // Tile 4,0: Wood bark (side)
  drawTile(4, 0, (c, x, y) => {
    c.fillStyle = '#6d4c2a';
    c.fillRect(x, y, 16, 16);
    c.fillStyle = '#5a3d1f';
    for (let i = 0; i < 16; i += 3) {
      c.fillRect(x, y + i, 16, 1);
    }
    c.fillStyle = '#7d5c3a';
    c.fillRect(x + 4, y + 1, 2, 2);
    c.fillRect(x + 10, y + 4, 2, 2);
    c.fillRect(x + 2, y + 7, 2, 2);
    c.fillRect(x + 12, y + 10, 2, 2);
    c.fillRect(x + 6, y + 13, 2, 2);
  });

  // Tile 5,0: Wood top (log end)
  drawTile(5, 0, (c, x, y) => {
    c.fillStyle = '#8d6e3f';
    c.fillRect(x, y, 16, 16);
    c.fillStyle = '#6d4c2a';
    // Rings
    c.strokeStyle = '#5a3d1f';
    c.lineWidth = 1;
    c.beginPath(); c.arc(x + 8, y + 8, 3, 0, Math.PI * 2); c.stroke();
    c.beginPath(); c.arc(x + 8, y + 8, 6, 0, Math.PI * 2); c.stroke();
    c.fillStyle = '#5a3d1f';
    c.fillRect(x + 7, y + 7, 2, 2); // center
  });

  // Tile 6,0: Leaves
  drawTile(6, 0, (c, x, y) => {
    c.fillStyle = '#2e7d32';
    c.fillRect(x, y, 16, 16);
    c.fillStyle = '#1b5e20';
    for (let i = 0; i < 16; i++) {
      const px = x + ((i * 7 + 3) % 16);
      const py = y + ((i * 11 + 7) % 16);
      c.fillRect(px, py, 2, 2);
    }
    // Transparent holes for alpha
    c.clearRect(x + 0, y + 0, 1, 1);
    c.clearRect(x + 8, y + 4, 1, 1);
    c.clearRect(x + 15, y + 12, 1, 1);
    c.clearRect(x + 3, y + 14, 1, 1);
  });

  // Tile 7,0: Sand
  drawTile(7, 0, (c, x, y) => {
    c.fillStyle = '#dcc27a';
    c.fillRect(x, y, 16, 16);
    c.fillStyle = '#c4a94d';
    for (let i = 0; i < 8; i++) {
      const px = x + ((i * 7 + 2) % 16);
      const py = y + ((i * 11 + 5) % 16);
      c.fillRect(px, py, 1, 1);
    }
    c.fillStyle = '#e8d48b';
    for (let i = 0; i < 6; i++) {
      const px = x + ((i * 5 + 1) % 16);
      const py = y + ((i * 9 + 3) % 16);
      c.fillRect(px, py, 1, 1);
    }
  });

  // Tile 8,0: Water
  drawTile(8, 0, (c, x, y) => {
    c.fillStyle = 'rgba(25, 118, 210, 0.6)';
    c.fillRect(x, y, 16, 16);
    c.fillStyle = 'rgba(66, 165, 245, 0.4)';
    c.fillRect(x + 1, y + 2, 6, 1);
    c.fillRect(x + 9, y + 5, 5, 1);
    c.fillRect(x + 3, y + 9, 7, 1);
    c.fillRect(x + 0, y + 13, 4, 1);
    c.fillRect(x + 11, y + 12, 4, 1);
  });

  // Tile 9,0: Coal Ore
  drawTile(9, 0, (c, x, y) => {
    // Stone base
    c.fillStyle = '#888';
    c.fillRect(x, y, 16, 16);
    c.fillStyle = '#999';
    c.fillRect(x + 1, y + 1, 6, 4);
    c.fillRect(x + 9, y + 8, 4, 5);
    // Coal specks
    c.fillStyle = '#222';
    c.fillRect(x + 3, y + 3, 3, 3);
    c.fillRect(x + 10, y + 2, 2, 2);
    c.fillRect(x + 7, y + 9, 3, 3);
    c.fillRect(x + 1, y + 11, 2, 2);
    c.fillRect(x + 12, y + 12, 3, 2);
  });

  // Tile 10,0: Brick
  drawTile(10, 0, (c, x, y) => {
    c.fillStyle = '#8b4513';
    c.fillRect(x, y, 16, 16);
    c.fillStyle = '#999';
    // Mortar lines
    c.fillRect(x, y + 3, 16, 1);
    c.fillRect(x, y + 7, 16, 1);
    c.fillRect(x, y + 11, 16, 1);
    c.fillRect(x, y + 15, 16, 1);
    c.fillRect(x + 4, y, 1, 4);
    c.fillRect(x + 12, y, 1, 4);
    c.fillRect(x + 0, y + 4, 1, 4);
    c.fillRect(x + 8, y + 4, 1, 4);
    c.fillRect(x + 4, y + 8, 1, 4);
    c.fillRect(x + 12, y + 8, 1, 4);
    c.fillRect(x + 0, y + 12, 1, 4);
    c.fillRect(x + 8, y + 12, 1, 4);
    // Brick color variation
    c.fillStyle = '#a0522d';
    c.fillRect(x + 1, y + 0, 3, 3);
    c.fillRect(x + 9, y + 4, 3, 3);
    c.fillRect(x + 5, y + 8, 3, 3);
    c.fillRect(x + 1, y + 12, 3, 3);
  });

  // Tile 11,0: Glass
  drawTile(11, 0, (c, x, y) => {
    c.fillStyle = 'rgba(179, 229, 252, 0.3)';
    c.fillRect(x, y, 16, 16);
    // Border
    c.fillStyle = 'rgba(179, 229, 252, 0.7)';
    c.fillRect(x, y, 16, 1);
    c.fillRect(x, y + 15, 16, 1);
    c.fillRect(x, y, 1, 16);
    c.fillRect(x + 15, y, 1, 16);
    // Highlight
    c.fillStyle = 'rgba(255, 255, 255, 0.4)';
    c.fillRect(x + 2, y + 2, 3, 1);
    c.fillRect(x + 2, y + 3, 1, 2);
  });

  return canvas.toDataURL();
}
