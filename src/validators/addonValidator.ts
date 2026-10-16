import { AddonPackData } from '../types';

export interface ValidationReport {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  fixedData: AddonPackData;
}

/**
 * Validates and auto-fixes Bedrock Add-on identifiers, UUIDs, and JSON structures
 */
export function validateAndFixAddon(data: AddonPackData): ValidationReport {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Deep clone data to fix
  const fixed: AddonPackData = JSON.parse(JSON.stringify(data));

  // 1. Validate / Fix Namespace
  let ns = (fixed.namespace || 'custom').toLowerCase().replace(/[^a-z0-9]/g, '');
  if (ns.length < 2) ns = 'custom';
  if (ns !== fixed.namespace) {
    warnings.push(`Namespace "${fixed.namespace}" was auto-corrected to "${ns}" (lowercase letters only).`);
    fixed.namespace = ns;
  }

  const fixIdentifier = (id: string, defaultName: string): string => {
    if (!id || typeof id !== 'string') id = defaultName;
    let clean = id.toLowerCase().replace(/[^a-z0-9_:]/g, '_');
    if (!clean.includes(':')) {
      clean = `${ns}:${clean}`;
    } else {
      const parts = clean.split(':');
      clean = `${ns}:${parts[1] || defaultName}`;
    }
    return clean;
  };

  // 2. Validate Items
  fixed.items = fixed.items.map((item, idx) => {
    const fixedId = fixIdentifier(item.identifier, `item_${idx + 1}`);
    if (fixedId !== item.identifier) {
      warnings.push(`Item ID "${item.identifier}" was fixed to "${fixedId}".`);
      item.identifier = fixedId;
    }
    item.maxStack = Math.min(64, Math.max(1, item.maxStack || 64));
    return item;
  });

  // 3. Validate Blocks
  fixed.blocks = fixed.blocks.map((block, idx) => {
    const fixedId = fixIdentifier(block.identifier, `block_${idx + 1}`);
    if (fixedId !== block.identifier) {
      warnings.push(`Block ID "${block.identifier}" was fixed to "${fixedId}".`);
      block.identifier = fixedId;
    }
    if (block.lightEmission !== undefined) {
      block.lightEmission = Math.min(15, Math.max(0, block.lightEmission));
    }
    return block;
  });

  // 4. Validate Entities
  fixed.entities = fixed.entities.map((entity, idx) => {
    const fixedId = fixIdentifier(entity.identifier, `entity_${idx + 1}`);
    if (fixedId !== entity.identifier) {
      warnings.push(`Entity ID "${entity.identifier}" was fixed to "${fixedId}".`);
      entity.identifier = fixedId;
    }
    entity.health = Math.max(1, entity.health || 20);
    entity.movementSpeed = Math.min(1.5, Math.max(0.1, entity.movementSpeed || 0.25));
    return entity;
  });

  // 5. Check if at least one component exists
  const totalComponents = fixed.items.length + fixed.blocks.length + fixed.entities.length;
  if (totalComponents === 0) {
    errors.push('The add-on must define at least one item, block, or entity.');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    fixedData: fixed,
  };
}
