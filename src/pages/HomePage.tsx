import React from 'react';
import { PageId } from '../components/Navbar';
import { CreatorCard } from '../components/CreatorCard';
import { SavedCreation } from '../types';
import {
  Sparkles,
  Palette,
  Layers,
  Box,
  Globe,
  ArrowRight,
  Download,
  Smartphone,
  Laptop,
  CheckCircle2,
  Clock,
  ShieldCheck,
} from 'lucide-react';

interface HomePageProps {
  onNavigate: (page: PageId) => void;
  recentCreations: SavedCreation[];
  onOpenCreation?: (creation: SavedCreation) => void;
}

export const HomePage: React.FC<HomePageProps> = ({
  onNavigate,
  recentCreations,
  onOpenCreation,
}) => {
  const generators = [
    {
      id: 'generator-skin' as PageId,
      title: 'Skin Pack Generator',
      tagline: 'Custom 64x64 Bedrock skins with 3D preview',
      desc: 'Type any character description. Get an AI-designed 64x64 skin with genuine UV mapping, outer 3D armor overlays, in-browser pixel editor, and a ready-to-install .mcpack for Steve or Alex models.',
      icon: Sparkles,
      badge: 'READY',
      badgeColor: 'bg-emerald-500 text-slate-950 font-bold',
      accentColor: 'from-emerald-500/20 to-emerald-500/5',
      borderColor: 'border-emerald-500/40 hover:border-emerald-400',
      actionText: 'Open Skin Generator',
      features: ['Classic (4px) & Slim (Alex) arms', 'Rotating 3D Three.js preview', 'Built-in 2D pixel editor', 'Up to 10 skins per .mcpack'],
    },
    {
      id: 'generator-texture' as PageId,
      title: 'Texture Pack Generator',
      tagline: 'Original 16x/32x/64x Bedrock resource packs',
      desc: 'Select a theme (medieval, pastel, cyberpunk, sci-fi) and choose resolution. The AI generates original pixel art textures packaged with terrain_texture.json, item_texture.json and pack_icon.png.',
      icon: Palette,
      badge: 'READY',
      badgeColor: 'bg-cyan-500 text-slate-950 font-bold',
      accentColor: 'from-cyan-500/20 to-cyan-500/5',
      borderColor: 'border-cyan-500/40 hover:border-cyan-400',
      actionText: 'Open Texture Generator',
      features: ['Ores, weapons, tools, blocks', '16x, 32x & 64x resolutions', 'Tile grid preview & fine-tune', 'Instant .mcpack download'],
    },
    {
      id: 'generator-addon' as PageId,
      title: 'Add-on Generator',
      tagline: 'Behavior + Resource Pack (BP & RP)',
      desc: 'Turn plain ideas into working Bedrock entities, custom weapons, armor, glowing ores, and custom recipes. Features strict schema validation, format_version 1.20.80, and optional JavaScript scripts.',
      icon: Layers,
      badge: 'READY',
      badgeColor: 'bg-purple-500 text-slate-950 font-bold',
      accentColor: 'from-purple-500/20 to-purple-500/5',
      borderColor: 'border-purple-500/40 hover:border-purple-400',
      actionText: 'Open Add-on Generator',
      features: ['Custom mobs, behaviors, loot', 'New items, blocks & recipes', 'Auto-fix identifier validation', 'Linked .mcaddon export'],
    },
    {
      id: 'generator-structure' as PageId,
      title: 'Structure / Build Generator',
      tagline: 'Voxel houses, castles & arenas',
      desc: 'Describe any build. Get a 3D voxel preview with cutaway layer slicing and download a genuine .mcstructure NBT file for in-game Structure Blocks plus alternative .mcfunction commands.',
      icon: Box,
      badge: 'READY',
      badgeColor: 'bg-amber-500 text-slate-950 font-bold',
      accentColor: 'from-amber-500/20 to-amber-500/5',
      borderColor: 'border-amber-500/40 hover:border-amber-400',
      actionText: 'Open Structure Generator',
      features: ['3D Three.js voxel visualizer', 'Genuine .mcstructure NBT export', 'Alternative /setblock functions', 'Structure block guide'],
    },
    {
      id: 'generator-world' as PageId,
      title: 'World Builder Pack',
      tagline: 'Spawn areas, arenas & flat presets',
      desc: 'Realistic world generation tools: behavior functions to build custom themed spawn hubs, floating islands, and parkour courses at player location, paired with copyable Flat World preset codes.',
      icon: Globe,
      badge: 'READY',
      badgeColor: 'bg-emerald-500 text-slate-950 font-bold',
      accentColor: 'from-teal-500/20 to-teal-500/5',
      borderColor: 'border-teal-500/40 hover:border-teal-400',
      actionText: 'Open World Builder',
      features: ['In-game function generator', 'Flat World layer presets', 'Transparent LevelDB scope', 'One-click copy presets'],
    },
  ];

  return (
    <div className="space-y-16 py-8 px-4 sm:px-6 max-w-7xl mx-auto">
      {/* Hero Section */}
      <section className="relative text-center space-y-6 pt-6 sm:pt-12 pb-6">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
          <Sparkles className="w-3.5 h-3.5 animate-pulse" />
          <span>Pocket Edition (Bedrock) • Android • iOS • Windows</span>
        </div>

        <h1 className="font-pixel text-xl sm:text-3xl md:text-4xl text-white tracking-wide leading-relaxed sm:leading-loose max-w-3xl mx-auto">
          GENERATE MINECRAFT BEDROCK PACKS WITH AI
        </h1>

        <p className="text-slate-300 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
          Describe what you want. mc-generator builds original, valid Minecraft Bedrock packages (<code className="text-emerald-400 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">.mcpack</code>, <code className="text-emerald-400 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">.mcaddon</code>, and <code className="text-emerald-400 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">.mcstructure</code>) that install directly into your game with a single tap.
        </p>

        {/* Feature Badges */}
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2 text-xs text-slate-400">
          <span className="flex items-center gap-1.5 bg-slate-900/80 border border-slate-800 px-3 py-1.5 rounded-full">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            100% Free
          </span>
          <span className="flex items-center gap-1.5 bg-slate-900/80 border border-slate-800 px-3 py-1.5 rounded-full">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            No Login Required
          </span>
          <span className="flex items-center gap-1.5 bg-slate-900/80 border border-slate-800 px-3 py-1.5 rounded-full">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            No Daily Limit
          </span>
          <span className="flex items-center gap-1.5 bg-slate-900/80 border border-slate-800 px-3 py-1.5 rounded-full">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            Genuine Bedrock UUIDs
          </span>
        </div>

        {/* Hero CTA */}
        <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={() => onNavigate('generator-skin')}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm shadow-xl shadow-emerald-500/25 transition active:scale-95 cursor-pointer"
          >
            <Sparkles className="w-4 h-4" />
            <span>Launch Skin Pack Generator</span>
            <ArrowRight className="w-4 h-4 ml-1" />
          </button>

          <button
            onClick={() => onNavigate('install-guide')}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700 text-slate-200 text-sm font-semibold transition cursor-pointer"
          >
            <span>How to Install on Phone/PC</span>
          </button>
        </div>
      </section>

      {/* 5 Big Generator Cards */}
      <section className="space-y-6">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <h2 className="font-pixel text-base sm:text-lg text-white">
              BEDROCK CONTENT GENERATORS
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Select a module to build your pack
            </p>
          </div>
          <span className="text-xs text-emerald-400 font-mono hidden sm:inline-block">
            5 Working Modules
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {generators.map((gen) => {
            const Icon = gen.icon;
            return (
              <div
                key={gen.id}
                className={`relative rounded-2xl bg-gradient-to-b ${gen.accentColor} bg-[#0e1627] border ${gen.borderColor} p-6 flex flex-col justify-between shadow-xl transition-all duration-200 hover:-translate-y-1`}
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-slate-900/80 border border-slate-700 shadow-inner">
                      <Icon className="w-6 h-6 text-emerald-400" />
                    </div>

                    <span className={`text-[10px] px-2.5 py-1 rounded-full ${gen.badgeColor}`}>
                      {gen.badge}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    {gen.title}
                  </h3>
                  <div className="text-xs text-emerald-400/90 font-medium mt-0.5 mb-2">
                    {gen.tagline}
                  </div>

                  <p className="text-xs text-slate-400 leading-relaxed mb-4">
                    {gen.desc}
                  </p>

                  <ul className="space-y-1.5 mb-6 text-[11px] text-slate-300">
                    {gen.features.map((feat, fIdx) => (
                      <li key={fIdx} className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <button
                    onClick={() => onNavigate(gen.id)}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-md shadow-emerald-500/20 transition cursor-pointer active:scale-98"
                  >
                    <span>{gen.actionText}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Recent Creations Section */}
      <section className="space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-emerald-400" />
            <h2 className="font-pixel text-sm sm:text-base text-white">
              MY CREATIONS
            </h2>
          </div>
          {recentCreations.length > 0 && (
            <button
              onClick={() => onNavigate('creations')}
              className="text-xs text-emerald-400 hover:underline cursor-pointer"
            >
              View all ({recentCreations.length})
            </button>
          )}
        </div>

        {recentCreations.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-800 p-8 text-center bg-[#0c1220]/50">
            <Sparkles className="w-8 h-8 text-slate-600 mx-auto mb-2" />
            <h4 className="text-sm font-semibold text-slate-300">No creations saved yet</h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
              Packs you create are automatically remembered locally on this device so you can re-download them anytime without signing in.
            </p>
            <button
              onClick={() => onNavigate('generator-skin')}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-400 text-xs font-semibold transition cursor-pointer"
            >
              Generate your first Skin Pack
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {recentCreations.slice(0, 3).map((creation) => (
              <div
                key={creation.id}
                className="rounded-xl bg-[#0f172a] border border-slate-800 p-4 flex items-center gap-3.5 hover:border-slate-700 transition"
              >
                {creation.previewUrl ? (
                  <img
                    src={creation.previewUrl}
                    alt={creation.title}
                    className="w-12 h-12 rounded-lg bg-slate-900 object-cover shrink-0 border border-slate-700"
                    style={{ imageRendering: 'pixelated' }}
                  />
                ) : (
                  <div className="w-12 h-12 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                    <Sparkles className="w-6 h-6" />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-bold text-white truncate">{creation.title}</div>
                  <div className="text-[11px] text-slate-400 truncate mt-0.5">
                    {new Date(creation.createdAt).toLocaleDateString()}
                  </div>
                </div>
                <button
                  onClick={() => onOpenCreation?.(creation)}
                  className="p-2 rounded-lg bg-slate-800 hover:bg-emerald-500 hover:text-slate-950 text-slate-300 transition"
                  title="Download pack"
                >
                  <Download className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Quick Install Explainer */}
      <section className="rounded-2xl bg-[#0d1424] border border-slate-800 p-6 sm:p-8 space-y-6">
        <div>
          <h2 className="font-pixel text-sm sm:text-base text-white">
            HOW TO INSTALL IN MINECRAFT BEDROCK
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Genuine Bedrock files open directly on phone, tablet, and PC
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="p-4 rounded-xl bg-[#121c30] border border-slate-700/60 space-y-2">
            <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold">
              <Smartphone className="w-4 h-4" />
              <span>Android (Pocket Edition)</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              1. Tap <strong>Export .mcpack / .mcaddon</strong>.<br />
              2. Open your notification or Downloads folder.<br />
              3. Tap the file and select <strong>Open with Minecraft</strong>.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-[#121c30] border border-slate-700/60 space-y-2">
            <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold">
              <Smartphone className="w-4 h-4" />
              <span>iOS (iPhone & iPad)</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              1. Download the file in Safari.<br />
              2. Tap the download icon in Safari toolbar & select the file.<br />
              3. Tap <strong>Share &gt; Minecraft</strong> to auto-import.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-[#121c30] border border-slate-700/60 space-y-2">
            <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold">
              <Laptop className="w-4 h-4" />
              <span>Windows 10 / 11 Bedrock</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              1. Download the <code className="text-emerald-400 font-mono">.mcpack</code> file.<br />
              2. Double click the file.<br />
              3. Minecraft launches automatically and imports your pack!
            </p>
          </div>
        </div>

        <div className="text-center pt-2">
          <button
            onClick={() => onNavigate('install-guide')}
            className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold inline-flex items-center gap-1.5 cursor-pointer"
          >
            <span>View complete step-by-step install & troubleshooting guide</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </section>

      {/* Creator Spotlight Card */}
      <CreatorCard />
    </div>
  );
};
