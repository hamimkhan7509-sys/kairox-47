import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '10mb' }));

// In-memory rate limiting map: ip -> timestamps[]
const rateLimitMap = new Map<string, number[]>();
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 40; // Generous per-minute limit

function rateLimiter(req: Request, res: Response, next: () => void) {
  const ip = req.ip || req.headers['x-forwarded-for']?.toString() || 'unknown';
  const now = Date.now();
  const windowStart = now - RATE_LIMIT_WINDOW_MS;

  const timestamps = (rateLimitMap.get(ip) || []).filter((t) => t > windowStart);
  if (timestamps.length >= MAX_REQUESTS_PER_WINDOW) {
    return res.status(429).json({
      error: "You're generating requests a bit too fast! Please wait a few seconds and try again.",
      rateLimited: true,
    });
  }

  timestamps.push(now);
  rateLimitMap.set(ip, timestamps);
  next();
}

// Content safety check (disallow hateful, sexual, or real-person likeness)
function checkContentSafety(prompt: string): { safe: boolean; reason?: string } {
  const lower = prompt.toLowerCase();
  const prohibitedTerms = [
    'nazi', 'hitler', 'swastika', 'kkk', 'porn', 'naked', 'nude',
    'erotic', 'nsfw', 'gore', 'decapitated', 'suicide', 'genocide',
    'terrorist', 'isis', 'pedo', 'child abuse', 'deepfake'
  ];

  for (const term of prohibitedTerms) {
    if (lower.includes(term)) {
      return {
        safe: false,
        reason: 'This prompt includes content that violates our community standards. Please describe a fantasy, heroic, gaming, or fictional creation instead.',
      };
    }
  }

  return { safe: true };
}

// Shared Gemini AI client with telemetry header
const getGeminiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY environment variable is not configured');
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
};

// API: Health check
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'mc-generator',
    timestamp: new Date().toISOString(),
  });
});

