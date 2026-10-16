import JSZip from 'jszip';
import { generateUUID } from '../utils/uuid';
import { GeneratedSkinItem } from '../types';
import { CREATOR_NAME, CREATOR_YOUTUBE_URL } from '../config';

interface PackagerOptions {
  packName: string;
  packDescription?: string;
  skins: GeneratedSkinItem[];
  includeCreatorCredit?: boolean;
  packIconDataUrl?: string;
}

/**
 * Converts a data URL to a pure Uint8Array for JSZip file inclusion
 */
function dataUrlToUint8Array(dataUrl: string): Uint8Array {
  const base64 = dataUrl.split(',')[1];
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

/**
 * Sanitizes a string to a safe Bedrock identifier (lowercase letters, numbers, underscores)
 */
function sanitizeIdentifier(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]/g, '_').replace(/_+/g, '_').slice(0, 32) || 'custom_pack';
}

/**
 * Packages multiple skins into a genuine Minecraft Bedrock `.mcpack` file
 */
export async function createSkinMcPack(options: PackagerOptions): Promise<{ blob: Blob; fileName: string }> {
  const {
    packName,
    packDescription,
    skins,
    includeCreatorCredit = true,
    packIconDataUrl,
  } = options;

  const zip = new JSZip();
  const serializeName = sanitizeIdentifier(packName);

  // 1. Generate Manifest
  const headerUuid = generateUUID();
  const moduleUuid = generateUUID();

  const creditDescription = includeCreatorCredit
    ? `Created with mc-generator by ${CREATOR_NAME}`
    : (packDescription || 'Custom skin pack for Minecraft Bedrock');

  const manifest: Record<string, unknown> = {
    format_version: 2,
    header: {
      name: packName,
      description: creditDescription,
      uuid: headerUuid,
      version: [1, 0, 0],
      min_engine_version: [1, 20, 0],
    },
    modules: [
      {
        type: 'skin_pack',
        uuid: moduleUuid,
        version: [1, 0, 0],
      },
    ],
  };

  if (includeCreatorCredit) {
    manifest.metadata = {
      authors: [CREATOR_NAME],
      url: CREATOR_YOUTUBE_URL,
      license: 'All rights reserved to original creator',
    };
  }

  zip.file('manifest.json', JSON.stringify(manifest, null, 2));

  // 2. Generate skins.json
  const skinsJsonEntries = skins.map((skin, idx) => {
    const isSlim = skin.model === 'slim';
    const locKey = `skin_${idx}`;
    return {
      localization_name: locKey,
      geometry: isSlim ? 'geometry.humanoid.customSlim' : 'geometry.humanoid.custom',
      texture: `skin_${idx}.png`,
      type: 'free',
    };
  });

  const skinsJson = {
    skins: skinsJsonEntries,
    serialize_name: serializeName,
    localization_name: serializeName,
  };

  zip.file('skins.json', JSON.stringify(skinsJson, null, 2));

  // 3. Generate texts/en_US.lang
  let langContent = `skinpack.${serializeName}=${packName}\n`;
  if (includeCreatorCredit) {
    langContent += `skinpack.${serializeName}.creator=Made with mc-generator by ${CREATOR_NAME}\n`;
  }

  skins.forEach((skin, idx) => {
    langContent += `skin.${serializeName}.skin_${idx}=${skin.name || `Skin ${idx + 1}`}\n`;
  });

  zip.folder('texts')?.file('en_US.lang', langContent);

  // 4. Add Skin PNGs
  skins.forEach((skin, idx) => {
    if (skin.canvasDataUrl) {
      const bytes = dataUrlToUint8Array(skin.canvasDataUrl);
      zip.file(`skin_${idx}.png`, bytes);
    }
  });

  // 5. Add Pack Icon if available
  if (packIconDataUrl) {
    const iconBytes = dataUrlToUint8Array(packIconDataUrl);
    zip.file('pack_icon.png', iconBytes);
  }

  // 6. Build the .mcpack file (ZIP binary)
  const blob = await zip.generateAsync({
    type: 'blob',
    mimeType: 'application/octet-stream',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 },
  });

  const safeFileName = `${serializeName}.mcpack`;
  return { blob, fileName: safeFileName };
}
