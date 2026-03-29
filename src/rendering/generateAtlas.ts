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

  // Tile 12,0: Arcoiris (rainbow stripes)
  drawTile(12, 0, (c, x, y) => {
    const colors = ['#ff4444', '#ff8800', '#ffdd00', '#44bb44', '#4488ff', '#8844cc'];
    const h = Math.floor(16 / colors.length);
    for (let i = 0; i < colors.length; i++) {
      c.fillStyle = colors[i];
      c.fillRect(x, y + i * h, 16, h + 1);
    }
  });

  // Tile 13,0: Nube (white fluffy)
  drawTile(13, 0, (c, x, y) => {
    c.fillStyle = '#eceff1';
    c.fillRect(x, y, 16, 16);
    c.fillStyle = '#fff';
    c.fillRect(x + 2, y + 2, 5, 4);
    c.fillRect(x + 9, y + 3, 4, 5);
    c.fillRect(x + 3, y + 9, 6, 4);
    c.fillRect(x + 11, y + 10, 3, 3);
    c.fillStyle = '#cfd8dc';
    c.fillRect(x + 1, y + 13, 4, 2);
    c.fillRect(x + 8, y + 14, 5, 1);
  });

  // Tile 14,0: Estrella (gold sparkle)
  drawTile(14, 0, (c, x, y) => {
    c.fillStyle = '#ffd740';
    c.fillRect(x, y, 16, 16);
    c.fillStyle = '#ffecb3';
    c.fillRect(x + 6, y + 2, 4, 12);
    c.fillRect(x + 2, y + 6, 12, 4);
    c.fillStyle = '#fff';
    c.fillRect(x + 7, y + 7, 2, 2);
    c.fillStyle = '#ffab00';
    c.fillRect(x + 0, y + 0, 2, 2);
    c.fillRect(x + 14, y + 0, 2, 2);
    c.fillRect(x + 0, y + 14, 2, 2);
    c.fillRect(x + 14, y + 14, 2, 2);
  });

  // Tile 15,0: Brillante (diamond blue)
  drawTile(15, 0, (c, x, y) => {
    c.fillStyle = '#4fc3f7';
    c.fillRect(x, y, 16, 16);
    c.fillStyle = '#b3e5fc';
    c.fillRect(x + 3, y + 3, 4, 4);
    c.fillRect(x + 9, y + 9, 4, 4);
    c.fillStyle = '#fff';
    c.fillRect(x + 4, y + 4, 2, 2);
    c.fillRect(x + 10, y + 10, 2, 2);
    c.fillRect(x + 7, y + 1, 1, 1);
    c.fillRect(x + 1, y + 7, 1, 1);
    c.fillRect(x + 14, y + 7, 1, 1);
    c.fillRect(x + 7, y + 14, 1, 1);
  });

  // Tile 0,1: Caramelo (pink/white stripes)
  drawTile(0, 1, (c, x, y) => {
    c.fillStyle = '#f48fb1';
    c.fillRect(x, y, 16, 16);
    c.fillStyle = '#fce4ec';
    for (let i = -16; i < 32; i += 4) {
      c.fillRect(x + i, y, 2, 16);
      // diagonal effect
      c.save();
      c.translate(x + 8, y + 8);
      c.rotate(Math.PI / 4);
      c.fillRect(i - 8, -8, 2, 24);
      c.restore();
    }
  });

  // Tile 1,1: Espacial (dark purple with stars)
  drawTile(1, 1, (c, x, y) => {
    c.fillStyle = '#311b92';
    c.fillRect(x, y, 16, 16);
    c.fillStyle = '#4a148c';
    c.fillRect(x + 0, y + 8, 16, 8);
    c.fillStyle = '#fff';
    c.fillRect(x + 3, y + 2, 1, 1);
    c.fillRect(x + 8, y + 1, 1, 1);
    c.fillRect(x + 13, y + 3, 1, 1);
    c.fillRect(x + 1, y + 7, 1, 1);
    c.fillRect(x + 6, y + 6, 2, 2);
    c.fillRect(x + 11, y + 9, 1, 1);
    c.fillRect(x + 4, y + 12, 1, 1);
    c.fillRect(x + 9, y + 13, 1, 1);
    c.fillRect(x + 14, y + 11, 1, 1);
    c.fillStyle = '#ffd740';
    c.fillRect(x + 6, y + 5, 1, 1);
    c.fillRect(x + 7, y + 7, 1, 1);
  });

  return canvas.toDataURL();
}