// API: Improve User Prompt
app.post('/api/improve-prompt', rateLimiter, async (req: Request, res: Response) => {
  try {
    const { prompt, generatorType = 'skin' } = req.body;
    if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    const safety = checkContentSafety(prompt);
    if (!safety.safe) {
      return res.status(400).json({ error: safety.reason });
    }

    const ai = getGeminiClient();
    const systemPrompt = `You are an expert Minecraft Bedrock add-on and content designer.
The user provided a brief idea for a ${generatorType} generator.
Your job is to expand and refine their idea into an ultra-detailed, creative, visually rich description optimized for Minecraft Bedrock content generation.
Return JSON with:
- "improvedPrompt": A 2-3 sentence vivid, high-clarity prompt.
- "tags": Array of 3-5 keywords.
- "suggestions": Array of 2 optional variation ideas the user could try.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: `User idea: "${prompt.trim()}"`,
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            improvedPrompt: { type: Type.STRING },
            tags: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            suggestions: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
          },
          required: ['improvedPrompt', 'tags', 'suggestions'],
        },
      },
    });

    const text = response.text?.trim() || '{}';
    const parsed = JSON.parse(text);
    res.json({
      originalPrompt: prompt,
      improvedPrompt: parsed.improvedPrompt || prompt,
      tags: parsed.tags || [],
      suggestions: parsed.suggestions || [],
    });
  } catch (error: unknown) {
    const err = error as Error;
    console.error('Error improving prompt:', err.message);
    res.status(500).json({
      error: 'Failed to improve prompt. Please try again.',
      details: err.message,
    });
  }
});

// API: Generate Skin Details
app.post('/api/generate-skin', rateLimiter, async (req: Request, res: Response) => {
  try {
    const { prompt, model = 'classic', styleOptions } = req.body;
    if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
      return res.status(400).json({ error: 'Please enter a character description.' });
    }

    const safety = checkContentSafety(prompt);
    if (!safety.safe) {
      return res.status(400).json({ error: safety.reason });
    }

    const ai = getGeminiClient();

    const systemInstruction = `You are a professional pixel artist and Minecraft Bedrock skin creator.
Generate a structured Minecraft Bedrock skin specification based on the user's description.
The character will be rendered onto a standard 64x64 Bedrock humanoid UV skin layout.

Rules:
1. Provide a cohesive, complementary hex color palette:
   - primaryHex (main tunic/chest/shirt/armor color)
   - secondaryHex (contrast trim, jacket, secondary armor)
   - accentHex (glowing eyes, visor, neon runes, gems, buckles)
   - skinHex (natural or fantasy skin tone: e.g. peach, pale, alien green, robotic silver)
   - hairHex (hair, cowl, or helmet color)
   - eyesHex (iris color)
   - pantsHex (trousers/leggings color)
   - bootsHex (footwear/boots color)
   - accessoryHex (gloves, belt, scarf, or straps)
2. Choose layer and silhouette settings:
   - hairStyle: 'short' | 'messy' | 'hood' | 'helmet' | 'long' | 'spiky' | 'ninja_cowl' | 'bandana' | 'cyber_headset'
   - faceExpression: 'neutral' | 'determined' | 'glow_eyes' | 'visor' | 'masked' | 'cyber_implant' | 'eyepatch'
   - clothingStyle: 'cyber_suit' | 'tactical_vest' | 'wizard_robe' | 'medieval_tunic' | 'leather_jacket' | 'plate_armor' | 'hoodie' | 'adventurer'
   - overlayType: 'full_coat' | 'shoulder_pads' | 'cloak' | 'goggles' | 'headband' | 'cyber_wires' | 'none'
   - hasGloves (boolean)
   - hasBoots (boolean)
   - hasBelt (boolean)
3. Ensure colors are valid 6-character hex strings starting with #.
4. Keep the theme original and creative. Never replicate copyrighted characters directly.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: `Create a Minecraft Bedrock skin for: "${prompt.trim()}". Model: ${model}. Additional options: ${JSON.stringify(styleOptions || {})}`,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING, description: 'Creative name for this skin' },
            description: { type: Type.STRING, description: 'Short 1-sentence bio' },
            palette: {
              type: Type.OBJECT,
              properties: {
                primaryHex: { type: Type.STRING },
                secondaryHex: { type: Type.STRING },
                accentHex: { type: Type.STRING },
                skinHex: { type: Type.STRING },
                hairHex: { type: Type.STRING },
                eyesHex: { type: Type.STRING },
                pantsHex: { type: Type.STRING },
                bootsHex: { type: Type.STRING },
                accessoryHex: { type: Type.STRING },
                shadingIntensity: { type: Type.NUMBER },
              },
              required: [
                'primaryHex',
                'secondaryHex',
                'accentHex',
                'skinHex',
                'hairHex',
                'eyesHex',
                'pantsHex',
                'bootsHex',
                'accessoryHex',
              ],
            },
            layers: {
              type: Type.OBJECT,
              properties: {
                hairStyle: {
                  type: Type.STRING,
                  enum: ['short', 'messy', 'hood', 'helmet', 'long', 'spiky', 'ninja_cowl', 'bandana', 'cyber_headset'],
                },
                faceExpression: {
                  type: Type.STRING,
                  enum: ['neutral', 'determined', 'glow_eyes', 'visor', 'masked', 'cyber_implant', 'eyepatch'],
                },
                clothingStyle: {
                  type: Type.STRING,
                  enum: ['cyber_suit', 'tactical_vest', 'wizard_robe', 'medieval_tunic', 'leather_jacket', 'plate_armor', 'hoodie', 'adventurer'],
                },
                overlayType: {
                  type: Type.STRING,
                  enum: ['full_coat', 'shoulder_pads', 'cloak', 'goggles', 'headband', 'cyber_wires', 'none'],
                },
                hasGloves: { type: Type.BOOLEAN },
                hasBoots: { type: Type.BOOLEAN },
                hasBelt: { type: Type.BOOLEAN },
              },
              required: ['hairStyle', 'faceExpression', 'clothingStyle', 'overlayType', 'hasGloves', 'hasBoots', 'hasBelt'],
            },
            accentFeatures: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  part: { type: Type.STRING, enum: ['head', 'torso', 'arm', 'leg'] },
                  color: { type: Type.STRING },
                  description: { type: Type.STRING },
                },
                required: ['part', 'color', 'description'],
              },
            },
          },
          required: ['name', 'description', 'palette', 'layers'],
        },
      },
    });

    const text = response.text?.trim() || '{}';
    const parsed = JSON.parse(text);

    const sanitizeHex = (h: string, fallback: string) =>
      typeof h === 'string' && /^#[0-9a-fA-F]{6}$/.test(h) ? h : fallback;

    const skinData = {
      id: 'skin_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7),
      name: parsed.name || 'Custom Hero',
      description: parsed.description || 'AI generated Bedrock skin',
      model: model === 'slim' ? 'slim' : 'classic',
      palette: {
        primaryHex: sanitizeHex(parsed.palette?.primaryHex, '#10b981'),
        secondaryHex: sanitizeHex(parsed.palette?.secondaryHex, '#1e293b'),
        accentHex: sanitizeHex(parsed.palette?.accentHex, '#34d399'),
        skinHex: sanitizeHex(parsed.palette?.skinHex, '#fbcfe8'),
        hairHex: sanitizeHex(parsed.palette?.hairHex, '#334155'),
        eyesHex: sanitizeHex(parsed.palette?.eyesHex, '#0284c7'),
        pantsHex: sanitizeHex(parsed.palette?.pantsHex, '#1e293b'),
        bootsHex: sanitizeHex(parsed.palette?.bootsHex, '#0f172a'),
        accessoryHex: sanitizeHex(parsed.palette?.accessoryHex, '#10b981'),
        shadingIntensity: Math.max(0.05, Math.min(0.25, parsed.palette?.shadingIntensity || 0.12)),
      },
      layers: {
        hairStyle: parsed.layers?.hairStyle || 'short',
        faceExpression: parsed.layers?.faceExpression || 'neutral',
        clothingStyle: parsed.layers?.clothingStyle || 'cyber_suit',
        overlayType: parsed.layers?.overlayType || 'full_coat',
        hasGloves: parsed.layers?.hasGloves ?? true,
        hasBoots: parsed.layers?.hasBoots ?? true,
        hasBelt: parsed.layers?.hasBelt ?? true,
      },
      accentFeatures: parsed.accentFeatures || [],
    };

    res.json(skinData);
  } catch (error: unknown) {
    const err = error as Error;
    console.error('Error generating skin:', err.message);
    res.status(500).json({
      error: 'Generation failed. Please try again with different phrasing.',
      details: err.message,
    });
  }
});

