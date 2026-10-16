import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import {
  Box,
  Sparkles,
  Download,
  Layers,
  Wand2,
  FileCode,
  HelpCircle,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';
import { ThreeVoxelViewer } from '../components/ThreeVoxelViewer';
import { AdSlot } from '../components/AdSlot';
import { exportStructureNbt, exportStructureFunctionPack } from '../packagers/structurePackager';
import { StructureData, SavedCreation } from '../types';
import { UserSettings } from '../config';

interface StructureGeneratorPageProps {
  userSettings: UserSettings;
  onSaveCreation: (creation: SavedCreation) => void;
}

const EXAMPLE_BUILDS = [
  'Small medieval stone watchtower with battlements and lantern',
  'Modern micro-cabin with oak deck and glass panorama windows',
  'Nether brick shrine with crying obsidian altar and soul fire',
  'Japanese garden pagoda with cherry blossom wood and stone lanterns',
];

const INITIAL_STRUCTURE: StructureData = {
  name: 'Medieval Watchtower',
  theme: 'medieval stone',
  description: 'Compact 7x11x7 fortified watchtower with roof battlements',
  size: [7, 11, 7],
  palette: [
    { blockId: 'minecraft:stone_bricks', label: 'Stone Bricks', color: '#64748b' },
    { blockId: 'minecraft:mossy_stone_bricks', label: 'Mossy Stone Bricks', color: '#475569' },
    { blockId: 'minecraft:spruce_planks', label: 'Spruce Planks', color: '#78350f' },
    { blockId: 'minecraft:iron_bars', label: 'Iron Bars', color: '#94a3b8' },
    { blockId: 'minecraft:lantern', label: 'Lantern', color: '#fbbf24' },
  ],
  blocks: [
    // Foundation (y=0)
    ...Array.from({ length: 7 }, (_, x) =>
      Array.from({ length: 7 }, (_, z) => ({
        x,
        y: 0,
        z,
        blockId: 'minecraft:stone_bricks',
        color: '#64748b',
      }))
    ).flat(),
    // Floor 1 walls (y=1..4)
    ...[1, 2, 3, 4].flatMap((y) =>
      Array.from({ length: 7 }, (_, x) =>
        Array.from({ length: 7 }, (_, z) => {
          const isWall = x === 0 || x === 6 || z === 0 || z === 6;
          const isDoor = z === 0 && x === 3 && y <= 2;
          if (isWall && !isDoor) {
            return {
              x,
              y,
              z,
              blockId: (x + y) % 3 === 0 ? 'minecraft:mossy_stone_bricks' : 'minecraft:stone_bricks',
              color: (x + y) % 3 === 0 ? '#475569' : '#64748b',
            };
          }
          return null;
        })
      ).flat().filter(Boolean) as StructureData['blocks']
    ),
    // Intermediate floor (y=5)
    ...Array.from({ length: 5 }, (_, xi) =>
      Array.from({ length: 5 }, (_, zi) => ({
        x: xi + 1,
        y: 5,
        z: zi + 1,
        blockId: 'minecraft:spruce_planks',
        color: '#78350f',
      }))
    ).flat(),
    // Upper walls & arrow slits (y=6..8)
    ...[6, 7, 8].flatMap((y) =>
      Array.from({ length: 7 }, (_, x) =>
        Array.from({ length: 7 }, (_, z) => {
          const isWall = x === 0 || x === 6 || z === 0 || z === 6;
          const isSlit = y === 7 && (x === 3 || z === 3);
          if (isWall && !isSlit) {
            return {
              x,
              y,
              z,
              blockId: 'minecraft:stone_bricks',
              color: '#64748b',
            };
          }
          if (isSlit) {
            return {
              x,
              y,
              z,
              blockId: 'minecraft:iron_bars',
              color: '#94a3b8',
            };
          }
          return null;
        })
      ).flat().filter(Boolean) as StructureData['blocks']
    ),
    // Roof Battlements (y=9..10)
    ...Array.from({ length: 7 }, (_, x) =>
      Array.from({ length: 7 }, (_, z) => {
        const isWall = x === 0 || x === 6 || z === 0 || z === 6;
        const isMerlon = isWall && (x % 2 === 0 || z % 2 === 0);
        if (isMerlon) {
          return {
            x,
            y: 9,
            z,
            blockId: 'minecraft:stone_bricks',
            color: '#64748b',
          };
        }
        return null;
      })
    ).flat().filter(Boolean) as StructureData['blocks'],
    // Lantern in center
    { x: 3, y: 9, z: 3, blockId: 'minecraft:lantern', color: '#fbbf24' },
  ],
  commands: [
    'fill ~0 ~0 ~0 ~6 ~0 ~6 stone_bricks',
    'fill ~0 ~1 ~0 ~6 ~4 ~6 stone_bricks hollow',
    'setblock ~3 ~1 ~0 air',
    'setblock ~3 ~2 ~0 air',
    'fill ~1 ~5 ~1 ~5 ~5 ~5 spruce_planks',
    'fill ~0 ~6 ~0 ~6 ~8 ~6 stone_bricks hollow',
    'setblock ~3 ~7 ~0 iron_bars',
    'setblock ~3 ~7 ~6 iron_bars',
    'setblock ~0 ~7 ~3 iron_bars',
    'setblock ~6 ~7 ~3 iron_bars',
    'setblock ~3 ~9 ~3 lantern',
  ],
};

export const StructureGeneratorPage: React.FC<StructureGeneratorPageProps> = ({
  userSettings,
  onSaveCreation,
}) => {
  const [prompt, setPrompt] = useState('Small medieval stone watchtower with battlements');
  const [size, setSize] = useState<'small' | 'medium' | 'large'>('small');
  const [structure, setStructure] = useState<StructureData>(INITIAL_STRUCTURE);

  const [isGenerating, setIsGenerating] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  // Ad & Download State
  const [showAdModal, setShowAdModal] = useState(false);
  const [pendingBlob, setPendingBlob] = useState<{ blob: Blob; fileName: string } | null>(null);

  const handleGenerate = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!prompt.trim()) return;
    setIsGenerating(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/generate-structure', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: prompt.trim(), size }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to generate structure');

      setStructure(data);
      setSuccessNotice(`Generated 3D build "${data.name}" (${data.blocks.length} blocks)!`);
      setTimeout(() => setSuccessNotice(null), 4000);
    } catch (err: unknown) {
      setErrorMsg((err as Error).message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleExportNbt = () => {
    try {
      const { blob, fileName } = exportStructureNbt(structure);
      setPendingBlob({ blob, fileName });
      setShowAdModal(true);
    } catch (err: unknown) {
      setErrorMsg((err as Error).message);
    }
  };

  const handleExportFunctionPack = async () => {
    try {
      const { blob, fileName } = await exportStructureFunctionPack(
        structure,
        userSettings.includeCreatorCredit
      );
      setPendingBlob({ blob, fileName });
      setShowAdModal(true);
    } catch (err: unknown) {
      setErrorMsg((err as Error).message);
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
      confetti({ particleCount: 75, spread: 60, origin: { y: 0.7 } });
    } catch {
      // Ignore confetti error
    }

    if (userSettings.autoSaveHistory) {
      const creation: SavedCreation = {
        id: 'creation_' + Date.now(),
        type: 'structure',
        title: structure.name,
        description: `${structure.blocks.length} blocks • ${structure.size.join('×')} • ${fileName}`,
        createdAt: Date.now(),
        fileName,
      };
      onSaveCreation(creation);
    }

    setShowAdModal(false);
    setPendingBlob(null);
    setSuccessNotice(`Downloaded ${fileName}!`);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs text-emerald-400 font-semibold uppercase tracking-wider">
            <Box className="w-4 h-4" />
            <span>Voxel Architecture Studio</span>
          </div>
          <h1 className="font-pixel text-lg sm:text-2xl text-white mt-1">
            STRUCTURE & BUILD GENERATOR
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Describe any building. View it in 3D with cutaway slicing and export pure <code className="text-emerald-400 font-mono">.mcstructure</code> NBT or <code className="text-emerald-400 font-mono">.mcfunction</code> packs.
          </p>
        </div>

        {/* Dual Export Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportNbt}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/25 transition active:scale-95 cursor-pointer shrink-0"
            title="Export for Structure Block"
          >
            <Download className="w-4 h-4" />
            <span>.mcstructure (NBT)</span>
          </button>

          <button
            onClick={handleExportFunctionPack}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold text-xs transition active:scale-95 cursor-pointer shrink-0"
            title="Export as /function build command pack"
          >
            <FileCode className="w-4 h-4 text-emerald-400" />
            <span>.mcfunction Pack</span>
          </button>
        </div>
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
        {/* Left Column: Prompt & Build Specs */}
        <div className="lg:col-span-5 space-y-6">
          <form onSubmit={handleGenerate} className="rounded-2xl bg-[#0e1627] border border-slate-800 p-5 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Wand2 className="w-4 h-4 text-emerald-400" />
              Build Description
            </h3>

            <div>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Describe your structure (e.g. Small medieval watchtower with battlements and lantern)..."
                rows={3}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#131d2e] border border-slate-700/80 text-white text-xs focus:outline-none focus:border-emerald-500 transition resize-none leading-relaxed"
              />
            </div>

            {/* Size options */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1.5">
                Target Dimensions
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'small', label: 'Compact (~7×7)' },
                  { id: 'medium', label: 'Medium (~11×11)' },
                  { id: 'large', label: 'Large (~15×15)' },
                ].map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setSize(s.id as 'small' | 'medium' | 'large')}
                    className={`py-2 px-2 rounded-xl text-xs font-semibold border transition text-center ${
                      size === s.id
                        ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400 font-bold'
                        : 'bg-[#121c2e] border-slate-700 text-slate-400 hover:text-white'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Example Ideas */}
            <div>
              <div className="text-[11px] font-semibold text-slate-400 mb-1.5">
                Example Builds:
              </div>
              <div className="flex flex-wrap gap-1.5">
                {EXAMPLE_BUILDS.map((b, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setPrompt(b)}
                    className="px-2.5 py-1 rounded-lg bg-[#121c2e] hover:bg-[#18253b] border border-slate-700/60 text-slate-300 text-[11px] transition text-left cursor-pointer"
                  >
                    {b.length > 36 ? b.slice(0, 36) + '...' : b}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={isGenerating || !prompt.trim()}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-xl shadow-emerald-500/25 transition active:scale-98 cursor-pointer disabled:opacity-50"
            >
              {isGenerating ? (
                <>
                  <span className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                  <span>Computing 3D Voxel Coordinates...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Generate Structure</span>
                </>
              )}
            </button>
          </form>

          {/* Block Palette Breakdown */}
          <div className="rounded-2xl bg-[#0e1627] border border-slate-800 p-5 space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <span>Block Palette ({structure.palette.length} Types)</span>
            </h4>
            <div className="space-y-1.5">
              {structure.palette.map((p, idx) => (
                <div key={idx} className="flex items-center justify-between text-xs py-1 border-b border-slate-800/60">
                  <div className="flex items-center gap-2">
                    <span className="w-3.5 h-3.5 rounded border border-black/30" style={{ backgroundColor: p.color }} />
                    <span className="text-slate-200 font-medium">{p.label}</span>
                  </div>
                  <code className="text-[10px] text-slate-400 font-mono">{p.blockId}</code>
                </div>
              ))}
            </div>
          </div>

          {/* How to import guide */}
          <div className="rounded-2xl bg-[#0e1627] border border-slate-800 p-5 space-y-2 text-xs text-slate-300">
            <div className="flex items-center gap-2 font-bold text-emerald-400">
              <HelpCircle className="w-4 h-4" />
              <span>How to Load in Minecraft:</span>
            </div>
            <p className="leading-relaxed text-slate-400">
              <strong>Option A (.mcstructure):</strong> Place the file in your world's <code className="text-slate-300">structures/</code> folder. In game, give yourself a Structure Block (<code className="text-emerald-400">/give @s structure_block</code>), switch to <em>LOAD</em> mode, and type the structure name.
            </p>
            <p className="leading-relaxed text-slate-400">
              <strong>Option B (.mcpack):</strong> Activate the behavior pack in world settings, stand where you want to build, and type <code className="text-emerald-400">/function build</code> in chat.
            </p>
          </div>
        </div>

        {/* Right Column: 3D Voxel Viewer & In-game commands */}
        <div className="lg:col-span-7 space-y-4">
          <div className="rounded-2xl bg-[#0e1627] border border-slate-800 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white">{structure.name}</h3>
                <div className="text-[11px] text-slate-400">
                  Dimensions: {structure.size[0]}×{structure.size[1]}×{structure.size[2]} • {structure.blocks.length} Blocks
                </div>
              </div>
            </div>

            {/* 3D Three.js Voxel Canvas with Slicer */}
            <ThreeVoxelViewer structure={structure} />
          </div>

          {/* Commands Preview */}
          <div className="rounded-2xl bg-[#0e1627] border border-slate-800 p-4 space-y-2">
            <div className="text-xs font-bold text-white flex items-center justify-between">
              <span>Quick /setblock Commands:</span>
              <span className="text-[10px] text-slate-400">{structure.commands.length} Commands</span>
            </div>
            <div className="bg-[#090e18] p-3 rounded-xl border border-slate-800/80 font-mono text-[11px] text-emerald-400 max-h-36 overflow-auto">
              {structure.commands.map((cmd, i) => (
                <div key={i}>{cmd}</div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Ad Modal */}
      {showAdModal && pendingBlob && (
        <AdSlot
          fileName={pendingBlob.fileName}
          fileSizeStr="~15 KB"
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
