import { TextureTile, TextureResolution } from '../types';

function hexToRgb(hex: string): [number, number, number] {
  let clean = hex.replace('#', '').trim();
  if (clean.length === 3) clean = clean.split('').map((c) => c + c).join('');
  const num = parseInt(clean, 16);
  if (isNaN(num)) return [128, 128, 128];
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
}

function noise(x: number, y: number, seed = 1): number {
  const n = Math.sin(x * 12.9898 + y * 78.233 + seed) * 43758.5453;
  return (n - Math.floor(n));
}

/**
 * Generates an original pixel art canvas for a block or item tile
 */
export function renderTileToCanvas(
  tile: TextureTile,
  resolution: TextureResolution = 16,
  targetCanvas?: HTMLCanvasElement
): HTMLCanvasElement {
  const canvas = targetCanvas || document.createElement('canvas');
  canvas.width = resolution;
  canvas.height = resolution;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return canvas;

  ctx.clearRect(0, 0, resolution, resolution);
  const imgData = ctx.createImageData(resolution, resolution);
  const data = imgData.data;

  const palette = tile.palette.length >= 3 ? tile.palette : ['#1e293b', '#475569', '#94a3b8', '#e2e8f0'];
  const colors = palette.map(hexToRgb);

  const setPixel = (x: number, y: number, rgb: [number, number, number], alpha = 255) => {
    if (x < 0 || x >= resolution || y < 0 || y >= resolution) return;
    const idx = (y * resolution + x) * 4;
    data[idx] = rgb[0];
    data[idx + 1] = rgb[1];
    data[idx + 2] = rgb[2];
    data[idx + 3] = alpha;
  };

  if (tile.type === 'item') {
    // Render item with transparent silhouette (e.g. sword, tool, gem)
    const isSword = tile.targetId.includes('sword') || tile.targetId.includes('blade');
    const isPick = tile.targetId.includes('pickaxe') || tile.targetId.includes('axe') || tile.targetId.includes('shovel');

    for (let y = 0; y < resolution; y++) {
      for (let x = 0; x < resolution; x++) {
        // Diagonal item layout from bottom-left to top-right
        const diag = Math.abs(x - y);
        const distFromCenter = Math.sqrt((x - resolution / 2) ** 2 + (y - resolution / 2) ** 2);

        if (isSword) {
          // Sword blade along diagonal
          if (x + y >= resolution - 2 && x + y <= resolution + 2) {
            const cIdx = Math.min(colors.length - 1, Math.floor(noise(x, y, 5) * colors.length));
            setPixel(x, y, colors[cIdx]);
          } else if (x === y && x > 2 && x < resolution - 3) {
            setPixel(x, y, colors[colors.length - 1]); // highlight
          } else if (x + y === Math.floor(resolution * 0.4) && Math.abs(x - y) <= 2) {
            // Guard
            setPixel(x, y, colors[0]);
          } else if (x < 3 && y < 3 && x === y) {
            // Pommel
            setPixel(x, y, colors[0]);
          }
        } else if (isPick) {
          // Pickaxe / tool head and handle
          if (x === y && x > 2 && x < resolution - 2) {
            setPixel(x, y, colors[1]); // handle
          } else if (y > resolution - 5 && x > resolution - 5) {
            setPixel(x, y, colors[colors.length - 1]); // tool head
          }
        } else {
          // General item (gem, food, potion)
          if (distFromCenter < resolution * 0.38) {
            const edge = distFromCenter > resolution * 0.32;
            const cIdx = edge ? 0 : Math.min(colors.length - 1, Math.floor(noise(x, y, 7) * colors.length));
            setPixel(x, y, colors[cIdx]);
          }
        }
      }
    }
  } else {
    // Render Block (natural, geometric, crystalline, metallic)
    for (let y = 0; y < resolution; y++) {
      for (let x = 0; x < resolution; x++) {
        let colorIdx = 0;
        const nVal = noise(x, y, tile.targetId.length);

        if (tile.patternStyle === 'geometric') {
          const grid = (x % 4 === 0 || y % 4 === 0) ? 0 : 1;
          colorIdx = grid === 0 ? 0 : Math.min(colors.length - 1, 1 + Math.floor(nVal * (colors.length - 1)));
        } else if (tile.patternStyle === 'crystalline' || tile.targetId.includes('ore')) {
          // Ore specks or crystal facets
          const isOreSpeck = (x % 5 === 2 && y % 5 === 2) || (x % 7 === 4 && y % 6 === 3);
          if (isOreSpeck) {
            colorIdx = colors.length - 1; // glowing gem highlight
          } else {
            colorIdx = Math.min(colors.length - 2, Math.floor(nVal * (colors.length - 1)));
          }
        } else if (tile.patternStyle === 'metallic') {
          // Subtle horizontal sheen
          const sheen = Math.sin((y / resolution) * Math.PI);
          colorIdx = Math.min(colors.length - 1, Math.floor((sheen * 0.5 + nVal * 0.5) * colors.length));
        } else {
          // Natural terrain (stone, dirt, wood)
          colorIdx = Math.min(colors.length - 1, Math.floor(nVal * colors.length));
        }

        setPixel(x, y, colors[colorIdx]);
      }
    }
  }

  ctx.putImageData(imgData, 0, 0);
  return canvas;
}