// API: Generate Texture Pack Details
app.post('/api/generate-texture-pack', rateLimiter, async (req: Request, res: Response) => {
  try {
    const { theme = 'medieval fantasy', resolution = 16, selectedCategories = [], customPrompt = '' } = req.body;
    const safety = checkContentSafety(theme + ' ' + customPrompt);
    if (!safety.safe) {
      return res.status(400).json({ error: safety.reason });
    }

    const ai = getGeminiClient();

    const systemInstruction = `You are a Minecraft Bedrock texture pack artist.
Generate custom, original tile designs for a Minecraft Bedrock Resource Pack matching the user's theme: "${theme}".
Resolution: ${resolution}x${resolution}.
Categories requested: ${JSON.stringify(selectedCategories)}.
Generate a set of 8 to 12 distinct tiles across blocks (e.g. stone, dirt, grass, cobblestone, oak_planks, diamond_ore) and items (e.g. sword, pickaxe, apple).
Each tile must have:
- targetId: standard Bedrock texture name (e.g. "stone", "cobblestone", "dirt", "grass_top", "planks_oak", "diamond_ore", "sword_diamond", "pickaxe_iron", "apple")
- name: Human readable display name
- type: 'block' or 'item'
- category: one of 'stone_earth', 'wood_plants', 'ores_minerals', 'weapons_tools', 'armor'
- palette: array of 4-6 hex color codes (from darkest outline to brightest highlight)
- patternStyle: 'natural' | 'geometric' | 'metallic' | 'organic' | 'crystalline'
Pack details: packName, packDescription. All art must be original and cohesive with the theme.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: `Generate texture pack tiles for theme "${theme}". ${customPrompt ? `Notes: ${customPrompt}` : ''}`,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            packName: { type: Type.STRING },
            packDescription: { type: Type.STRING },
            tiles: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  targetId: { type: Type.STRING },
                  name: { type: Type.STRING },
                  type: { type: Type.STRING, enum: ['block', 'item'] },
                  category: {
                    type: Type.STRING,
                    enum: ['stone_earth', 'wood_plants', 'ores_minerals', 'weapons_tools', 'armor'],
                  },
                  palette: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                  },
                  patternStyle: {
                    type: Type.STRING,
                    enum: ['natural', 'geometric', 'metallic', 'organic', 'crystalline'],
                  },
                },
                required: ['targetId', 'name', 'type', 'category', 'palette', 'patternStyle'],
              },
            },
          },
          required: ['packName', 'packDescription', 'tiles'],
        },
      },
    });

    const parsed = JSON.parse(response.text?.trim() || '{}');
    res.json(parsed);
  } catch (error: unknown) {
    const err = error as Error;
    console.error('Error generating texture pack:', err.message);
    res.status(500).json({ error: 'Failed to generate texture pack: ' + err.message });
  }
});

// API: Generate Add-on (Behavior & Resource Pack)
app.post('/api/generate-addon', rateLimiter, async (req: Request, res: Response) => {
  try {
    const { prompt, scriptMode = false } = req.body;
    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    const safety = checkContentSafety(prompt);
    if (!safety.safe) {
      return res.status(400).json({ error: safety.reason });
    }

    const ai = getGeminiClient();

    const systemInstruction = `You are a Minecraft Bedrock Add-on engineer.
Create a complete, functional Bedrock Add-on specification (Behavior Pack & Resource Pack) matching the user's idea: "${prompt.trim()}".
Use Bedrock format_version "1.20.80".
Ensure:
1. Valid namespace (e.g. "custom", 3-8 lowercase letters).
2. Clean identifiers in the format "namespace:identifier" with strictly lowercase letters and underscores.
3. If an item is requested, provide its components (damage, max_stack_size, hand_equipped, etc.).
4. If a block is requested, provide light_emission (0-15), hardness, explosion_resistance.
5. If an entity/mob is requested, provide health (e.g. 20-100), movementSpeed (0.2-0.5), isHostile, attackDamage, lootDrops.
6. Provide crafting recipes if applicable.
7. If scriptMode is true, provide a small working JavaScript snippet for "@minecraft/server" (e.g. world.afterEvents.entityHurt or world.afterEvents.itemUse).
8. Return clean structured JSON.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: `Create Minecraft Bedrock add-on for: "${prompt.trim()}". Script mode: ${scriptMode}`,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            packName: { type: Type.STRING },
            packDescription: { type: Type.STRING },
            namespace: { type: Type.STRING },
            items: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  identifier: { type: Type.STRING },
                  name: { type: Type.STRING },
                  category: { type: Type.STRING, enum: ['Equipment', 'Items', 'Nature'] },
                  maxStack: { type: Type.INTEGER },
                  damage: { type: Type.INTEGER },
                  handEquipped: { type: Type.BOOLEAN },
                  foil: { type: Type.BOOLEAN },
                },
                required: ['identifier', 'name', 'category', 'maxStack'],
              },
            },
            blocks: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  identifier: { type: Type.STRING },
                  name: { type: Type.STRING },
                  lightEmission: { type: Type.INTEGER },
                  hardness: { type: Type.NUMBER },
                  explosionResistance: { type: Type.NUMBER },
                },
                required: ['identifier', 'name'],
              },
            },
            entities: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  identifier: { type: Type.STRING },
                  name: { type: Type.STRING },
                  health: { type: Type.INTEGER },
                  movementSpeed: { type: Type.NUMBER },
                  attackDamage: { type: Type.INTEGER },
                  isHostile: { type: Type.BOOLEAN },
                  spawnBiome: { type: Type.STRING },
                  lootDrops: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                  },
                  clientColor: { type: Type.STRING },
                },
                required: ['identifier', 'name', 'health', 'movementSpeed', 'isHostile'],
              },
            },
            recipes: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  identifier: { type: Type.STRING },
                  type: { type: Type.STRING, enum: ['shaped', 'shapeless'] },
                  result: { type: Type.STRING },
                  count: { type: Type.INTEGER },
                  ingredients: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                  },
                },
                required: ['identifier', 'type', 'result', 'count', 'ingredients'],
              },
            },
            scriptCode: { type: Type.STRING },
          },
          required: ['packName', 'packDescription', 'namespace', 'items', 'blocks', 'entities', 'recipes'],
        },
      },
    });

    const parsed = JSON.parse(response.text?.trim() || '{}');
    res.json(parsed);
  } catch (error: unknown) {
    const err = error as Error;
    console.error('Error generating add-on:', err.message);
    res.status(500).json({ error: 'Failed to generate add-on: ' + err.message });
  }
});

