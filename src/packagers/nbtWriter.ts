import { StructureData } from '../types';

/**
 * Minimal Little-Endian NBT Builder for Minecraft Bedrock .mcstructure files.
 * Bedrock uses Little-Endian NBT.
 */
class NBTWriter {
  private buffer: number[] = [];

  writeByte(val: number) {
    this.buffer.push(val & 0xff);
  }

  writeShort(val: number) {
    this.buffer.push(val & 0xff, (val >> 8) & 0xff);
  }

  writeInt(val: number) {
    this.buffer.push(val & 0xff, (val >> 8) & 0xff, (val >> 16) & 0xff, (val >> 24) & 0xff);
  }

  writeString(str: string) {
    const bytes = new TextEncoder().encode(str);
    this.writeShort(bytes.length);
    for (let i = 0; i < bytes.length; i++) {
      this.writeByte(bytes[i]);
    }
  }

  writeTagHeader(tagType: number, name: string) {
    this.writeByte(tagType);
    this.writeString(name);
  }

  getUint8Array(): Uint8Array {
    return new Uint8Array(this.buffer);
  }
}

/**
 * Builds a valid Bedrock .mcstructure binary array
 */
export function buildMcStructureBinary(structure: StructureData): Uint8Array {
  const [sizeX, sizeY, sizeZ] = structure.size;
  const writer = new NBTWriter();

  // Root Compound Tag (Type 10)
  writer.writeByte(10);
  writer.writeString(''); // Empty root name

  // format_version (Int = 1)
  writer.writeTagHeader(3, 'format_version');
  writer.writeInt(1);

  // size: List of 3 Ints
  writer.writeTagHeader(9, 'size');
  writer.writeByte(3); // Type Int
  writer.writeInt(3); // Length 3
  writer.writeInt(sizeX);
  writer.writeInt(sizeY);
  writer.writeInt(sizeZ);

  // structure_world_origin: List of 3 Ints [0, 0, 0]
  writer.writeTagHeader(9, 'structure_world_origin');
  writer.writeByte(3);
  writer.writeInt(3);
  writer.writeInt(0);
  writer.writeInt(0);
  writer.writeInt(0);

  // structure: Compound Tag
  writer.writeTagHeader(10, 'structure');

  // Palette preparation: distinct block IDs
  const paletteList: string[] = [];
  const paletteMap = new Map<string, number>();

  structure.blocks.forEach((b) => {
    if (!paletteMap.has(b.blockId)) {
      paletteMap.set(b.blockId, paletteList.length);
      paletteList.push(b.blockId);
    }
  });

  // 1. block_indices: List of Lists of Ints
  const totalCells = sizeX * sizeY * sizeZ;
  const indices = new Int32Array(totalCells).fill(-1);

  structure.blocks.forEach((b) => {
    if (b.x >= 0 && b.x < sizeX && b.y >= 0 && b.y < sizeY && b.z >= 0 && b.z < sizeZ) {
      const idx = (b.x * sizeY + b.y) * sizeZ + b.z;
      indices[idx] = paletteMap.get(b.blockId) ?? -1;
    }
  });

  writer.writeTagHeader(9, 'block_indices');
  writer.writeByte(9); // List of Lists
  writer.writeInt(2); // Layer 0 and Layer 1

  // Layer 0 (blocks)
  writer.writeByte(3); // Ints
  writer.writeInt(totalCells);
  for (let i = 0; i < totalCells; i++) {
    writer.writeInt(indices[i]);
  }

  // Layer 1 (waterlogged / extra)
  writer.writeByte(3); // Ints
  writer.writeInt(totalCells);
  for (let i = 0; i < totalCells; i++) {
    writer.writeInt(-1);
  }

  // 2. entities: List of Compounds (empty)
  writer.writeTagHeader(9, 'entities');
  writer.writeByte(10);
  writer.writeInt(0);

  // 3. palette: Compound
  writer.writeTagHeader(10, 'palette');
  writer.writeTagHeader(10, 'default');

  // block_palette: List of Compounds
  writer.writeTagHeader(9, 'block_palette');
  writer.writeByte(10); // Compound
  writer.writeInt(paletteList.length);

  paletteList.forEach((blockId) => {
    // name
    writer.writeTagHeader(8, 'name');
    writer.writeString(blockId);

    // states: Compound (empty)
    writer.writeTagHeader(10, 'states');
    writer.writeByte(0); // End states compound

    // version: Int (18100737)
    writer.writeTagHeader(3, 'version');
    writer.writeInt(18100737);

    writer.writeByte(0); // End block_palette element
  });

  // block_position_data: Compound
  writer.writeTagHeader(10, 'block_position_data');
  writer.writeByte(0);

  writer.writeByte(0); // End default
  writer.writeByte(0); // End palette
  writer.writeByte(0); // End structure
  writer.writeByte(0); // End root

  return writer.getUint8Array();
}
