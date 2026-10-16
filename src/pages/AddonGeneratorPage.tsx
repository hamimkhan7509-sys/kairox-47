import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import {
  Layers,
  Sparkles,
  Download,
  Code,
  ShieldCheck,
  CheckCircle,
  AlertTriangle,
  Plus,
  Trash2,
  Terminal,
  FileJson,
  Wand2,
} from 'lucide-react';
import { AdSlot } from '../components/AdSlot';
import { validateAndFixAddon } from '../validators/addonValidator';
import { createAddonMcAddon } from '../packagers/addonPackager';
import { AddonPackData, SavedCreation } from '../types';
import { UserSettings } from '../config';

interface AddonGeneratorPageProps {
  userSettings: UserSettings;
  onSaveCreation: (creation: SavedCreation) => void;
}

const EXAMPLE_IDEAS = [
  'A ruby broadsword with 12 damage that glows when held',
  'A custom neon dragon boss with 150 HP that drops emeralds',
  'A luminous glowing amethyst ore block with light level 14',
  'A recipe for an enchanted golden apple using honey bottles',
];

const INITIAL_ADDON_DATA: AddonPackData = {
  packName: 'Ruby Battle Add-on',
  packDescription: 'Adds ruby weapons, armor and custom entities',
  namespace: 'ruby',
  items: [
    {
      identifier: 'ruby:ruby_sword',
      name: 'Ruby Greatsword',
      category: 'Equipment',
      maxStack: 1,
      damage: 12,
      handEquipped: true,
      foil: true,
    },
    {
      identifier: 'ruby:ruby_gem',
      name: 'Raw Ruby Gem',
      category: 'Items',
      maxStack: 64,
    },
  ],
  blocks: [
    {
      identifier: 'ruby:deepslate_ruby_ore',
      name: 'Deepslate Ruby Ore',
      lightEmission: 8,
      hardness: 3.5,
      explosionResistance: 6.0,
    },
  ],
  entities: [
    {
      identifier: 'ruby:ruby_golem',
      name: 'Ruby Guardian Golem',
      health: 80,
      movementSpeed: 0.22,
      attackDamage: 10,
      isHostile: false,
      lootDrops: ['ruby:ruby_gem', 'minecraft:iron_ingot'],
    },
  ],
  recipes: [
    {
      identifier: 'ruby:recipe_ruby_sword',
      type: 'shapeless',
      result: 'ruby:ruby_sword',
      count: 1,
      ingredients: ['ruby:ruby_gem', 'minecraft:stick'],
    },
  ],
  scriptMode: false,
  scriptCode: `import { world } from '@minecraft/server';\n\nworld.afterEvents.entityHurt.subscribe((event) => {\n  if (event.damageSource.damagingEntity?.typeId === 'minecraft:player') {\n    console.warn('Player dealt damage with custom weapon!');\n  }\n});\n`,
  warnings: [],
};