// API: Generate Structure / Voxel Build
app.post('/api/generate-structure', rateLimiter, async (req: Request, res: Response) => {
  try {
    const { prompt, size = 'medium', palette = 'medieval' } = req.body;
    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    const safety = checkContentSafety(prompt);
    if (!safety.safe) {
      return res.status(400).json({ error: safety.reason });
    }

    const ai = getGeminiClient();

    const systemInstruction = `You are an expert Minecraft Bedrock architectural builder.
Generate a 3D block layout for a Minecraft build matching the user's description: "${prompt.trim()}".
Dimensions should be reasonable for mobile performance:
- small: 7x7x7
- medium: 11x9x11
- large: 15x11x15
Use genuine Bedrock block identifiers:
e.g. 'minecraft:stone_bricks', 'minecraft:cobblestone', 'minecraft:oak_planks', 'minecraft:spruce_planks', 'minecraft:glass', 'minecraft:iron_bars', 'minecraft:bookshelf', 'minecraft:oak_log', 'minecraft:lantern', 'minecraft:smooth_stone', 'minecraft:gold_block'.
Return a list of non-air blocks with coordinates x, y, z (where 0 <= x < width, 0 <= y < height, 0 <= z < length), blockId, and a hex color for 3D visualization.
Also include a list of 5-15 in-game /setblock or /fill commands to build it manually if desired.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: `Create structure for: "${prompt.trim()}". Size: ${size}, palette: ${palette}`,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            theme: { type: Type.STRING },
            description: { type: Type.STRING },
            size: {
              type: Type.ARRAY,
              items: { type: Type.INTEGER },
              description: '[width, height, length]',
            },
            palette: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  blockId: { type: Type.STRING },
                  label: { type: Type.STRING },
                  color: { type: Type.STRING },
                },
                required: ['blockId', 'label', 'color'],
              },
            },
            blocks: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  x: { type: Type.INTEGER },
                  y: { type: Type.INTEGER },
                  z: { type: Type.INTEGER },
                  blockId: { type: Type.STRING },
                  color: { type: Type.STRING },
                },
                required: ['x', 'y', 'z', 'blockId', 'color'],
              },
            },
            commands: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
          },
          required: ['name', 'theme', 'description', 'size', 'palette', 'blocks', 'commands'],
        },
      },
    });

    const parsed = JSON.parse(response.text?.trim() || '{}');
    res.json(parsed);
  } catch (error: unknown) {
    const err = error as Error;
    console.error('Error generating structure:', err.message);
    res.status(500).json({ error: 'Failed to generate structure: ' + err.message });
  }
});

// API: Generate World Builder Pack & Presets
app.post('/api/generate-world-builder', rateLimiter, async (req: Request, res: Response) => {
  try {
    const { theme = 'spawn village', description = '' } = req.body;
    const safety = checkContentSafety(theme + ' ' + description);
    if (!safety.safe) {
      return res.status(400).json({ error: safety.reason });
    }

    const ai = getGeminiClient();

    const systemInstruction = `You are a Minecraft Bedrock world generation expert.
The user wants a "World Builder Pack" (a behavior pack with in-game /function commands that spawn themed zones relative to the player: ~ ~ ~) plus Flat World preset codes.
Generate:
1. name and description
2. functions: array of function files (e.g. "build_arena.mcfunction", "spawn_island.mcfunction") with clean Bedrock commands (fill, setblock, summon, particle).
3. flatWorldPreset: A valid Bedrock Flat World layer preset string (e.g. "2;7,3x1,2;1;village").
4. presetSummary: Explanation of the preset layers.
5. recommendedSettings: simulationDistance, difficulty, daylightCycle, keepInventory, mobSpawning.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: `Create world builder pack for theme: "${theme}". ${description}`,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            theme: { type: Type.STRING },
            description: { type: Type.STRING },
            flatWorldPreset: { type: Type.STRING },
            presetSummary: { type: Type.STRING },
            functions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  fileName: { type: Type.STRING },
                  description: { type: Type.STRING },
                  commands: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                  },
                },
                required: ['fileName', 'description', 'commands'],
              },
            },
            recommendedSettings: {
              type: Type.OBJECT,
              properties: {
                simulationDistance: { type: Type.INTEGER },
                difficulty: { type: Type.STRING, enum: ['peaceful', 'easy', 'normal', 'hard'] },
                daylightCycle: { type: Type.BOOLEAN },
                keepInventory: { type: Type.BOOLEAN },
                mobSpawning: { type: Type.BOOLEAN },
              },
              required: ['simulationDistance', 'difficulty', 'daylightCycle', 'keepInventory', 'mobSpawning'],
            },
          },
          required: ['name', 'theme', 'description', 'flatWorldPreset', 'presetSummary', 'functions', 'recommendedSettings'],
        },
      },
    });

    const parsed = JSON.parse(response.text?.trim() || '{}');
    res.json(parsed);
  } catch (error: unknown) {
    const err = error as Error;
    console.error('Error generating world builder:', err.message);
    res.status(500).json({ error: 'Failed to generate world builder pack: ' + err.message });
  }
});

// Setup Vite middleware in dev or static files in production
async function startServer() {
  const isDev = process.env.NODE_ENV !== 'production';

  if (isDev) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`mc-generator server running at http://0.0.0.0:${PORT} [${isDev ? 'development' : 'production'}]`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});
