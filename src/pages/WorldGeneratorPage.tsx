import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import {
  Globe,
  Sparkles,
  Download,
  Copy,
  Check,
  Info,
  CheckCircle,
  AlertCircle,
  Wand2,
  Sliders,
  Terminal,
} from 'lucide-react';
import { AdSlot } from '../components/AdSlot';
import { createWorldBuilderMcPack } from '../packagers/worldPackager';
import { WorldBuilderData, SavedCreation } from '../types';
import { UserSettings } from '../config';

interface WorldGeneratorPageProps {
  userSettings: UserSettings;
  onSaveCreation: (creation: SavedCreation) => void;
}

const PRESET_ZONES = [
  { theme: 'Spawn Village Hub', desc: 'Central cobblestone plaza, market stalls, fountain, and starter houses' },
  { theme: 'Floating Sky Islands', desc: 'A cluster of suspended stone islands with water streams and ore clusters' },
  { theme: 'Gladiator PvP Arena', desc: 'Sand and stone brick circular combat arena with grandstand seating' },
  { theme: 'Parkour Challenge Course', desc: 'Tiered vertical obstacle course with slime blocks, iron bars, and fences' },
];

const INITIAL_WORLD_DATA: WorldBuilderData = {
  name: 'Spawn Village Hub',
  theme: 'medieval village',
  description: 'Spawns an expansive starter village hub with town square, market stands, and road network',
  flatWorldPreset: '2;7,3x1,5x3,2;1;village,decoration',
  presetSummary: 'Bedrock layer (1), Stone (3), Dirt (5), Grass (1) with naturally generated village structures',
  functions: [
    {
      fileName: 'build_plaza.mcfunction',
      description: 'Generates the central village town square and stone fountain',
      commands: [
        'fill ~-8 ~-1 ~-8 ~8 ~-1 ~8 stone_bricks',
        'fill ~-7 ~-1 ~-7 ~7 ~-1 ~7 cobblestone',
        'setblock ~0 ~0 ~0 stone_bricks',
        'setblock ~0 ~1 ~0 water',
        'setblock ~-2 ~0 ~-2 lantern',
        'setblock ~2 ~0 ~-2 lantern',
        'setblock ~-2 ~0 ~2 lantern',
        'setblock ~2 ~0 ~2 lantern',
        'title @a title §aVillage Plaza Generated!',
      ],
    },
    {
      fileName: 'build_houses.mcfunction',
      description: 'Constructs 4 starter wooden cottages around the plaza',
      commands: [
        'fill ~-12 ~0 ~-4 ~-8 ~3 ~0 oak_planks hollow',
        'fill ~-12 ~4 ~-4 ~-8 ~4 ~0 oak_stairs',
        'fill ~8 ~0 ~-4 ~12 ~3 ~0 oak_planks hollow',
        'fill ~-4 ~0 ~8 ~0 ~3 ~12 oak_planks hollow',
        'fill ~-4 ~0 ~-12 ~0 ~3 ~-8 oak_planks hollow',
      ],
    },
  ],
  recommendedSettings: {
    simulationDistance: 6,
    difficulty: 'normal',
    daylightCycle: true,
    keepInventory: true,
    mobSpawning: true,
  },
};

