export type ArmModel = 'classic' | 'slim';

export interface SkinLayerConfig {
  hairStyle: 'short' | 'messy' | 'hood' | 'helmet' | 'long' | 'spiky' | 'ninja_cowl' | 'bandana' | 'cyber_headset';
  faceExpression: 'neutral' | 'determined' | 'glow_eyes' | 'visor' | 'masked' | 'cyber_implant' | 'eyepatch';
  clothingStyle: 'cyber_suit' | 'tactical_vest' | 'wizard_robe' | 'medieval_tunic' | 'leather_jacket' | 'plate_armor' | 'hoodie' | 'adventurer';
  overlayType: 'full_coat' | 'shoulder_pads' | 'cloak' | 'goggles' | 'headband' | 'cyber_wires' | 'none';
  hasGloves: boolean;
  hasBoots: boolean;
  hasBelt: boolean;
}

export interface SkinPalette {
  primaryHex: string;
  secondaryHex: string;
  accentHex: string;
  skinHex: string;
  hairHex: string;
  eyesHex: string;
  pantsHex: string;
  bootsHex: string;
  accessoryHex: string;
  shadingIntensity: number;
}

export interface GeneratedSkinItem {
  id: string;
  name: string;
  description: string;
  model: ArmModel;
  palette: SkinPalette;
  layers: SkinLayerConfig;
  canvasDataUrl?: string;
  accentFeatures?: Array<{
    part: 'head' | 'torso' | 'arm' | 'leg';
    color: string;
    description: string;
  }>;
}

export interface SkinPackState {
  packName: string;
  packDescription: string;
  skins: GeneratedSkinItem[];
  selectedSkinIndex: number;
}

// ---------------- Texture Pack Types ----------------
export type TextureResolution = 16 | 32 | 64;

export interface TextureTile {
  id: string;
  name: string;
  targetId: string; // e.g. "stone", "grass_block", "diamond_sword"
  type: 'block' | 'item';
  category: 'stone_earth' | 'wood_plants' | 'ores_minerals' | 'weapons_tools' | 'armor';
  palette: string[]; // 4-6 hex codes
  patternStyle: 'natural' | 'geometric' | 'metallic' | 'organic' | 'crystalline';
  canvasDataUrl?: string;
}

export interface TexturePackState {
  packName: string;
  packDescription: string;
  theme: string;
  resolution: TextureResolution;
  selectedCategories: string[];
  tiles: TextureTile[];
}

// ---------------- Add-on Types ----------------
export interface AddonItem {
  identifier: string; // namespace:item_name
  name: string;
  category: 'Equipment' | 'Items' | 'Nature';
  maxStack: number;
  damage?: number;
  handEquipped?: boolean;
  foil?: boolean;
  textureDataUrl?: string;
  components?: Record<string, unknown>;
}

export interface AddonBlock {
  identifier: string; // namespace:block_name
  name: string;
  lightEmission?: number; // 0-15
  explosionResistance?: number;
  hardness?: number;
  textureDataUrl?: string;
  components?: Record<string, unknown>;
}

export interface AddonEntity {
  identifier: string; // namespace:entity_name
  name: string;
  health: number;
  movementSpeed: number;
  attackDamage?: number;
  isHostile: boolean;
  spawnBiome?: string;
  lootDrops?: string[];
  clientColor?: string;
}

export interface AddonRecipe {
  identifier: string;
  type: 'shaped' | 'shapeless';
  result: string;
  count: number;
  ingredients: string[];
}

export interface AddonPackData {
  packName: string;
  packDescription: string;
  namespace: string;
  items: AddonItem[];
  blocks: AddonBlock[];
  entities: AddonEntity[];
  recipes: AddonRecipe[];
  scriptMode: boolean;
  scriptCode?: string;
  warnings: string[];
}

// ---------------- Structure Types ----------------
export interface VoxelBlock {
  x: number;
  y: number;
  z: number;
  blockId: string;
  color: string;
}

export interface StructureData {
  name: string;
  theme: string;
  size: [number, number, number]; // width, height, length
  blocks: VoxelBlock[];
  palette: { blockId: string; color: string; label: string }[];
  description: string;
  commands: string[];
}

// ---------------- World Builder Types ----------------
export interface WorldBuilderData {
  name: string;
  theme: string;
  description: string;
  functions: {
    fileName: string;
    description: string;
    commands: string[];
  }[];
  flatWorldPreset: string;
  presetSummary: string;
  recommendedSettings: {
    simulationDistance: number;
    difficulty: 'peaceful' | 'easy' | 'normal' | 'hard';
    daylightCycle: boolean;
    keepInventory: boolean;
    mobSpawning: boolean;
  };
}

export interface SavedCreation {
  id: string;
  type: 'skin_pack' | 'texture_pack' | 'addon' | 'structure' | 'world';
  title: string;
  description: string;
  createdAt: number;
  fileName: string;
  dataUrl?: string;
  previewUrl?: string;
  metadata?: Record<string, unknown>;
}

export interface PromptImprovementResponse {
  originalPrompt: string;
  improvedPrompt: string;
  tags: string[];
  suggestions: string[];
}
