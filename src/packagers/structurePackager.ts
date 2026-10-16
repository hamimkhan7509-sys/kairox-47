import JSZip from 'jszip';
import { generateUUID } from '../utils/uuid';
import { StructureData } from '../types';
import { CREATOR_NAME, CREATOR_YOUTUBE_URL } from '../config';
import { buildMcStructureBinary } from './nbtWriter';

function sanitizeIdentifier(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]/g, '_').replace(/_+/g, '_').slice(0, 32) || 'structure';
}

/**
 * Exports structure as pure .mcstructure NBT file for Structure Block loading
 */
export function exportStructureNbt(structure: StructureData): { blob: Blob; fileName: string } {
  const binary = buildMcStructureBinary(structure);
  const blob = new Blob([binary as unknown as BlobPart], { type: 'application/octet-stream' });
  const fileName = `${sanitizeIdentifier(structure.name)}.mcstructure`;
  return { blob, fileName };
}

/**
 * Exports structure as a Behavior Pack .mcpack containing a /function build command
 */
export async function exportStructureFunctionPack(
  structure: StructureData,
  includeCreatorCredit = true
): Promise<{ blob: Blob; fileName: string }> {
  const zip = new JSZip();
  const safeName = sanitizeIdentifier(structure.name);

  const headerUuid = generateUUID();
  const moduleUuid = generateUUID();
  const creditDescription = includeCreatorCredit
    ? `Created with mc-generator by ${CREATOR_NAME}`
    : structure.description;

  const manifest = {
    format_version: 2,
    header: {
      name: `${structure.name} [Build Pack]`,
      description: creditDescription,
      uuid: headerUuid,
      version: [1, 0, 0],
      min_engine_version: [1, 20, 0],
    },
    modules: [
      {
        description: 'Function commands to construct the build',
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

  // Build function commands relative to player (~ ~ ~)
  let functionCommands = `# ${structure.name}\n# ${creditDescription}\n\n`;
  structure.blocks.forEach((b) => {
    functionCommands += `setblock ~${b.x} ~${b.y} ~${b.z} ${b.blockId}\n`;
  });

  zip.file('functions/build.mcfunction', functionCommands);

  // Readme instructions
  const readme = `To build this in your world:
1. Import this .mcpack into Minecraft Bedrock.
2. Enable it in your World Settings > Behavior Packs.
3. Stand where you want to build and type:
   /function build
`;
  zip.file('README.txt', readme);

  const blob = await zip.generateAsync({
    type: 'blob',
    mimeType: 'application/octet-stream',
    compression: 'DEFLATE',
  });

  return { blob, fileName: `${safeName}_build_pack.mcpack` };
}
