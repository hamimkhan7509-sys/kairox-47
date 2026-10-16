import { GeneratedSkinItem } from '../types';

/**
 * Parses hex color string to [r, g, b, a]
 */
function hexToRgba(hex: string, alpha = 255): [number, number, number, number] {
  let clean = hex.replace('#', '').trim();
  if (clean.length === 3) {
    clean = clean.split('').map((c) => c + c).join('');
  }
  const num = parseInt(clean, 16);
  if (isNaN(num)) return [120, 120, 120, alpha];
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255, alpha];
}

/**
 * Applies subtle brightness variation for authentic Minecraft pixel texture shading
 */
function shadeColor(
  rgba: [number, number, number, number],
  factor: number
): [number, number, number, number] {
  return [
    Math.min(255, Math.max(0, Math.round(rgba[0] * factor))),
    Math.min(255, Math.max(0, Math.round(rgba[1] * factor))),
    Math.min(255, Math.max(0, Math.round(rgba[2] * factor))),
    rgba[3],
  ];
}

/**
 * Pseudo-random noise seeded by position for repeatable pixel shading
 */
function coordNoise(x: number, y: number, seed = 42): number {
  const n = Math.sin(x * 12.9898 + y * 78.233 + seed) * 43758.5453;
  return (n - Math.floor(n)) * 2 - 1; // -1 to 1
}

/**
 * Renders a complete 64x64 Minecraft Bedrock skin texture onto an HTMLCanvasElement
 */
