import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import {
  Sparkles,
  Wand2,
  Download,
  Edit3,
  RefreshCw,
  Plus,
  Trash2,
  Copy,
  ChevronDown,
  ChevronUp,
  Sliders,
  CheckCircle,
  AlertCircle,
  Shield,
  Layers,
  User,
  Info,
} from 'lucide-react';
import { ThreeSkinViewer } from '../components/ThreeSkinViewer';
import { PixelEditorModal } from '../components/PixelEditorModal';
import { AdSlot } from '../components/AdSlot';
import { renderSkinToCanvas, generatePackIcon } from '../utils/skinRenderer';
import { createSkinMcPack } from '../packagers/skinPackager';
import { ArmModel, GeneratedSkinItem, SkinPackState, SavedCreation } from '../types';
import { UserSettings, CREATOR_NAME, CREATOR_YOUTUBE_URL } from '../config';

interface SkinGeneratorPageProps {
  userSettings: UserSettings;
  onSaveCreation: (creation: SavedCreation) => void;
}

const EXAMPLE_PROMPTS = [
  'Cyberpunk ninja with glowing emerald eyes and dark carbon fiber armor',
  'Steampunk clockwork adventurer with brass goggles and leather coat',
  'Ender shadow assassin with dark obsidian cowl and purple void runes',
  'Galactic deep-space astronaut with gold reflective visor and oxygen pack',
  'Ancient mossy stone golem warrior with overgrown oak vines',
  'Crimson nether pyromancer with blazing lava horns and obsidian robe',
];

