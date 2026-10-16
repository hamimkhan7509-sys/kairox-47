import JSZip from 'jszip';
import { generateUUID } from '../utils/uuid';
import { AddonPackData } from '../types';
import { CREATOR_NAME, CREATOR_YOUTUBE_URL } from '../config';

interface AddonPackagerOptions {
  addonData: AddonPackData;
  includeCreatorCredit?: boolean;
  packIconDataUrl?: string;
}

function sanitizeIdentifier(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]/g, '_').replace(/_+/g, '_').slice(0, 32) || 'custom_addon';
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

export async function createAddonMcAddon(options: AddonPackagerOptions): Promise<{ blob: Blob; fileName: string }> {
  const { addonData, includeCreatorCredit = true, packIconDataUrl } = options;
  const rootZip = new JSZip();
  const safeName = sanitizeIdentifier(addonData.packName);

  // Generate UUID pairs
  const bpHeaderUuid = generateUUID();
  const bpModuleUuid = generateUUID();
  const rpHeaderUuid = generateUUID();
  const rpModuleUuid = generateUUID();
  const scriptModuleUuid = generateUUID();

  const creditDescription = includeCreatorCredit
    ? `Created with mc-generator by ${CREATOR_NAME}`
    : (addonData.packDescription || 'Custom Minecraft Bedrock add-on');

  // Subfolders for Behavior Pack (BP) and Resource Pack (RP)
  const bpFolder = rootZip.folder(`${safeName}_BP`)!;
  const rpFolder = rootZip.folder(`${safeName}_RP`)!;

  // ---------------- BEHAVIOR PACK ----------------
  const bpModules: Record<string, unknown>[] = [
    {
      description: 'Behavior Pack Module',
      type: 'data',
      uuid: bpModuleUuid,
      version: [1, 0, 0],
    },
  ];

  if (addonData.scriptMode) {
    bpModules.push({
      description: 'Scripting Module',
      type: 'script',
      language: 'javascript',
      entry: 'scripts/main.js',
      uuid: scriptModuleUuid,
      version: [1, 0, 0],
    });
  }

  const bpManifest: Record<string, unknown> = {
    format_version: 2,
    header: {
      name: `${addonData.packName} [BP]`,
      description: creditDescription,
      uuid: bpHeaderUuid,
      version: [1, 0, 0],
      min_engine_version: [1, 20, 80],
    },
    modules: bpModules,
    dependencies: [
      {
        uuid: rpHeaderUuid,
        version: [1, 0, 0],
      },
    ],
  };

  if (addonData.scriptMode) {
    bpManifest.dependencies = [
      ...(bpManifest.dependencies as Record<string, unknown>[]),
      {
        module_name: '@minecraft/server',
        version: '1.11.0',
      },
    ];
  }

  if (includeCreatorCredit) {
    bpManifest.metadata = {
      authors: [CREATOR_NAME],
      url: CREATOR_YOUTUBE_URL,
    };
  }

  bpFolder.file('manifest.json', JSON.stringify(bpManifest, null, 2));

  // Add Items to BP
  addonData.items.forEach((item) => {
    const itemName = item.identifier.split(':')[1] || 'item';
    const itemJson = {
      format_version: '1.20.80',
      'minecraft:item': {
        description: {
          identifier: item.identifier,
          category: item.category || 'Items',
        },
        components: {
          'minecraft:max_stack_size': item.maxStack || 64,
          'minecraft:hand_equipped': item.handEquipped ?? false,
          'minecraft:icon': itemName,
          ...(item.damage ? { 'minecraft:damage': item.damage } : {}),
          ...(item.foil ? { 'minecraft:glint': true } : {}),
        },
      },
    };
    bpFolder.file(`items/${itemName}.json`, JSON.stringify(itemJson, null, 2));
  });

  // Add Blocks to BP
  addonData.blocks.forEach((block) => {
    const blockName = block.identifier.split(':')[1] || 'block';
    const blockJson = {
      format_version: '1.20.80',
      'minecraft:block': {
        description: {
          identifier: block.identifier,
        },
        components: {
          'minecraft:light_emission': block.lightEmission || 0,
          'minecraft:destructible_by_mining': {
            seconds_to_destroy: block.hardness || 2.0,
          },
          'minecraft:explosion_resistance': block.explosionResistance || 3.0,
        },
      },
    };
    bpFolder.file(`blocks/${blockName}.json`, JSON.stringify(blockJson, null, 2));
  });

  // Add Entities to BP
  addonData.entities.forEach((entity) => {
    const entityName = entity.identifier.split(':')[1] || 'entity';
    const entityJson = {
      format_version: '1.20.80',
      'minecraft:entity': {
        description: {
          identifier: entity.identifier,
          is_spawnable: true,
          is_summonable: true,
          is_experimental: false,
        },
        component_groups: {},
        components: {
          'minecraft:type_family': {
            family: [entityName, entity.isHostile ? 'monster' : 'mob'],
          },
          'minecraft:health': {
            value: entity.health || 20,
            max: entity.health || 20,
          },
          'minecraft:movement': {
            value: entity.movementSpeed || 0.25,
          },
          'minecraft:physics': {},
          'minecraft:collision_box': {
            width: 0.6,
            height: 1.8,
          },
          ...(entity.isHostile
            ? {
                'minecraft:behavior.nearest_attackable_target': {
                  priority: 2,
                  entity_types: [{ filters: { test: 'is_family', subject: 'other', value: 'player' }, max_dist: 16 }],
                },
                'minecraft:attack': { damage: entity.attackDamage || 4 },
              }
            : {
                'minecraft:behavior.random_stroll': { priority: 4, speed_multiplier: 1.0 },
                'minecraft:behavior.look_at_player': { priority: 6, target_distance: 6.0 },
              }),
        },
      },
    };
    bpFolder.file(`entities/${entityName}.json`, JSON.stringify(entityJson, null, 2));
  });

  // Add Recipes to BP
  addonData.recipes.forEach((recipe, idx) => {
    const recipeJson = {
      format_version: '1.20.80',
      'minecraft:recipe_shapeless': {
        description: {
          identifier: recipe.identifier || `${addonData.namespace}:recipe_${idx + 1}`,
        },
        tags: ['crafting_table'],
        ingredients: recipe.ingredients.map((ing) => ({ item: ing })),
        result: {
          item: recipe.result,
          count: recipe.count || 1,
        },
      },
    };
    bpFolder.file(`recipes/recipe_${idx + 1}.json`, JSON.stringify(recipeJson, null, 2));
  });

  // Script file in BP
  if (addonData.scriptMode) {
    const script = addonData.scriptCode || `import { world } from '@minecraft/server';\n\nworld.afterEvents.entityHurt.subscribe((event) => {\n  console.warn('Entity hurt: ' + event.hurtEntity.typeId);\n});\n`;
    bpFolder.file('scripts/main.js', script);
  }

  // ---------------- RESOURCE PACK ----------------
  const rpManifest: Record<string, unknown> = {
    format_version: 2,
    header: {
      name: `${addonData.packName} [RP]`,
      description: creditDescription,
      uuid: rpHeaderUuid,
      version: [1, 0, 0],
      min_engine_version: [1, 20, 80],
    },
    modules: [
      {
        description: 'Resource Pack Module',
        type: 'resources',
        uuid: rpModuleUuid,
        version: [1, 0, 0],
      },
    ],
  };

  if (includeCreatorCredit) {
    rpManifest.metadata = {
      authors: [CREATOR_NAME],
      url: CREATOR_YOUTUBE_URL,
    };
  }

  rpFolder.file('manifest.json', JSON.stringify(rpManifest, null, 2));

  // Item & Terrain textures in RP
  const itemTextureEntries: Record<string, { textures: string }> = {};
  addonData.items.forEach((item) => {
    const itemName = item.identifier.split(':')[1] || 'item';
    itemTextureEntries[itemName] = { textures: `textures/items/${itemName}` };
  });

  rpFolder.file(
    'textures/item_texture.json',
    JSON.stringify(
      {
        resource_pack_name: safeName,
        texture_name: 'atlas.items',
        texture_data: itemTextureEntries,
      },
      null,
      2
    )
  );

  // Client entities in RP
  addonData.entities.forEach((entity) => {
    const entityName = entity.identifier.split(':')[1] || 'entity';
    const clientEntity = {
      format_version: '1.10.0',
      'minecraft:client_entity': {
        description: {
          identifier: entity.identifier,
          materials: { default: 'entity_alphatest' },
          textures: { default: `textures/entity/${entityName}` },
          geometry: { default: 'geometry.humanoid' },
          render_controllers: ['controller.render.default'],
        },
      },
    };
    rpFolder.file(`entity/${entityName}.entity.json`, JSON.stringify(clientEntity, null, 2));
  });

  // Lang file in RP
  let langContent = `pack.name=${addonData.packName}\npack.description=${creditDescription}\n`;
  addonData.items.forEach((i) => {
    langContent += `item.${i.identifier}=${i.name}\n`;
  });
  addonData.blocks.forEach((b) => {
    langContent += `tile.${b.identifier}.name=${b.name}\n`;
  });
  addonData.entities.forEach((e) => {
    langContent += `entity.${e.identifier}.name=${e.name}\n`;
  });
  rpFolder.file('texts/en_US.lang', langContent);

  // Pack Icon for both BP and RP
  if (packIconDataUrl) {
    const iconBytes = dataUrlToUint8Array(packIconDataUrl);
    bpFolder.file('pack_icon.png', iconBytes);
    rpFolder.file('pack_icon.png', iconBytes);
  }

  const blob = await rootZip.generateAsync({
    type: 'blob',
    mimeType: 'application/octet-stream',
    compression: 'DEFLATE',
  });

  return { blob, fileName: `${safeName}.mcaddon` };
}