export function renderSkinToCanvas(
  skin: GeneratedSkinItem,
  targetCanvas?: HTMLCanvasElement
): HTMLCanvasElement {
  const canvas = targetCanvas || document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return canvas;

  // Clear canvas (fully transparent)
  ctx.clearRect(0, 0, 64, 64);
  const imgData = ctx.createImageData(64, 64);
  const data = imgData.data;

  function setPixel(x: number, y: number, rgba: [number, number, number, number]) {
    if (x < 0 || x >= 64 || y < 0 || y >= 64) return;
    const idx = (y * 64 + x) * 4;
    // Standard alpha blending if existing pixel has alpha
    const bgA = data[idx + 3] / 255;
    const fgA = rgba[3] / 255;
    if (fgA >= 0.99 || bgA === 0) {
      data[idx] = rgba[0];
      data[idx + 1] = rgba[1];
      data[idx + 2] = rgba[2];
      data[idx + 3] = rgba[3];
    } else {
      const outA = fgA + bgA * (1 - fgA);
      data[idx] = Math.round((rgba[0] * fgA + data[idx] * bgA * (1 - fgA)) / outA);
      data[idx + 1] = Math.round((rgba[1] * fgA + data[idx + 1] * bgA * (1 - fgA)) / outA);
      data[idx + 2] = Math.round((rgba[2] * fgA + data[idx + 2] * bgA * (1 - fgA)) / outA);
      data[idx + 3] = Math.round(outA * 255);
    }
  }

  function fillRectShaded(
    rx: number,
    ry: number,
    rw: number,
    rh: number,
    baseHex: string,
    intensity = 0.12,
    seedOffset = 0
  ) {
    const baseRgba = hexToRgba(baseHex);
    for (let py = ry; py < ry + rh; py++) {
      for (let px = rx; px < rx + rw; px++) {
        const noise = coordNoise(px, py, seedOffset);
        // Vertical gradient + noise
        const vert = 1.05 - ((py - ry) / Math.max(rh, 1)) * 0.1;
        const factor = vert + noise * intensity;
        setPixel(px, py, shadeColor(baseRgba, factor));
      }
    }
  }

  const { palette, layers, model } = skin;
  const isSlim = model === 'slim';
  const armWidth = isSlim ? 3 : 4;
  const armOffset = isSlim ? 1 : 0;

  // ----------------------------------------------------
  // 1. HEAD BASE (Skin / Hair base)
  // Layout:
  // Top: (8, 0, 8, 8)
  // Bottom: (16, 0, 8, 8)
  // Right: (0, 8, 8, 8)
  // Front: (8, 8, 8, 8)
  // Left: (16, 8, 8, 8)
  // Back: (24, 8, 8, 8)
  // ----------------------------------------------------
  // Fill all head base with skin tone
  fillRectShaded(0, 0, 32, 16, palette.skinHex, 0.08, 10);

  // Hair on head top, back, sides
  fillRectShaded(8, 0, 8, 8, palette.hairHex, 0.12, 11); // Top of head
  fillRectShaded(0, 8, 8, 6, palette.hairHex, 0.12, 12); // Right side hair
  fillRectShaded(16, 8, 8, 6, palette.hairHex, 0.12, 13); // Left side hair
  fillRectShaded(24, 8, 8, 8, palette.hairHex, 0.12, 14); // Back of head

  // Hair bangs on front top (rows y=8, 9)
  fillRectShaded(8, 8, 8, 2, palette.hairHex, 0.12, 15);
  if (layers.hairStyle === 'messy' || layers.hairStyle === 'spiky') {
    setPixel(8, 10, hexToRgba(palette.hairHex));
    setPixel(10, 10, hexToRgba(palette.hairHex));
    setPixel(13, 10, hexToRgba(palette.hairHex));
    setPixel(15, 10, hexToRgba(palette.hairHex));
  } else if (layers.hairStyle === 'hood' || layers.hairStyle === 'ninja_cowl') {
    // Cowl covers side of face
    fillRectShaded(8, 8, 2, 7, palette.primaryHex, 0.1, 16);
    fillRectShaded(14, 8, 2, 7, palette.primaryHex, 0.1, 17);
    fillRectShaded(8, 8, 8, 3, palette.primaryHex, 0.1, 18);
  }

  // Front Face Features (x: 8..15, y: 8..15)
  // Eyes at (9, 12), (10, 12) & (13, 12), (14, 12)
  if (layers.faceExpression === 'visor') {
    // Glowing futuristic cyber visor across (9..14, 11..12)
    fillRectShaded(8, 11, 8, 2, palette.accentHex, 0.05, 99);
    setPixel(10, 11, [255, 255, 255, 255]);
    setPixel(13, 11, [255, 255, 255, 255]);
  } else if (layers.faceExpression === 'glow_eyes') {
    // Eerie glowing eyes
    setPixel(10, 12, hexToRgba(palette.accentHex));
    setPixel(13, 12, hexToRgba(palette.accentHex));
    setPixel(9, 12, shadeColor(hexToRgba(palette.accentHex), 0.7));
    setPixel(14, 12, shadeColor(hexToRgba(palette.accentHex), 0.7));
  } else {
    // Normal / Determined eyes: Eye white + iris
    const eyeWhite: [number, number, number, number] = [240, 240, 245, 255];
    const irisRgba = hexToRgba(palette.eyesHex);
    // Right eye
    setPixel(9, 12, eyeWhite);
    setPixel(10, 12, irisRgba);
    // Left eye
    setPixel(14, 12, eyeWhite);
    setPixel(13, 12, irisRgba);
    // Eyebrows
    const browRgba = shadeColor(hexToRgba(palette.hairHex), 0.7);
    setPixel(9, 11, browRgba);
    setPixel(10, 11, browRgba);
    setPixel(13, 11, browRgba);
    setPixel(14, 11, browRgba);
  }

  // Mouth / expression
  const mouthRgba = shadeColor(hexToRgba(palette.skinHex), 0.75);
  if (layers.faceExpression === 'masked' || layers.hairStyle === 'ninja_cowl') {
    fillRectShaded(8, 13, 8, 3, palette.secondaryHex, 0.08, 25);
  } else {
    setPixel(11, 14, mouthRgba);
    setPixel(12, 14, mouthRgba);
  }

  // ----------------------------------------------------
  // 2. HEAD OVERLAY / HELMET / HOOD (32..64, 0..16)
  // Top: (40, 0, 8, 8)
  // Bottom: (48, 0, 8, 8)
  // Right: (32, 8, 8, 8)
  // Front: (40, 8, 8, 8)
  // Left: (48, 8, 8, 8)
  // Back: (56, 8, 8, 8)
  // ----------------------------------------------------
  if (layers.hairStyle === 'hood' || layers.clothingStyle === 'cyber_suit') {
    fillRectShaded(40, 0, 8, 8, palette.primaryHex, 0.1, 30);
    fillRectShaded(32, 8, 8, 8, palette.primaryHex, 0.1, 31);
    fillRectShaded(56, 8, 8, 8, palette.primaryHex, 0.1, 32);
    fillRectShaded(48, 8, 8, 8, palette.primaryHex, 0.1, 33);
    // Front opening
    fillRectShaded(40, 8, 8, 2, palette.primaryHex, 0.1, 34);
    fillRectShaded(40, 8, 1, 8, palette.primaryHex, 0.1, 35);
    fillRectShaded(47, 8, 1, 8, palette.primaryHex, 0.1, 36);
  } else if (layers.overlayType === 'headband' || layers.hairStyle === 'bandana') {
    fillRectShaded(32, 10, 32, 2, palette.accentHex, 0.08, 40);
  } else if (layers.overlayType === 'goggles') {
    fillRectShaded(40, 10, 8, 3, palette.accentHex, 0.1, 41);
    setPixel(42, 11, [255, 255, 255, 230]);
    setPixel(45, 11, [255, 255, 255, 230]);
    // Goggle strap around head
    fillRectShaded(32, 11, 8, 1, palette.secondaryHex, 0.05, 42);
    fillRectShaded(48, 11, 16, 1, palette.secondaryHex, 0.05, 43);
  }

  // ----------------------------------------------------
  // 3. TORSO / BODY BASE (16..40, 16..32)
  // Top: (20, 16, 8, 4)
  // Bottom: (28, 16, 8, 4)
  // Right: (16, 20, 4, 12)
  // Front: (20, 20, 8, 12)
  // Left: (28, 20, 4, 12)
  // Back: (32, 20, 8, 12)
  // ----------------------------------------------------
  // Primary shirt / tunic fill
  fillRectShaded(16, 16, 24, 16, palette.primaryHex, 0.1, 50);

  // Torso front chest design & shading
  fillRectShaded(22, 20, 4, 4, palette.secondaryHex, 0.08, 51);
  // Accent core / tie / emblem in center of chest
  setPixel(23, 23, hexToRgba(palette.accentHex));
  setPixel(24, 23, hexToRgba(palette.accentHex));
  setPixel(23, 24, hexToRgba(palette.accentHex));
  setPixel(24, 24, hexToRgba(palette.accentHex));

  // Belt at bottom of torso (y: 29..31)
  if (layers.hasBelt) {
    fillRectShaded(16, 29, 24, 2, palette.secondaryHex, 0.06, 52);
    // Buckle
    setPixel(23, 29, hexToRgba(palette.accentHex));
    setPixel(24, 29, hexToRgba(palette.accentHex));
    setPixel(23, 30, hexToRgba(palette.accentHex));
    setPixel(24, 30, hexToRgba(palette.accentHex));
  }

  // ----------------------------------------------------
  // 4. TORSO OVERLAY / JACKET (16..40, 32..48)
  // ----------------------------------------------------
  if (layers.overlayType === 'full_coat' || layers.clothingStyle === 'leather_jacket' || layers.clothingStyle === 'hoodie') {
    fillRectShaded(16, 32, 24, 16, palette.secondaryHex, 0.12, 60);
    // Open jacket in middle front
    for (let y = 36; y <= 45; y++) {
      setPixel(23, y, [0, 0, 0, 0]);
      setPixel(24, y, [0, 0, 0, 0]);
    }
    // Jacket collar accents
    setPixel(22, 36, hexToRgba(palette.accentHex));
    setPixel(25, 36, hexToRgba(palette.accentHex));
  } else if (layers.overlayType === 'shoulder_pads') {
    // Shoulder pauldrons
    fillRectShaded(16, 32, 4, 4, palette.accentHex, 0.1, 61);
    fillRectShaded(28, 32, 4, 4, palette.accentHex, 0.1, 62);
  }

  // ----------------------------------------------------
  // 5. RIGHT ARM BASE (40..56, 16..32)
  // Top: (44, 16, 4, 4)
  // Bottom: (48, 16, 4, 4)
  // Right: (40, 20, 4, 12)
  // Front: (44, 20, 4, 12)
  // Left: (48, 20, 4, 12)
  // Back: (52, 20, 4, 12)
  // ----------------------------------------------------
  // Sleeve (top 8 rows)
  fillRectShaded(40, 16, 16 - armOffset * 4, 12, palette.primaryHex, 0.09, 70);
  // Hand (bottom 4 rows)
  const handColor = layers.hasGloves ? palette.secondaryHex : palette.skinHex;
  fillRectShaded(40, 28, 16 - armOffset * 4, 4, handColor, 0.08, 71);
  if (layers.hasGloves) {
    // Glove cuff stripe
    fillRectShaded(40, 27, 16 - armOffset * 4, 1, palette.accentHex, 0.05, 72);
  }

  // ----------------------------------------------------
  // 6. RIGHT ARM OVERLAY (40..56, 32..48)
  // ----------------------------------------------------
  if (layers.overlayType === 'full_coat' || layers.clothingStyle === 'hoodie') {
    fillRectShaded(40, 32, 16 - armOffset * 4, 9, palette.secondaryHex, 0.1, 75);
  }

  // ----------------------------------------------------
  // 7. LEFT ARM BASE (32..48, 48..64)
  // Top: (36, 48, 4, 4)
  // Bottom: (40, 48, 4, 4)
  // Right: (32, 52, 4, 12)
  // Front: (36, 52, 4, 12)
  // Left: (40, 52, 4, 12)
  // Back: (44, 52, 4, 12)
  // ----------------------------------------------------
  fillRectShaded(32, 48, 16 - armOffset * 4, 12, palette.primaryHex, 0.09, 80);
  fillRectShaded(32, 60, 16 - armOffset * 4, 4, handColor, 0.08, 81);
  if (layers.hasGloves) {
    fillRectShaded(32, 59, 16 - armOffset * 4, 1, palette.accentHex, 0.05, 82);
  }

  // ----------------------------------------------------
  // 8. LEFT ARM OVERLAY (48..64, 48..64)
  // ----------------------------------------------------
  if (layers.overlayType === 'full_coat' || layers.clothingStyle === 'hoodie') {
    fillRectShaded(48, 48, 16 - armOffset * 4, 9, palette.secondaryHex, 0.1, 85);
  }

  // ----------------------------------------------------
  // 9. RIGHT LEG BASE (0..16, 16..32)
  // Top: (4, 16, 4, 4)
  // Bottom: (8, 16, 4, 4)
  // Right: (0, 20, 4, 12)
  // Front: (4, 20, 4, 12)
  // Left: (8, 20, 4, 12)
  // Back: (12, 20, 4, 12)
  // ----------------------------------------------------
  // Pants (top 8 rows)
  fillRectShaded(0, 16, 16, 12, palette.pantsHex, 0.1, 90);
  // Boots (bottom 4 rows)
  fillRectShaded(0, 28, 16, 4, palette.bootsHex, 0.1, 91);
  // Boot cuff / laces
  fillRectShaded(4, 27, 4, 1, palette.accentHex, 0.05, 92);

  // ----------------------------------------------------
  // 10. RIGHT LEG OVERLAY (0..16, 32..48)
  // ----------------------------------------------------
  if (layers.hasBoots) {
    // 3D boot rim
    fillRectShaded(0, 44, 16, 2, palette.bootsHex, 0.08, 93);
    setPixel(5, 43, hexToRgba(palette.accentHex));
    setPixel(6, 43, hexToRgba(palette.accentHex));
  }

  // ----------------------------------------------------
  // 11. LEFT LEG BASE (16..32, 48..64)
  // Top: (20, 48, 4, 4)
  // Bottom: (24, 48, 4, 4)
  // Right: (16, 52, 4, 12)
  // Front: (20, 52, 4, 12)
  // Left: (24, 52, 4, 12)
  // Back: (28, 52, 4, 12)
  // ----------------------------------------------------
  fillRectShaded(16, 48, 16, 12, palette.pantsHex, 0.1, 95);
  fillRectShaded(16, 60, 16, 4, palette.bootsHex, 0.1, 96);
  fillRectShaded(20, 59, 4, 1, palette.accentHex, 0.05, 97);

  // ----------------------------------------------------
  // 12. LEFT LEG OVERLAY (0..16, 48..64)
  // ----------------------------------------------------
  if (layers.hasBoots) {
    fillRectShaded(0, 60, 16, 2, palette.bootsHex, 0.08, 98);
    setPixel(5, 59, hexToRgba(palette.accentHex));
    setPixel(6, 59, hexToRgba(palette.accentHex));
  }

  // Apply custom accent features if specified by AI
  if (skin.accentFeatures && skin.accentFeatures.length > 0) {
    for (const feat of skin.accentFeatures) {
      const colorRgba = hexToRgba(feat.color);
      if (feat.part === 'torso') {
        setPixel(21, 23, colorRgba);
        setPixel(26, 23, colorRgba);
      } else if (feat.part === 'head') {
        setPixel(41, 10, colorRgba);
        setPixel(46, 10, colorRgba);
      }
    }
  }

  // Put image data back to canvas
  ctx.putImageData(imgData, 0, 0);
  return canvas;
}

