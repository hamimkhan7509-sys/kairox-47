import JSZip from 'jszip';
import { generateUUID } from '../utils/uuid';
import { WorldBuilderData } from '../types';
import { CREATOR_NAME, CREATOR_YOUTUBE_URL } from '../config';

interface WorldPackagerOptions {
  worldData: WorldBuilderData;
  includeCreatorCredit?: boolean;
  packIconDataUrl?: string;
}

function sanitizeIdentifier(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]/g, '_').replace(/_+/g, '_').slice(0, 32) || 'world_builder';
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

export async function createWorldBuilderMcPack(
  options: WorldPackagerOptions
): Promise<{ blob: Blob; fileName: string }> {
  const { worldData, includeCreatorCredit = true, packIconDataUrl } = options;
  const zip = new JSZip();
  const safeName = sanitizeIdentifier(worldData.name);

  const headerUuid = generateUUID();
  const moduleUuid = generateUUID();
  const creditDescription = includeCreatorCredit
    ? `Created with mc-generator by ${CREATOR_NAME}`
    : worldData.description;

  const manifest = {
    format_version: 2,
    header: {
      name: `${worldData.name} [World Builder]`,
      description: creditDescription,
      uuid: headerUuid,
      version: [1, 0, 0],
      min_engine_version: [1, 20, 0],
    },
    modules: [
      {
        description: 'World Builder Generator Functions',
        type: 'data',
        uuid: moduleUuid,
        version: [1, 0, 0],
      },
    ],
    metadata: includeCreatorCredit
      ? { authors: [CREATOR_NAME], url: CREATOR_YOUTUBE_URL }
      : undefined,
  };

  zip.file('manifest.json', JSON.stringify(manifest, null, 2));

  // Add functions
  worldData.functions.forEach((fn) => {
    let content = `# ${fn.description}\n# Made with mc-generator\n\n`;
    fn.commands.forEach((cmd) => {
      content += `${cmd.startsWith('/') ? cmd.slice(1) : cmd}\n`;
    });
    const fileName = fn.fileName.endsWith('.mcfunction') ? fn.fileName : `${fn.fileName}.mcfunction`;
    zip.file(`functions/${fileName}`, content);
  });

  // Flat preset readme
  const guide = `--- WORLD GENERATOR GUIDE ---
Recommended Flat World Preset:
${worldData.flatWorldPreset}

Layer summary: ${worldData.presetSummary}

Recommended World Settings:
- Simulation Distance: ${worldData.recommendedSettings.simulationDistance}
- Difficulty: ${worldData.recommendedSettings.difficulty}
- Keep Inventory: ${worldData.recommendedSettings.keepInventory ? 'ON' : 'OFF'}

How to use in game:
1. Enable this behavior pack in your world.
2. In chat, type:
   /function ${worldData.functions[0]?.fileName.replace('.mcfunction', '') || 'generate'}
`;
  zip.file('WORLD_PRESET_GUIDE.txt', guide);

  if (packIconDataUrl) {
    zip.file('pack_icon.png', dataUrlToUint8Array(packIconDataUrl));
  }

  const blob = await zip.generateAsync({
    type: 'blob',
    mimeType: 'application/octet-stream',
    compression: 'DEFLATE',
  });

  return { blob, fileName: `${safeName}.mcpack` };
}
