import JSZip from 'jszip';
import { generateUUID } from '../utils/uuid';
import { TextureTile } from '../types';
import { CREATOR_NAME, CREATOR_YOUTUBE_URL } from '../config';

interface TexturePackagerOptions {
  packName: string;
  packDescription?: string;
  tiles: TextureTile[];
  includeCreatorCredit?: boolean;
  packIconDataUrl?: string;
}

function dataUrlToUint8Array(dataUrl: string): Uint8Array {
  const base64 = dataUrl.split(',')[1];
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

function sanitizeIdentifier(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]/g, '_').replace(/_+/g, '_').slice(0, 32) || 'custom_textures';
}

export async function createTextureMcPack(options: TexturePackagerOptions): Promise<{ blob: Blob; fileName: string }> {
  const { packName, packDescription, tiles, includeCreatorCredit = true, packIconDataUrl } = options;
  const zip = new JSZip();
  const serializeName = sanitizeIdentifier(packName);

  // 1. Manifest
  const headerUuid = generateUUID();
  const moduleUuid = generateUUID();

  const creditDescription = includeCreatorCredit
    ? `Created with mc-generator by ${CREATOR_NAME}`
    : (packDescription || 'Custom Minecraft Bedrock texture pack');

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
        type: 'resources',
        uuid: moduleUuid,
        version: [1, 0, 0],
      },
    ],
  };

  if (includeCreatorCredit) {
    manifest.metadata = {
      authors: [CREATOR_NAME],
      url: CREATOR_YOUTUBE_URL,
    };
  }

  zip.file('manifest.json', JSON.stringify(manifest, null, 2));

  // 2. Terrain & Item Texture JSON mappings
  const terrainData: Record<string, { textures: string }> = {};
  const itemData: Record<string, { textures: string }> = {};

  tiles.forEach((tile) => {
    const cleanId = sanitizeIdentifier(tile.targetId);
    if (tile.type === 'block') {
      terrainData[cleanId] = { textures: `textures/blocks/${cleanId}` };
      if (tile.canvasDataUrl) {
        zip.file(`textures/blocks/${cleanId}.png`, dataUrlToUint8Array(tile.canvasDataUrl));
      }
    } else {
      itemData[cleanId] = { textures: `textures/items/${cleanId}` };
      if (tile.canvasDataUrl) {
        zip.file(`textures/items/${cleanId}.png`, dataUrlToUint8Array(tile.canvasDataUrl));
      }
    }
  });

  zip.file(
    'textures/terrain_texture.json',
    JSON.stringify(
      {
        resource_pack_name: serializeName,
        texture_name: 'atlas.terrain',
        texture_data: terrainData,
      },
      null,
      2
    )
  );

  zip.file(
    'textures/item_texture.json',
    JSON.stringify(
      {
        resource_pack_name: serializeName,
        texture_name: 'atlas.items',
        texture_data: itemData,
      },
      null,
      2
    )
  );

  // 3. Texts
  let lang = `pack.name=${packName}\npack.description=${creditDescription}\n`;
  tiles.forEach((t) => {
    lang += `tile.${sanitizeIdentifier(t.targetId)}.name=${t.name}\n`;
  });
  zip.file('texts/en_US.lang', lang);

  // 4. Pack Icon
  if (packIconDataUrl) {
    zip.file('pack_icon.png', dataUrlToUint8Array(packIconDataUrl));
  }

  const blob = await zip.generateAsync({
    type: 'blob',
    mimeType: 'application/octet-stream',
    compression: 'DEFLATE',
  });

  return { blob, fileName: `${serializeName}.mcpack` };
}
