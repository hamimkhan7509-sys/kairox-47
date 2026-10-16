import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import {
  Palette,
  Sparkles,
  Download,
  Edit3,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Layers,
  Wand2,
} from 'lucide-react';
import { PixelEditorModal } from '../components/PixelEditorModal';
import { AdSlot } from '../components/AdSlot';
import { renderTileToCanvas } from '../utils/textureRenderer';
import { createTextureMcPack } from '../packagers/texturePackager';
import { TextureTile, TextureResolution, SavedCreation } from '../types';
import { UserSettings } from '../config';

interface TextureGeneratorPageProps {
  userSettings: UserSettings;
  onSaveCreation: (creation: SavedCreation) => void;
}

const PRESET_THEMES = [
  'Medieval Fantasy',
  'Pastel Cozy',
  'Dark Horror & Nether',
  'Cyberpunk Neon',
  'Steampunk Brass',
];

const DEFAULT_TILES: TextureTile[] = [
  {
    id: 'tile_1',
    name: 'Ancient Stone',
    targetId: 'stone',
    type: 'block',
    category: 'stone_earth',
    palette: ['#1e293b', '#334155', '#64748b', '#94a3b8'],
    patternStyle: 'natural',
  },
  {
    id: 'tile_2',
    name: 'Overgrown Grass',
    targetId: 'grass_top',
    type: 'block',
    category: 'wood_plants',
    palette: ['#064e3b', '#047857', '#10b981', '#34d399'],
    patternStyle: 'natural',
  },
  {
    id: 'tile_3',
    name: 'Emerald Ore',
    targetId: 'emerald_ore',
    type: 'block',
    category: 'ores_minerals',
    palette: ['#1e293b', '#334155', '#059669', '#34d399', '#a7f3d0'],
    patternStyle: 'crystalline',
  },
  {
    id: 'tile_4',
    name: 'Cobblestone',
    targetId: 'cobblestone',
    type: 'block',
    category: 'stone_earth',
    palette: ['#0f172a', '#1e293b', '#475569', '#94a3b8'],
    patternStyle: 'geometric',
  },
  {
    id: 'tile_5',
    name: 'Oak Planks',
    targetId: 'planks_oak',
    type: 'block',
    category: 'wood_plants',
    palette: ['#451a03', '#78350f', '#b45309', '#d97706'],
    patternStyle: 'geometric',
  },
  {
    id: 'tile_6',
    name: 'Runed Sword',
    targetId: 'sword_diamond',
    type: 'item',
    category: 'weapons_tools',
    palette: ['#0f172a', '#0369a1', '#0ea5e9', '#7dd3fc', '#ffffff'],
    patternStyle: 'metallic',
  },
  {
    id: 'tile_7',
    name: 'Mining Pickaxe',
    targetId: 'pickaxe_iron',
    type: 'item',
    category: 'weapons_tools',
    palette: ['#1c1917', '#44403c', '#78716c', '#e7e5e4'],
    patternStyle: 'metallic',
  },
  {
    id: 'tile_8',
    name: 'Enchanted Crystal',
    targetId: 'diamond',
    type: 'item',
    category: 'ores_minerals',
    palette: ['#082f49', '#0284c7', '#38bdf8', '#bae6fd'],
    patternStyle: 'crystalline',
  },
];