export const AddonGeneratorPage: React.FC<AddonGeneratorPageProps> = ({
  userSettings,
  onSaveCreation,
}) => {
  const [prompt, setPrompt] = useState('A ruby broadsword with 12 damage and a glowing ruby ore block');
  const [scriptMode, setScriptMode] = useState(false);
  const [addonData, setAddonData] = useState<AddonPackData>(INITIAL_ADDON_DATA);

  const [activeTab, setActiveTab] = useState<'items' | 'blocks' | 'entities' | 'recipes' | 'script' | 'json'>('items');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isImprovingPrompt, setIsImprovingPrompt] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  // Ad & Download State
  const [showAdModal, setShowAdModal] = useState(false);
  const [pendingBlob, setPendingBlob] = useState<{ blob: Blob; fileName: string } | null>(null);

  // Validation report
  const validation = validateAndFixAddon(addonData);

  const handleImprovePrompt = async () => {
    if (!prompt.trim()) return;
    setIsImprovingPrompt(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/improve-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: prompt.trim(), generatorType: 'addon' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      if (data.improvedPrompt) {
        setPrompt(data.improvedPrompt);
        setSuccessNotice('Prompt expanded with Bedrock component specifications!');
        setTimeout(() => setSuccessNotice(null), 3000);
      }
    } catch (err: unknown) {
      setErrorMsg((err as Error).message);
    } finally {
      setIsImprovingPrompt(false);
    }
  };

  const handleGenerate = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!prompt.trim()) return;
    setIsGenerating(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/generate-addon', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: prompt.trim(), scriptMode }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to generate add-on');

      const fixed = validateAndFixAddon({
        ...data,
        scriptMode,
        warnings: [],
      }).fixedData;

      setAddonData(fixed);
      setSuccessNotice(`Generated "${fixed.packName}" with BP + RP components!`);
      setTimeout(() => setSuccessNotice(null), 4000);
    } catch (err: unknown) {
      setErrorMsg((err as Error).message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleInitiateExport = async () => {
    const report = validateAndFixAddon(addonData);
    if (!report.isValid) {
      setErrorMsg(report.errors.join(' '));
      return;
    }

    try {
      const { blob, fileName } = await createAddonMcAddon({
        addonData: report.fixedData,
        includeCreatorCredit: userSettings.includeCreatorCredit,
      });

      setPendingBlob({ blob, fileName });
      setShowAdModal(true);
    } catch (err: unknown) {
      setErrorMsg('Export failed: ' + (err as Error).message);
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
      confetti({ particleCount: 80, spread: 60, origin: { y: 0.7 } });
    } catch {
      // Ignore confetti error
    }

    if (userSettings.autoSaveHistory) {
      const creation: SavedCreation = {
        id: 'creation_' + Date.now(),
        type: 'addon',
        title: addonData.packName,
        description: `Behavior + Resource Pack (${addonData.items.length} items, ${addonData.blocks.length} blocks, ${addonData.entities.length} entities)`,
        createdAt: Date.now(),
        fileName,
      };
      onSaveCreation(creation);
    }

    setShowAdModal(false);
    setPendingBlob(null);
    setSuccessNotice(`Downloaded ${fileName}! Tap to import both BP & RP into Minecraft.`);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-8">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs text-emerald-400 font-semibold uppercase tracking-wider">
            <Layers className="w-4 h-4" />
            <span>Behavior & Resource Pack Engine</span>
          </div>
          <h1 className="font-pixel text-lg sm:text-2xl text-white mt-1">
            ADD-ON GENERATOR (BP & RP)
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Turn plain ideas into working Bedrock entities, weapons, blocks, recipes, and optional scripts. Packages real <code className="text-emerald-400 font-mono">.mcaddon</code> files.
          </p>
        </div>

        <button
          onClick={handleInitiateExport}
          className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm shadow-lg shadow-emerald-500/25 transition active:scale-95 cursor-pointer shrink-0"
        >
          <Download className="w-4 h-4" />
          <span>Export .mcaddon</span>
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
          <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
          <span>{errorMsg}</span>
          <button onClick={() => setErrorMsg(null)} className="ml-auto font-bold">×</button>
        </div>
      )}

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Prompt & Pack Config */}
        <div className="lg:col-span-5 space-y-6">
          <form onSubmit={handleGenerate} className="rounded-2xl bg-[#0e1627] border border-slate-800 p-5 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Wand2 className="w-4 h-4 text-emerald-400" />
              Add-on Prompt
            </h3>

            <div>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Describe your add-on (e.g. A custom dragon mob with 100 HP that drops diamonds, and a ruby sword with 10 damage)..."
                rows={3}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#131d2e] border border-slate-700/80 text-white text-xs focus:outline-none focus:border-emerald-500 transition resize-none leading-relaxed"
              />

              <div className="flex items-center justify-between mt-2">
                <button
                  type="button"
                  onClick={handleImprovePrompt}
                  disabled={isImprovingPrompt || !prompt.trim()}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-semibold transition cursor-pointer disabled:opacity-40"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{isImprovingPrompt ? 'Improving...' : 'Improve prompt (AI)'}</span>
                </button>

                {/* Script Mode Toggle */}
                <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300">
                  <input
                    type="checkbox"
                    checked={scriptMode}
                    onChange={(e) => setScriptMode(e.target.checked)}
                    className="accent-emerald-500"
                  />
                  <span>Script Mode (JS)</span>
                </label>
              </div>
            </div>

            {/* Example Ideas */}
            <div>
              <div className="text-[11px] font-semibold text-slate-400 mb-1.5">
                Quick Idea Starters:
              </div>
              <div className="flex flex-wrap gap-1.5">
                {EXAMPLE_IDEAS.map((idea, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setPrompt(idea)}
                    className="px-2.5 py-1 rounded-lg bg-[#121c2e] hover:bg-[#18253b] border border-slate-700/60 text-slate-300 text-[11px] transition text-left cursor-pointer"
                  >
                    {idea}
                  </button>
                ))}
              </div>
            </div>

            {/* Pack Details */}
            <div className="pt-3 border-t border-slate-800 grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                  Pack Name
                </label>
                <input
                  type="text"
                  value={addonData.packName}
                  onChange={(e) => setAddonData({ ...addonData, packName: e.target.value })}
                  className="w-full px-3 py-1.5 rounded-lg bg-[#131d2e] border border-slate-700 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                  Namespace
                </label>
                <input
                  type="text"
                  value={addonData.namespace}
                  onChange={(e) => setAddonData({ ...addonData, namespace: e.target.value })}
                  className="w-full px-3 py-1.5 rounded-lg bg-[#131d2e] border border-slate-700 text-xs text-white font-mono"
                />
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
                  <span>Synthesizing Bedrock Schemas...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Generate Complete Add-on</span>
                </>
              )}
            </button>
          </form>

          {/* Validation Status Badge */}
          <div className="rounded-2xl bg-[#0e1627] border border-slate-800 p-4 space-y-2 text-xs">
            <div className="flex items-center gap-2 font-bold text-white">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Bedrock Compatibility Check</span>
            </div>
            {validation.warnings.length === 0 ? (
              <p className="text-emerald-400/90 text-[11px]">
                ✓ Identifiers, UUID dependencies, and format_version 1.20.80 verified.
              </p>
            ) : (
              <div className="space-y-1 text-amber-400 text-[11px]">
                {validation.warnings.map((w, idx) => (
                  <div key={idx}>• {w}</div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Schema Inspector Tabs */}
        <div className="lg:col-span-7 space-y-4">
          {/* Tab Strip */}
          <div className="flex items-center gap-1.5 bg-[#0e1627] p-1.5 rounded-2xl border border-slate-800 overflow-x-auto">
            <button
              onClick={() => setActiveTab('items')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition shrink-0 ${
                activeTab === 'items'
                  ? 'bg-emerald-500 text-slate-950 font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Items ({addonData.items.length})
            </button>

            <button
              onClick={() => setActiveTab('blocks')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition shrink-0 ${
                activeTab === 'blocks'
                  ? 'bg-emerald-500 text-slate-950 font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Blocks ({addonData.blocks.length})
            </button>

            <button
              onClick={() => setActiveTab('entities')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition shrink-0 ${
                activeTab === 'entities'
                  ? 'bg-emerald-500 text-slate-950 font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Entities ({addonData.entities.length})
            </button>

            <button
              onClick={() => setActiveTab('recipes')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition shrink-0 ${
                activeTab === 'recipes'
                  ? 'bg-emerald-500 text-slate-950 font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Recipes ({addonData.recipes.length})
            </button>

            {addonData.scriptMode && (
              <button
                onClick={() => setActiveTab('script')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition shrink-0 ${
                  activeTab === 'script'
                    ? 'bg-emerald-500 text-slate-950 font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Script (JS)
              </button>
            )}

            <button
              onClick={() => setActiveTab('json')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition shrink-0 ${
                activeTab === 'json'
                  ? 'bg-emerald-500 text-slate-950 font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Raw JSON
            </button>
          </div>

          {/* Tab Contents */}
          <div className="rounded-2xl bg-[#0e1627] border border-slate-800 p-5 min-h-[380px]">
            {activeTab === 'items' && (
              <div className="space-y-3">
                {addonData.items.map((item, idx) => (
                  <div key={idx} className="p-4 rounded-xl bg-[#121c30] border border-slate-700/60 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-white text-xs sm:text-sm">{item.name}</div>
                      <div className="font-mono text-emerald-400 text-[11px] mt-0.5">{item.identifier}</div>
                      <div className="text-slate-400 text-[11px] mt-1 flex items-center gap-3">
                        <span>Max Stack: {item.maxStack}</span>
                        {item.damage && <span>Damage: +{item.damage}</span>}
                        {item.foil && <span className="text-purple-400">Enchanted Glint</span>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'blocks' && (
              <div className="space-y-3">
                {addonData.blocks.map((block, idx) => (
                  <div key={idx} className="p-4 rounded-xl bg-[#121c30] border border-slate-700/60 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-white text-xs sm:text-sm">{block.name}</div>
                      <div className="font-mono text-emerald-400 text-[11px] mt-0.5">{block.identifier}</div>
                      <div className="text-slate-400 text-[11px] mt-1 flex items-center gap-3">
                        <span>Light Emission: {block.lightEmission || 0}</span>
                        <span>Hardness: {block.hardness || 2.0}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'entities' && (
              <div className="space-y-3">
                {addonData.entities.map((entity, idx) => (
                  <div key={idx} className="p-4 rounded-xl bg-[#121c30] border border-slate-700/60">
                    <div className="flex items-center justify-between">
                      <div className="font-bold text-white text-xs sm:text-sm">{entity.name}</div>
                      <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${entity.isHostile ? 'bg-red-500/20 text-red-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                        {entity.isHostile ? 'Hostile Mob' : 'Passive / Friendly'}
                      </span>
                    </div>
                    <div className="font-mono text-emerald-400 text-[11px] mt-0.5">{entity.identifier}</div>
                    <div className="text-slate-400 text-[11px] mt-2 flex flex-wrap gap-4">
                      <span>Health: {entity.health} HP</span>
                      <span>Speed: {entity.movementSpeed}</span>
                      {entity.attackDamage && <span>Attack: {entity.attackDamage}</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'recipes' && (
              <div className="space-y-3">
                {addonData.recipes.map((recipe, idx) => (
                  <div key={idx} className="p-4 rounded-xl bg-[#121c30] border border-slate-700/60">
                    <div className="text-xs font-bold text-white">Craft: {recipe.result} × {recipe.count}</div>
                    <div className="text-[11px] text-slate-400 mt-1">
                      Ingredients: {recipe.ingredients.join(', ')}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'script' && (
              <div className="space-y-2">
                <div className="text-xs font-mono text-slate-400 flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-emerald-400" />
                  <span>scripts/main.js (@minecraft/server v1.11.0)</span>
                </div>
                <textarea
                  value={addonData.scriptCode || ''}
                  onChange={(e) => setAddonData({ ...addonData, scriptCode: e.target.value })}
                  rows={12}
                  className="w-full p-3.5 rounded-xl bg-[#090e18] border border-slate-800 font-mono text-xs text-emerald-400 focus:outline-none"
                />
              </div>
            )}

            {activeTab === 'json' && (
              <pre className="p-3.5 rounded-xl bg-[#090e18] border border-slate-800 font-mono text-[11px] text-slate-300 overflow-auto max-h-[400px]">
                {JSON.stringify(addonData, null, 2)}
              </pre>
            )}
          </div>
        </div>
      </div>

      {/* Ad Modal */}
      {showAdModal && pendingBlob && (
        <AdSlot
          fileName={pendingBlob.fileName}
          fileSizeStr="~24 KB"
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