export const WorldGeneratorPage: React.FC<WorldGeneratorPageProps> = ({
  userSettings,
  onSaveCreation,
}) => {
  const [selectedTheme, setSelectedTheme] = useState('Spawn Village Hub');
  const [customDesc, setCustomDesc] = useState('');
  const [worldData, setWorldData] = useState<WorldBuilderData>(INITIAL_WORLD_DATA);

  const [copiedPreset, setCopiedPreset] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  // Ad & Download State
  const [showAdModal, setShowAdModal] = useState(false);
  const [pendingBlob, setPendingBlob] = useState<{ blob: Blob; fileName: string } | null>(null);

  const handleGenerate = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsGenerating(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/generate-world-builder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          theme: selectedTheme,
          description: customDesc,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to generate world pack');

      setWorldData(data);
      setSuccessNotice(`Generated World Builder Pack for "${data.name}"!`);
      setTimeout(() => setSuccessNotice(null), 4000);
    } catch (err: unknown) {
      setErrorMsg((err as Error).message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyPreset = () => {
    navigator.clipboard.writeText(worldData.flatWorldPreset);
    setCopiedPreset(true);
    setTimeout(() => setCopiedPreset(false), 2500);
  };

  const handleInitiateExport = async () => {
    try {
      const { blob, fileName } = await createWorldBuilderMcPack({
        worldData,
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
      confetti({ particleCount: 75, spread: 60, origin: { y: 0.7 } });
    } catch {
      // Ignore confetti error
    }

    if (userSettings.autoSaveHistory) {
      const creation: SavedCreation = {
        id: 'creation_' + Date.now(),
        type: 'world',
        title: worldData.name,
        description: `World Builder Pack • ${worldData.functions.length} generator functions • Bedrock .mcpack`,
        createdAt: Date.now(),
        fileName,
      };
      onSaveCreation(creation);
    }

    setShowAdModal(false);
    setPendingBlob(null);
    setSuccessNotice(`Downloaded ${fileName}! Tap to import into Minecraft Bedrock.`);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs text-emerald-400 font-semibold uppercase tracking-wider">
            <Globe className="w-4 h-4" />
            <span>Bedrock World Builder Studio</span>
          </div>
          <h1 className="font-pixel text-lg sm:text-2xl text-white mt-1">
            WORLD BUILDER PACK & PRESETS
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Build custom spawn villages, floating islands, and arenas relative to the player, paired with verified Flat World presets.
          </p>
        </div>

        <button
          onClick={handleInitiateExport}
          className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm shadow-lg shadow-emerald-500/25 transition active:scale-95 cursor-pointer shrink-0"
        >
          <Download className="w-4 h-4" />
          <span>Export World Pack (.mcpack)</span>
        </button>
      </div>

      {/* Honest Scope Clarification Callout */}
      <div className="p-4 rounded-2xl bg-[#0c1424] border border-emerald-500/30 text-xs text-slate-300 flex items-start gap-3">
        <Info className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <strong className="text-white">Honest Scope Notice:</strong> Direct <code>.mcworld</code> files contain a proprietary LevelDB database binary that cannot be constructed reliably inside a web browser without corrupting player chunks. Instead, <strong>mc-generator</strong> generates a genuine <strong>World Builder Pack (.mcpack)</strong> containing <code>/function</code> commands that instantly construct your themed zone in any world, alongside 1-click Flat World presets.
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
        {/* Left Column: Form & Themed Zones */}
        <div className="lg:col-span-5 space-y-6">
          <form onSubmit={handleGenerate} className="rounded-2xl bg-[#0e1627] border border-slate-800 p-5 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Wand2 className="w-4 h-4 text-emerald-400" />
              <span>Choose Themed Zone</span>
            </h3>

            {/* Zone Presets */}
            <div className="space-y-2">
              {PRESET_ZONES.map((zone) => (
                <div
                  key={zone.theme}
                  onClick={() => setSelectedTheme(zone.theme)}
                  className={`p-3 rounded-xl border cursor-pointer transition ${
                    selectedTheme === zone.theme
                      ? 'bg-emerald-500/15 border-emerald-500 text-white font-semibold'
                      : 'bg-[#121c2e] border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <div className="text-xs font-bold">{zone.theme}</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">{zone.desc}</div>
                </div>
              ))}
            </div>

            {/* Custom Notes */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                Custom Details / Additions
              </label>
              <textarea
                value={customDesc}
                onChange={(e) => setCustomDesc(e.target.value)}
                placeholder="e.g. Include diamond block loot chest in the center, nether portal on the edge..."
                rows={2}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#131d2e] border border-slate-700/80 text-white text-xs focus:outline-none focus:border-emerald-500 transition resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={isGenerating}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-xl shadow-emerald-500/25 transition active:scale-98 cursor-pointer disabled:opacity-50"
            >
              {isGenerating ? (
                <>
                  <span className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                  <span>Synthesizing World Builder Functions...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Generate World Functions & Presets</span>
                </>
              )}
            </button>
          </form>

          {/* Recommended World Settings */}
          <div className="rounded-2xl bg-[#0e1627] border border-slate-800 p-5 space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Sliders className="w-4 h-4 text-emerald-400" />
              <span>Recommended World Settings</span>
            </h4>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-2.5 rounded-xl bg-[#121c30]">
                <div className="text-slate-400 text-[10px]">Difficulty</div>
                <div className="font-bold text-white capitalize">{worldData.recommendedSettings.difficulty}</div>
              </div>
              <div className="p-2.5 rounded-xl bg-[#121c30]">
                <div className="text-slate-400 text-[10px]">Simulation Distance</div>
                <div className="font-bold text-white">{worldData.recommendedSettings.simulationDistance} Chunks</div>
              </div>
              <div className="p-2.5 rounded-xl bg-[#121c30]">
                <div className="text-slate-400 text-[10px]">Keep Inventory</div>
                <div className="font-bold text-emerald-400">
                  {worldData.recommendedSettings.keepInventory ? 'Enabled' : 'Disabled'}
                </div>
              </div>
              <div className="p-2.5 rounded-xl bg-[#121c30]">
                <div className="text-slate-400 text-[10px]">Daylight Cycle</div>
                <div className="font-bold text-emerald-400">
                  {worldData.recommendedSettings.daylightCycle ? 'Normal' : 'Locked'}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Flat World Preset & In-Game Functions */}
        <div className="lg:col-span-7 space-y-6">
          {/* Flat World Preset Box */}
          <div className="rounded-2xl bg-[#0e1627] border border-slate-800 p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Globe className="w-4 h-4 text-emerald-400" />
                <span>Flat World Preset String</span>
              </h3>

              <button
                onClick={handleCopyPreset}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition"
              >
                {copiedPreset ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Preset</span>
                  </>
                )}
              </button>
            </div>

            <div className="p-3 rounded-xl bg-[#090e18] border border-slate-800/80 font-mono text-xs text-emerald-400 break-all select-all">
              {worldData.flatWorldPreset}
            </div>

            <p className="text-[11px] text-slate-400 leading-relaxed">
              <strong>Layers:</strong> {worldData.presetSummary}
            </p>
          </div>

          {/* Builder Functions in Pack */}
          <div className="rounded-2xl bg-[#0e1627] border border-slate-800 p-5 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Terminal className="w-4 h-4 text-emerald-400" />
              <span>Pack Functions ({worldData.functions.length})</span>
            </h3>

            <div className="space-y-4">
              {worldData.functions.map((fn, idx) => (
                <div key={idx} className="rounded-xl bg-[#121c30] border border-slate-700/60 p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white text-xs">{fn.description}</span>
                    <code className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                      /function {fn.fileName.replace('.mcfunction', '')}
                    </code>
                  </div>

                  <div className="p-2.5 rounded-lg bg-[#080d18] font-mono text-[11px] text-slate-300 max-h-28 overflow-auto space-y-0.5">
                    {fn.commands.map((cmd, i) => (
                      <div key={i}>{cmd}</div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Ad Modal */}
      {showAdModal && pendingBlob && (
        <AdSlot
          fileName={pendingBlob.fileName}
          fileSizeStr="~14 KB"
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