/**
 * Creates a stylish 256x256 pack icon for the skin pack
 */
export function generatePackIcon(packTitle: string, primaryColorHex: string): string {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  // Background gradient
  const grad = ctx.createLinearGradient(0, 0, 256, 256);
  grad.addColorStop(0, '#0f172a');
  grad.addColorStop(1, '#020617');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 256, 256);

  // Pixel border
  ctx.strokeStyle = primaryColorHex || '#10b981';
  ctx.lineWidth = 12;
  ctx.strokeRect(6, 6, 244, 244);

  // Grid background effect
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
  ctx.lineWidth = 2;
  for (let i = 24; i < 256; i += 24) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i, 256);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, i);
    ctx.lineTo(256, i);
    ctx.stroke();
  }

  // Diamond / Emblem in center
  ctx.fillStyle = primaryColorHex || '#10b981';
  ctx.beginPath();
  ctx.moveTo(128, 56);
  ctx.lineTo(184, 112);
  ctx.lineTo(128, 168);
  ctx.lineTo(72, 112);
  ctx.closePath();
  ctx.fill();

  // Pixel inner highlight
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(116, 96, 24, 24);

  // Text title
  ctx.fillStyle = '#f8fafc';
  ctx.font = 'bold 20px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(packTitle.slice(0, 16), 128, 210);

  ctx.fillStyle = primaryColorHex || '#10b981';
  ctx.font = '12px monospace';
  ctx.fillText('BEDROCK SKIN PACK', 128, 230);

  return canvas.toDataURL('image/png');
}