export const SkinGeneratorPage: React.FC<SkinGeneratorPageProps> = ({
  userSettings,
  onSaveCreation,
}) => {
  // Pack state
  const [packTitle, setPackTitle] = useState('My Custom Skin Pack');
  const [packDesc, setPackDesc] = useState('Created with mc-generator');
  const [prompt, setPrompt] = useState('Cyberpunk ninja with neon emerald visor and tactical armor');
  const [armModel, setArmModel] = useState<ArmModel>('classic');

  // Advanced options toggle
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [customHairStyle, setCustomHairStyle] = useState('auto');
  const [customExpression, setCustomExpression] = useState('auto');
  const [customOverlay, setCustomOverlay] = useState('auto');

  // Skins list in this pack (up to 10 skins)
  const [skins, setSkins] = useState<GeneratedSkinItem[]>([]);
  const [currentSkinIndex, setCurrentSkinIndex] = useState(0);

  // Active skin canvas
  const [activeCanvas, setActiveCanvas] = useState<HTMLCanvasElement | null>(null);

  // UI States
  const [isGenerating, setIsGenerating] = useState(false);
  const [isImprovingPrompt, setIsImprovingPrompt] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  // Modals
  const [isEditingPixel, setIsEditingPixel] = useState(false);
  const [showAdModal, setShowAdModal] = useState(false);
  const [pendingDownloadBlob, setPendingDownloadBlob] = useState<{ blob: Blob; fileName: string } | null>(null);

  // Reference for file input (optional texture import)
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initial Skin Generation on mount
  useEffect(() => {
    // Generate default initial skin so user immediately sees a live interactive 3D model
    const initialSkin: GeneratedSkinItem = {
      id: 'skin_default',
      name: 'Cyberpunk Ninja',
      description: 'Futuristic stealth operative with neon emerald visor',
      model: 'classic',
      palette: {
        primaryHex: '#0f172a',
        secondaryHex: '#1e293b',
        accentHex: '#10b981',
        skinHex: '#fecdd3',
        hairHex: '#020617',
        eyesHex: '#10b981',
        pantsHex: '#0f172a',
        bootsHex: '#020617',
        accessoryHex: '#34d399',
        shadingIntensity: 0.14,
      },
      layers: {
        hairStyle: 'ninja_cowl',
        faceExpression: 'visor',
        clothingStyle: 'cyber_suit',
        overlayType: 'full_coat',
        hasGloves: true,
        hasBoots: true,
        hasBelt: true,
      },
    };

    const canvas = renderSkinToCanvas(initialSkin);
    initialSkin.canvasDataUrl = canvas.toDataURL('image/png');

    setSkins([initialSkin]);
    setCurrentSkinIndex(0);
    setActiveCanvas(canvas);
  }, []);

  // Update activeCanvas whenever current skin changes
  const activeSkin = skins[currentSkinIndex] || skins[0];

  useEffect(() => {
    if (!activeSkin) return;
    const canvas = renderSkinToCanvas(activeSkin);
    setActiveCanvas(canvas);
  }, [currentSkinIndex, activeSkin?.id, activeSkin?.model]);

  // AI Prompt Improver
  const handleImprovePrompt = async () => {
    if (!prompt.trim()) return;
    setIsImprovingPrompt(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/improve-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: prompt.trim(), generatorType: 'skin' }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to improve prompt');
      }

      if (data.improvedPrompt) {
        setPrompt(data.improvedPrompt);
        setSuccessNotice('Prompt expanded with rich Bedrock details!');
        setTimeout(() => setSuccessNotice(null), 3500);
      }
    } catch (err: unknown) {
      setErrorMsg((err as Error).message || 'Failed to improve prompt.');
    } finally {
      setIsImprovingPrompt(false);
    }
  };

  // AI Skin Generator
  const handleGenerate = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!prompt.trim()) {
      setErrorMsg('Please describe a character first.');
      return;
    }

    setIsGenerating(true);
    setErrorMsg(null);

    try {
      const styleOptions: Record<string, string> = {};
      if (customHairStyle !== 'auto') styleOptions.hairStyle = customHairStyle;
      if (customExpression !== 'auto') styleOptions.faceExpression = customExpression;
      if (customOverlay !== 'auto') styleOptions.overlayType = customOverlay;

      const res = await fetch('/api/generate-skin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: prompt.trim(),
          model: armModel,
          styleOptions,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Generation failed');
      }

      const newSkin: GeneratedSkinItem = {
        ...data,
        model: armModel,
      };

      // Render 64x64 canvas
      const canvas = renderSkinToCanvas(newSkin);
      newSkin.canvasDataUrl = canvas.toDataURL('image/png');

      // Update current skin or append if less than 10
      const updatedSkins = [...skins];
      if (updatedSkins.length === 0) {
        updatedSkins.push(newSkin);
        setCurrentSkinIndex(0);
      } else {
        updatedSkins[currentSkinIndex] = newSkin;
      }

      setSkins(updatedSkins);
      setActiveCanvas(canvas);
      setSuccessNotice(`Generated "${newSkin.name}" successfully!`);
      setTimeout(() => setSuccessNotice(null), 4000);
    } catch (err: unknown) {
      setErrorMsg((err as Error).message || 'Generation failed. Try rephrasing your description.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Add a new empty skin to current pack
  const handleAddNewSkin = () => {
    if (skins.length >= 10) {
      setErrorMsg('Skin packs in Minecraft Bedrock support up to 10 skins per pack.');
      return;
    }

    const newIndex = skins.length + 1;
    const newSkin: GeneratedSkinItem = {
      id: 'skin_' + Date.now(),
      name: `Skin ${newIndex}`,
      description: 'Custom Bedrock skin',
      model: armModel,
      palette: {
        primaryHex: '#10b981',
        secondaryHex: '#1e293b',
        accentHex: '#34d399',
        skinHex: '#fecdd3',
        hairHex: '#334155',
        eyesHex: '#0284c7',
        pantsHex: '#1e293b',
        bootsHex: '#0f172a',
        accessoryHex: '#10b981',
        shadingIntensity: 0.12,
      },
      layers: {
        hairStyle: 'short',
        faceExpression: 'neutral',
        clothingStyle: 'cyber_suit',
        overlayType: 'full_coat',
        hasGloves: true,
        hasBoots: true,
        hasBelt: true,
      },
    };

    const canvas = renderSkinToCanvas(newSkin);
    newSkin.canvasDataUrl = canvas.toDataURL('image/png');

    setSkins([...skins, newSkin]);
    setCurrentSkinIndex(skins.length);
    setActiveCanvas(canvas);
  };

  // Duplicate current skin
  const handleDuplicateSkin = () => {
    if (skins.length >= 10) {
      setErrorMsg('Maximum 10 skins per pack reached.');
      return;
    }
    if (!activeSkin) return;

    const dupSkin: GeneratedSkinItem = {
      ...JSON.parse(JSON.stringify(activeSkin)),
      id: 'skin_' + Date.now(),
      name: `${activeSkin.name} (Copy)`,
    };

    const canvas = renderSkinToCanvas(dupSkin);
    dupSkin.canvasDataUrl = canvas.toDataURL('image/png');

    const updated = [...skins, dupSkin];
    setSkins(updated);
    setCurrentSkinIndex(updated.length - 1);
    setActiveCanvas(canvas);
  };

  // Delete skin
  const handleDeleteSkin = (index: number) => {
    if (skins.length <= 1) {
      setErrorMsg('A skin pack must have at least one skin.');
      return;
    }
    const updated = skins.filter((_, idx) => idx !== index);
    setSkins(updated);
    setCurrentSkinIndex(Math.max(0, index - 1));
  };

  // Pixel Editor save handler
  const handleSavePixelEdit = (newCanvas: HTMLCanvasElement) => {
    if (!activeSkin) return;
    const dataUrl = newCanvas.toDataURL('image/png');

    const updatedSkins = [...skins];
    updatedSkins[currentSkinIndex] = {
      ...activeSkin,
      canvasDataUrl: dataUrl,
    };

    setSkins(updatedSkins);
    setActiveCanvas(newCanvas);
    setIsEditingPixel(false);
    setSuccessNotice('Pixel edits saved to 3D model!');
    setTimeout(() => setSuccessNotice(null), 3000);
  };

  // Export & Download Flow
  const handleInitiateExport = async () => {
    if (skins.length === 0) {
      setErrorMsg('Add at least one skin before exporting.');
      return;
    }

    try {
      // Ensure all skins have canvasDataUrl
      const finalizedSkins = skins.map((s) => {
        if (!s.canvasDataUrl) {
          const c = renderSkinToCanvas(s);
          return { ...s, canvasDataUrl: c.toDataURL('image/png') };
        }
        return s;
      });

      // Generate pack icon
      const iconUrl = generatePackIcon(
        packTitle,
        activeSkin?.palette?.accentHex || '#10b981'
      );

      // Create genuine .mcpack with JSZip
      const { blob, fileName } = await createSkinMcPack({
        packName: packTitle,
        packDescription: packDesc,
        skins: finalizedSkins,
        includeCreatorCredit: userSettings.includeCreatorCredit,
        packIconDataUrl: iconUrl,
      });

      setPendingDownloadBlob({ blob, fileName });
      setShowAdModal(true); // Show AdSlot modal with 5-sec countdown
    } catch (err: unknown) {
      setErrorMsg('Failed to build .mcpack: ' + (err as Error).message);
    }
  };

  // Ad modal finished countdown -> execute real download
  const handleConfirmDownload = () => {
    if (!pendingDownloadBlob) return;

    const { blob, fileName } = pendingDownloadBlob;
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 1000);

    // Confetti celebration
    try {
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.7 },
        colors: ['#10b981', '#34d399', '#059669', '#ffffff'],
      });
    } catch {
      // Ignore confetti error
    }

    // Save to local creations
    if (userSettings.autoSaveHistory) {
      const creation: SavedCreation = {
        id: 'creation_' + Date.now(),
        type: 'skin_pack',
        title: packTitle,
        description: `${skins.length} skin${skins.length > 1 ? 's' : ''} • Bedrock .mcpack`,
        createdAt: Date.now(),
        fileName,
        previewUrl: activeSkin?.canvasDataUrl,
      };
      onSaveCreation(creation);
    }

    setShowAdModal(false);
    setPendingDownloadBlob(null);
    setSuccessNotice(`Downloaded ${fileName}! Tap it on your phone or PC to open in Minecraft.`);
  };

  // Optional Reference image upload (reads file & triggers prompt generation)
  const handleReferenceUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        // If it's a 64x64 Minecraft skin, load directly
        if (img.width === 64 && img.height === 64) {
          const canvas = document.createElement('canvas');
          canvas.width = 64;
          canvas.height = 64;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0);
            const dataUrl = canvas.toDataURL('image/png');
            if (activeSkin) {
              const updated = [...skins];
              updated[currentSkinIndex] = {
                ...activeSkin,
                canvasDataUrl: dataUrl,
                name: file.name.replace(/\.[^/.]+$/, ''),
              };
              setSkins(updated);
              setActiveCanvas(canvas);
              setSuccessNotice('Loaded existing 64x64 skin texture!');
            }
          }
        } else {
          setSuccessNotice(`Uploaded "${file.name}". Click Generate to create an AI Bedrock skin!`);
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-8">
      {/* Page Title & Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs text-emerald-400 font-semibold uppercase tracking-wider">
            <Sparkles className="w-4 h-4" />
            <span>Bedrock Add-on Studio</span>
          </div>
          <h1 className="font-pixel text-lg sm:text-2xl text-white mt-1">
            SKIN PACK GENERATOR
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Build custom 64x64 Bedrock skins with 3D rotating preview, pixel editor, and ready-to-install <code className="text-emerald-400 font-mono">.mcpack</code> export.
          </p>
        </div>

        {/* Export / Download CTA button */}
        <button
          onClick={handleInitiateExport}
          className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm shadow-lg shadow-emerald-500/25 transition active:scale-95 cursor-pointer shrink-0"
        >
          <Download className="w-4 h-4" />
          <span>Export .mcpack ({skins.length})</span>
        </button>
      </div>

      {/* Notifications */}
      {successNotice && (
        <div className="p-3.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2.5 animate-in fade-in">
          <CheckCircle className="w-4 h-4 shrink-0 text-emerald-400" />
          <span className="flex-1">{successNotice}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-3.5 rounded-xl bg-red-500/15 border border-red-500/30 text-red-300 text-xs flex items-center gap-2.5 animate-in fade-in">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
          <span className="flex-1">{errorMsg}</span>
          <button onClick={() => setErrorMsg(null)} className="text-red-400 font-bold">
            ×
          </button>
        </div>
      )}

      {/* Main Grid: Left Column (Controls & Generation) / Right Column (3D Preview & Pixel Tools) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column (Inputs, Prompt, Pack Settings) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Pack Metadata Card */}
          <div className="rounded-2xl bg-[#0e1627] border border-slate-800 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-emerald-400" />
                Pack Details
              </h3>
              <span className="text-[11px] text-slate-400 font-mono">
                {skins.length}/10 Skins
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  Pack Title
                </label>
                <input
                  type="text"
                  value={packTitle}
                  onChange={(e) => setPackTitle(e.target.value)}
                  placeholder="My Custom Skin Pack"
                  className="w-full px-3.5 py-2 rounded-xl bg-[#131d2e] border border-slate-700/80 text-white text-xs focus:outline-none focus:border-emerald-500 transition"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  Description
                </label>
                <input
                  type="text"
                  value={packDesc}
                  onChange={(e) => setPackDesc(e.target.value)}
                  placeholder="Created with mc-generator"
                  className="w-full px-3.5 py-2 rounded-xl bg-[#131d2e] border border-slate-700/80 text-white text-xs focus:outline-none focus:border-emerald-500 transition"
                />
              </div>
            </div>

            {/* Skins in this pack tab strip */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-semibold text-slate-400">
                  Select Active Skin to Edit or Preview
                </span>
                <button
                  onClick={handleAddNewSkin}
                  disabled={skins.length >= 10}
                  className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1 font-semibold disabled:opacity-40 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Skin</span>
                </button>
              </div>

              <div className="flex items-center gap-2 overflow-x-auto pb-2">
                {skins.map((skin, idx) => (
                  <div
                    key={skin.id}
                    onClick={() => setCurrentSkinIndex(idx)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs cursor-pointer transition shrink-0 ${
                      currentSkinIndex === idx
                        ? 'bg-emerald-500/20 border-emerald-500 text-white font-bold shadow-sm'
                        : 'bg-[#121c2e] border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: skin.palette.accentHex }} />
                    <span className="max-w-[100px] truncate">{skin.name}</span>
                    {skins.length > 1 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteSkin(idx);
                        }}
                        className="text-slate-400 hover:text-red-400 p-0.5 rounded"
                        title="Delete skin"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* AI Generator Prompt Card */}
          <form onSubmit={handleGenerate} className="rounded-2xl bg-[#0e1627] border border-slate-800 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Wand2 className="w-4 h-4 text-emerald-400" />
                Skin Description
              </h3>

              {/* Arm Model Toggle */}
              <div className="flex items-center gap-1 bg-[#121c2e] p-1 rounded-xl border border-slate-700/60">
                <button
                  type="button"
                  onClick={() => setArmModel('classic')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                    armModel === 'classic'
                      ? 'bg-emerald-500 text-slate-950 shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                  title="Classic Steve 4px arm width"
                >
                  Classic (4px)
                </button>
                <button
                  type="button"
                  onClick={() => setArmModel('slim')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                    armModel === 'slim'
                      ? 'bg-emerald-500 text-slate-950 shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                  title="Alex 3px slim arm width"
                >
                  Slim / Alex (3px)
                </button>
              </div>
            </div>

            {/* Prompt Textarea */}
            <div className="relative">
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Describe your character (e.g. Cyberpunk ninja with neon visor and dark armor)..."
                rows={3}
                className="w-full px-4 py-3 rounded-xl bg-[#131d2e] border border-slate-700/80 text-white text-xs sm:text-sm placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition resize-none leading-relaxed"
              />

              {/* Improve Prompt Button */}
              <div className="flex items-center justify-between mt-2">
                <button
                  type="button"
                  onClick={handleImprovePrompt}
                  disabled={isImprovingPrompt || !prompt.trim()}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-semibold transition disabled:opacity-40 cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{isImprovingPrompt ? 'Improving...' : 'Improve my prompt (AI)'}</span>
                </button>

                <div className="text-[11px] text-slate-500">
                  Model: <span className="text-slate-400 font-mono">gemini-3.8-flash</span>
                </div>
              </div>
            </div>

            {/* Example Chips */}
            <div>
              <div className="text-[11px] font-semibold text-slate-400 mb-2">
                Try an example idea:
              </div>
              <div className="flex flex-wrap gap-1.5">
                {EXAMPLE_PROMPTS.map((ex, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setPrompt(ex)}
                    className="px-2.5 py-1 rounded-lg bg-[#121c2e] hover:bg-[#18253b] border border-slate-700/60 text-slate-300 text-[11px] transition text-left cursor-pointer"
                  >
                    {ex.length > 36 ? ex.slice(0, 36) + '...' : ex}
                  </button>
                ))}
              </div>
            </div>

            {/* Collapsible Advanced Style Options */}
            <div className="pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="w-full flex items-center justify-between py-1 text-xs font-semibold text-slate-300 hover:text-white transition cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <Sliders className="w-3.5 h-3.5 text-emerald-400" />
                  Advanced Layer Options
                </span>
                {showAdvanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>

              {showAdvanced && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-400 mb-1">
                      Hair / Headwear
                    </label>
                    <select
                      value={customHairStyle}
                      onChange={(e) => setCustomHairStyle(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-[#131d2e] border border-slate-700 text-xs text-white"
                    >
                      <option value="auto">Auto (from prompt)</option>
                      <option value="ninja_cowl">Ninja Cowl</option>
                      <option value="hood">Hood</option>
                      <option value="helmet">Helmet</option>
                      <option value="short">Short Hair</option>
                      <option value="messy">Messy / Spiky</option>
                      <option value="bandana">Bandana</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-slate-400 mb-1">
                      Face Expression
                    </label>
                    <select
                      value={customExpression}
                      onChange={(e) => setCustomExpression(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-[#131d2e] border border-slate-700 text-xs text-white"
                    >
                      <option value="auto">Auto (from prompt)</option>
                      <option value="visor">Glowing Visor</option>
                      <option value="glow_eyes">Glowing Eyes</option>
                      <option value="masked">Face Mask</option>
                      <option value="determined">Determined Eyes</option>
                      <option value="neutral">Classic Neutral</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-slate-400 mb-1">
                      Outer Layer Overlay
                    </label>
                    <select
                      value={customOverlay}
                      onChange={(e) => setCustomOverlay(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-[#131d2e] border border-slate-700 text-xs text-white"
                    >
                      <option value="auto">Auto (from prompt)</option>
                      <option value="full_coat">Jacket / Long Coat</option>
                      <option value="shoulder_pads">Shoulder Pauldrons</option>
                      <option value="goggles">Goggles</option>
                      <option value="headband">Headband</option>
                      <option value="none">No 3D Overlay</option>
                    </select>
                  </div>
                </div>
              )}
            </div>

            {/* Action Buttons: Generate & Reference Upload */}
            <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
              <button
                type="submit"
                disabled={isGenerating || !prompt.trim()}
                className="w-full sm:flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs sm:text-sm shadow-xl shadow-emerald-500/25 transition active:scale-98 disabled:opacity-50 cursor-pointer"
              >
                {isGenerating ? (
                  <>
                    <span className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                    <span>Designing Bedrock Skin...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Generate Skin</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full sm:w-auto px-4 py-3 rounded-xl bg-[#121c2e] hover:bg-slate-800 border border-slate-700 text-slate-300 text-xs font-semibold transition cursor-pointer"
                title="Upload an existing 64x64 skin PNG to view or edit"
              >
                Import 64x64 PNG
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png"
                onChange={handleReferenceUpload}
                className="hidden"
              />
            </div>
          </form>

          {/* Skin Palette Swatches & Bio */}
          {activeSkin && (
            <div className="rounded-2xl bg-[#0e1627] border border-slate-800 p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-white">{activeSkin.name}</h4>
                  <p className="text-xs text-slate-400 mt-0.5">{activeSkin.description}</p>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={handleDuplicateSkin}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition flex items-center gap-1"
                    title="Duplicate skin"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Duplicate</span>
                  </button>
                </div>
              </div>

              {/* Color Palette Display */}
              <div>
                <div className="text-[11px] font-semibold text-slate-400 mb-1.5">
                  Generated Palette:
                </div>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(activeSkin.palette)
                    .filter(([key]) => key.endsWith('Hex'))
                    .map(([key, val]) => (
                      <div
                        key={key}
                        className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-[#131d2e] border border-slate-700/60 text-[10px] text-slate-300"
                      >
                        <span
                          className="w-3 h-3 rounded-sm border border-black/30 shrink-0"
                          style={{ backgroundColor: val as string }}
                        />
                        <span className="font-mono">{val as string}</span>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: 3D Preview, 2D Canvas, and Pixel Editor */}
        <div className="lg:col-span-5 space-y-6">
          <div className="rounded-2xl bg-[#0e1627] border border-slate-800 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <User className="w-4 h-4 text-emerald-400" />
                3D Bedrock Preview
              </h3>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsEditingPixel(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Pixel Editor</span>
                </button>
              </div>
            </div>

            {/* 3D Three.js rotating viewport */}
            <div className="w-full">
              <ThreeSkinViewer
                skinCanvas={activeCanvas}
                model={activeSkin?.model || armModel}
              />
            </div>

            {/* 2D Canvas layout thumbnail + Direct Download PNG */}
            <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                {activeCanvas && (
                  <div className="relative group">
                    <img
                      src={activeCanvas.toDataURL('image/png')}
                      alt="Skin 64x64 Texture"
                      className="w-12 h-12 rounded bg-[#090e18] border border-slate-700 shadow-sm"
                      style={{ imageRendering: 'pixelated' }}
                    />
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition text-[8px] text-white font-mono">
                      64×64
                    </div>
                  </div>
                )}
                <div>
                  <div className="text-xs font-semibold text-white">
                    Bedrock 64×64 UV
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Dual layer • Alpha transparency
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsEditingPixel(true)}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition"
                >
                  Edit Pixels
                </button>

                <a
                  href={activeCanvas?.toDataURL('image/png')}
                  download={`${activeSkin?.name?.toLowerCase().replace(/\s+/g, '_') || 'skin'}.png`}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-400 transition"
                  title="Download raw 64x64 PNG"
                >
                  <Download className="w-4 h-4" />
                </a>
              </div>
            </div>
          </div>

          {/* Quick Install Instruction tip */}
          <div className="p-4 rounded-xl bg-[#0d1424] border border-slate-800 text-xs text-slate-400 space-y-2">
            <div className="flex items-center gap-1.5 text-emerald-400 font-semibold">
              <Info className="w-4 h-4" />
              <span>How this file works:</span>
            </div>
            <p className="leading-relaxed">
              When you click <strong>Export .mcpack</strong>, mc-generator packages a real Bedrock skin pack containing your skin textures, <code className="text-slate-300">manifest.json</code> with UUIDs, and <code className="text-slate-300">skins.json</code>. On mobile or Windows, just tap the downloaded file to auto-import into Minecraft!
            </p>
          </div>
        </div>
      </div>

      {/* Pixel Editor Modal */}
      {isEditingPixel && activeCanvas && (
        <PixelEditorModal
          initialCanvas={activeCanvas}
          skinName={activeSkin?.name || 'Custom Skin'}
          paletteColors={
            activeSkin
              ? Object.entries(activeSkin.palette)
                  .filter(([k]) => k.endsWith('Hex'))
                  .map(([, v]) => v as string)
              : ['#10b981', '#1e293b', '#ffffff', '#000000']
          }
          onSave={handleSavePixelEdit}
          onClose={() => setIsEditingPixel(false)}
        />
      )}

      {/* AdSlot Modal before downloading */}
      {showAdModal && pendingDownloadBlob && (
        <AdSlot
          fileName={pendingDownloadBlob.fileName}
          fileSizeStr="~12 KB"
          onConfirmDownload={handleConfirmDownload}
          onCancel={() => {
            setShowAdModal(false);
            setPendingDownloadBlob(null);
          }}
        />
      )}
    </div>
  );
};