export const TextureGeneratorPage: React.FC<TextureGeneratorPageProps> = ({
  userSettings,
  onSaveCreation,
}) => {
  const [packName, setPackName] = useState('My Themed Pack');
  const [packDescription, setPackDescription] = useState('Custom Bedrock Resource Pack');
  const [theme, setTheme] = useState('Medieval Fantasy');
  const [resolution, setResolution] = useState<TextureResolution>(16);
  const [customPrompt, setCustomPrompt] = useState('');
  const [tiles, setTiles] = useState<TextureTile[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  // Pixel Editor State
  const [editingTileIndex, setEditingTileIndex] = useState<number | null>(null);

  // Ad & Download State
  const [showAdModal, setShowAdModal] = useState(false);
  const [pendingBlob, setPendingBlob] = useState<{ blob: Blob; fileName: string } | null>(null);

  // Render initial tiles on mount
  useEffect(() => {
    const rendered = DEFAULT_TILES.map((t) => {
      const c = renderTileToCanvas(t, resolution);
      return { ...t, canvasDataUrl: c.toDataURL('image/png') };
    });
    setTiles(rendered);
  }, [resolution]);

  const handleGenerate = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsGenerating(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/generate-texture-pack', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          theme,
          resolution,
          customPrompt,
          selectedCategories: ['stone_earth', 'wood_plants', 'ores_minerals', 'weapons_tools'],
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to generate texture pack');

      if (data.packName) setPackName(data.packName);
      if (data.packDescription) setPackDescription(data.packDescription);

      const generatedTiles: TextureTile[] = (data.tiles || []).map((t: TextureTile, idx: number) => {
        const tileObj: TextureTile = {
          ...t,
          id: `gen_tile_${idx}_${Date.now()}`,
        };
        const c = renderTileToCanvas(tileObj, resolution);
        tileObj.canvasDataUrl = c.toDataURL('image/png');
        return tileObj;
      });

      setTiles(generatedTiles.length > 0 ? generatedTiles : tiles);
      setSuccessNotice(`Generated ${generatedTiles.length} original textures for "${theme}"!`);
      setTimeout(() => setSuccessNotice(null), 4000);
    } catch (err: unknown) {
      setErrorMsg((err as Error).message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSavePixelEdit = (newCanvas: HTMLCanvasElement) => {
    if (editingTileIndex === null) return;
    const updated = [...tiles];
    updated[editingTileIndex] = {
      ...updated[editingTileIndex],
      canvasDataUrl: newCanvas.toDataURL('image/png'),
    };
    setTiles(updated);
    setEditingTileIndex(null);
    setSuccessNotice('Tile edits applied!');
    setTimeout(() => setSuccessNotice(null), 3000);
  };

  const handleRerollTile = (index: number) => {
    const target = tiles[index];
    if (!target) return;
    // Rotate palette or shift seed
    const newPalette = [...target.palette.slice(1), target.palette[0]];
    const updatedTile: TextureTile = {
      ...target,
      palette: newPalette,
    };
    const c = renderTileToCanvas(updatedTile, resolution);
    updatedTile.canvasDataUrl = c.toDataURL('image/png');

    const updated = [...tiles];
    updated[index] = updatedTile;
    setTiles(updated);
  };

  const handleInitiateExport = async () => {
    if (tiles.length === 0) return;

    try {
      const { blob, fileName } = await createTextureMcPack({
        packName,
        packDescription,
        tiles,
        includeCreatorCredit: userSettings.includeCreatorCredit,
      });

      setPendingBlob({ blob, fileName });
      setShowAdModal(true);
    } catch (err: unknown) {
      setErrorMsg('Export error: ' + (err as Error).message);
    }
  };

  const handleConfirmDownload = () => {
    if (!pendingBlob) return;
    const { blob, fileName } = pendingBlob;
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);

    try {
      confetti({ particleCount: 70, spread: 60, origin: { y: 0.7 } });
    } catch {
      // Ignore confetti error
    }

    if (userSettings.autoSaveHistory) {
      const creation: SavedCreation = {
        id: 'creation_' + Date.now(),
        type: 'texture_pack',
        title: packName,
        description: `${tiles.length} original textures (${resolution}x) • Bedrock .mcpack`,
        createdAt: Date.now(),
        fileName,
        previewUrl: tiles[0]?.canvasDataUrl,
      };
      onSaveCreation(creation);
    }

    setShowAdModal(false);
    setPendingBlob(null);
    setSuccessNotice(`Downloaded ${fileName}! Tap to open in Minecraft Bedrock.`);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs text-emerald-400 font-semibold uppercase tracking-wider">
            <Palette className="w-4 h-4" />
            <span>Bedrock Resource Studio</span>
          </div>
          <h1 className="font-pixel text-lg sm:text-2xl text-white mt-1">
            TEXTURE PACK GENERATOR
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Generate original 16x/32x/64x pixel art blocks & items with terrain_texture.json mappings and instant .mcpack export.
          </p>
        </div>

        <button
          onClick={handleInitiateExport}
          className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm shadow-lg shadow-emerald-500/25 transition active:scale-95 cursor-pointer shrink-0"
        >
          <Download className="w-4 h-4" />
          <span>Export .mcpack ({tiles.length} Tiles)</span>
        </button>
      </div>

      {successNotice && (
        <div className="p-3.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2.5 animate-in fade-in">
          <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{successNotice}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-3.5 rounded-xl bg-red-500/15 border border-red-500/30 text-red-300 text-xs flex items-center gap-2.5 animate-in fade-in">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
          <span>{errorMsg}</span>
          <button onClick={() => setErrorMsg(null)} className="ml-auto font-bold">×</button>
        </div>
      )}

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Generator Controls */}
        <div className="lg:col-span-5 space-y-6">
          <form onSubmit={handleGenerate} className="rounded-2xl bg-[#0e1627] border border-slate-800 p-5 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Wand2 className="w-4 h-4 text-emerald-400" />
              Theme & Specifications
            </h3>

            {/* Resolution Selector */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1.5">
                Resolution
              </label>
              <div className="grid grid-cols-3 gap-2">
                {([16, 32, 64] as TextureResolution[]).map((res) => (
                  <button
                    key={res}
                    type="button"
                    onClick={() => setResolution(res)}
                    className={`py-2 rounded-xl text-xs font-bold border transition ${
                      resolution === res
                        ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400 shadow-sm'
                        : 'bg-[#121c2e] border-slate-700/80 text-slate-400 hover:text-white'
                    }`}
                  >
                    {res}×{res}
                  </button>
                ))}
              </div>
            </div>

            {/* Preset Themes */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1.5">
                Theme Preset
              </label>
              <div className="flex flex-wrap gap-1.5">
                {PRESET_THEMES.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTheme(t)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                      theme === t
                        ? 'bg-emerald-500 text-slate-950 font-bold'
                        : 'bg-[#121c2e] text-slate-300 hover:bg-[#18253b] border border-slate-700/60'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Prompt Notes */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                Custom Visual Notes (Optional)
              </label>
              <textarea
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                placeholder="e.g. Glowing runic carvings on stone, golden trim on weapons..."
                rows={2}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#131d2e] border border-slate-700/80 text-white text-xs focus:outline-none focus:border-emerald-500 transition resize-none"
              />
            </div>

            {/* Pack Title & Description */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-800">
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                  Pack Title
                </label>
                <input
                  type="text"
                  value={packName}
                  onChange={(e) => setPackName(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg bg-[#131d2e] border border-slate-700 text-xs text-white"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                  Description
                </label>
                <input
                  type="text"
                  value={packDescription}
                  onChange={(e) => setPackDescription(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg bg-[#131d2e] border border-slate-700 text-xs text-white"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isGenerating}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-xl shadow-emerald-500/25 transition active:scale-98 cursor-pointer disabled:opacity-50"
            >
              {isGenerating ? (
                <>
                  <span className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                  <span>Generating Original Textures...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Generate Resource Pack Tiles</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Right Column: Tile Grid & Single Tile Editor */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-emerald-400" />
              <span>Pack Textures ({tiles.length})</span>
            </h3>
            <span className="text-[11px] text-slate-400 font-mono">
              Click any tile to edit pixels
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
            {tiles.map((tile, idx) => (
              <div
                key={tile.id}
                className="group relative rounded-xl bg-[#0e1627] border border-slate-800 p-3 flex flex-col items-center justify-between hover:border-emerald-500/50 transition shadow-lg"
              >
                {/* Tile Canvas Image */}
                <div className="relative my-2">
                  {tile.canvasDataUrl && (
                    <img
                      src={tile.canvasDataUrl}
                      alt={tile.name}
                      className="w-20 h-20 rounded-lg bg-[#090e18] shadow-md border border-slate-700 cursor-pointer group-hover:scale-105 transition-transform"
                      style={{ imageRendering: 'pixelated' }}
                      onClick={() => setEditingTileIndex(idx)}
                      title="Click to edit pixels"
                    />
                  )}
                  <div
                    onClick={() => setEditingTileIndex(idx)}
                    className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 rounded-lg flex items-center justify-center text-white text-[10px] font-semibold cursor-pointer transition"
                  >
                    <Edit3 className="w-4 h-4 mr-1 text-emerald-400" />
                    Edit
                  </div>
                </div>

                <div className="w-full text-center">
                  <div className="text-xs font-bold text-white truncate">{tile.name}</div>
                  <div className="text-[10px] font-mono text-emerald-400 truncate mt-0.5">
                    {tile.targetId}
                  </div>
                </div>

                {/* Individual tile controls */}
                <div className="w-full mt-2 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                  <span className="capitalize">{tile.type}</span>
                  <button
                    onClick={() => handleRerollTile(idx)}
                    className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-emerald-400 transition"
                    title="Reroll tile shading"
                  >
                    <RefreshCw className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Pixel Editor for selected tile */}
      {editingTileIndex !== null && tiles[editingTileIndex] && (
        <PixelEditorModal
          initialCanvas={
            renderTileToCanvas(tiles[editingTileIndex], resolution)
          }
          skinName={tiles[editingTileIndex].name}
          paletteColors={tiles[editingTileIndex].palette}
          onSave={handleSavePixelEdit}
          onClose={() => setEditingTileIndex(null)}
        />
      )}

      {/* Ad Download Modal */}
      {showAdModal && pendingBlob && (
        <AdSlot
          fileName={pendingBlob.fileName}
          fileSizeStr="~18 KB"
          onConfirmDownload={handleConfirmDownload}
          onCancel={() => {
            setShowAdModal(false);
            setPendingBlob(null);
          }}
        />
      )}
    </div>
  );
};
