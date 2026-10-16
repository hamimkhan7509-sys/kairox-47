import React, { useState } from 'react';
import {
  Menu,
  X,
  Sparkles,
  BookOpen,
  FolderArchive,
  Settings,
  Info,
  Layers,
  Box,
  Globe,
  Palette,
  ChevronDown,
} from 'lucide-react';
import { SITE_NAME } from '../config';
import { PWAInstallButton } from './PWAInstallButton';

export type PageId =
  | 'home'
  | 'generator-skin'
  | 'generator-texture'
  | 'generator-addon'
  | 'generator-structure'
  | 'generator-world'
  | 'install-guide'
  | 'creations'
  | 'settings'
  | 'about'
  | 'terms'
  | 'privacy';

interface NavbarProps {
  currentPage: PageId;
  onNavigate: (page: PageId) => void;
  creationsCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentPage,
  onNavigate,
  creationsCount,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [genDropdownOpen, setGenDropdownOpen] = useState(false);

  const handleNav = (page: PageId) => {
    onNavigate(page);
    setMobileMenuOpen(false);
    setGenDropdownOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const isGeneratorPage = currentPage.startsWith('generator-');

  return (
    <header className="sticky top-0 z-40 bg-[#090e1a]/95 backdrop-blur border-b border-slate-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Brand / Logo */}
        <button
          onClick={() => handleNav('home')}
          className="flex items-center gap-2.5 group cursor-pointer text-left"
        >
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-emerald-400 to-emerald-600 p-1 flex items-center justify-center shadow-lg shadow-emerald-500/20 group-hover:scale-105 transition-transform border border-emerald-300/40">
            <div className="w-full h-full bg-[#0a121e] rounded flex items-center justify-center">
              <span className="font-pixel text-[13px] text-emerald-400">MC</span>
            </div>
          </div>

          <div>
            <div className="font-pixel text-sm sm:text-base text-white tracking-wider flex items-center gap-1.5">
              <span>{SITE_NAME}</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-sans font-medium hidden sm:inline-block">
                Bedrock
              </span>
            </div>
            <div className="text-[10px] text-slate-400 hidden xs:block -mt-0.5">
              Free AI Add-on Studio
            </div>
          </div>
        </button>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-1 text-xs font-semibold">
          <button
            onClick={() => handleNav('home')}
            className={`px-3 py-2 rounded-lg transition ${
              currentPage === 'home'
                ? 'bg-slate-800 text-emerald-400 font-bold'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            Home
          </button>

          {/* Generators Dropdown Menu */}
          <div className="relative">
            <button
              onClick={() => setGenDropdownOpen(!genDropdownOpen)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg transition ${
                isGeneratorPage
                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-bold'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              <span>Studio Generators</span>
              <ChevronDown className="w-3.5 h-3.5 opacity-70" />
            </button>

            {genDropdownOpen && (
              <div
                onMouseLeave={() => setGenDropdownOpen(false)}
                className="absolute top-full left-0 mt-1 w-60 bg-[#0e1627] border border-slate-700 rounded-xl shadow-2xl p-1.5 space-y-1 animate-in fade-in z-50"
              >
                <button
                  onClick={() => handleNav('generator-skin')}
                  className={`w-full text-left px-3 py-2 rounded-lg flex items-center gap-2.5 transition ${
                    currentPage === 'generator-skin' ? 'bg-emerald-500/20 text-emerald-300' : 'text-slate-200 hover:bg-slate-800'
                  }`}
                >
                  <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
                  <div className="text-xs">
                    <div className="font-bold">Skin Pack</div>
                    <div className="text-[10px] text-slate-400">3D Preview • .mcpack</div>
                  </div>
                </button>

                <button
                  onClick={() => handleNav('generator-texture')}
                  className={`w-full text-left px-3 py-2 rounded-lg flex items-center gap-2.5 transition ${
                    currentPage === 'generator-texture' ? 'bg-emerald-500/20 text-emerald-300' : 'text-slate-200 hover:bg-slate-800'
                  }`}
                >
                  <Palette className="w-4 h-4 text-cyan-400 shrink-0" />
                  <div className="text-xs">
                    <div className="font-bold">Texture Pack</div>
                    <div className="text-[10px] text-slate-400">16x/32x/64x • .mcpack</div>
                  </div>
                </button>

                <button
                  onClick={() => handleNav('generator-addon')}
                  className={`w-full text-left px-3 py-2 rounded-lg flex items-center gap-2.5 transition ${
                    currentPage === 'generator-addon' ? 'bg-emerald-500/20 text-emerald-300' : 'text-slate-200 hover:bg-slate-800'
                  }`}
                >
                  <Layers className="w-4 h-4 text-purple-400 shrink-0" />
                  <div className="text-xs">
                    <div className="font-bold">Add-on (BP & RP)</div>
                    <div className="text-[10px] text-slate-400">Mobs, Items, Scripts • .mcaddon</div>
                  </div>
                </button>

                <button
                  onClick={() => handleNav('generator-structure')}
                  className={`w-full text-left px-3 py-2 rounded-lg flex items-center gap-2.5 transition ${
                    currentPage === 'generator-structure' ? 'bg-emerald-500/20 text-emerald-300' : 'text-slate-200 hover:bg-slate-800'
                  }`}
                >
                  <Box className="w-4 h-4 text-amber-400 shrink-0" />
                  <div className="text-xs">
                    <div className="font-bold">Structure / Build</div>
                    <div className="text-[10px] text-slate-400">3D Voxels • .mcstructure</div>
                  </div>
                </button>

                <button
                  onClick={() => handleNav('generator-world')}
                  className={`w-full text-left px-3 py-2 rounded-lg flex items-center gap-2.5 transition ${
                    currentPage === 'generator-world' ? 'bg-emerald-500/20 text-emerald-300' : 'text-slate-200 hover:bg-slate-800'
                  }`}
                >
                  <Globe className="w-4 h-4 text-emerald-400 shrink-0" />
                  <div className="text-xs">
                    <div className="font-bold">World Builder</div>
                    <div className="text-[10px] text-slate-400">Spawn Hubs & Presets</div>
                  </div>
                </button>
              </div>
            )}
          </div>

          <button
            onClick={() => handleNav('install-guide')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg transition ${
              currentPage === 'install-guide'
                ? 'bg-slate-800 text-emerald-400 font-bold'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Install Guide</span>
          </button>

          <button
            onClick={() => handleNav('creations')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg transition ${
              currentPage === 'creations'
                ? 'bg-slate-800 text-emerald-400 font-bold'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <FolderArchive className="w-3.5 h-3.5" />
            <span>My Creations</span>
            {creationsCount > 0 && (
              <span className="w-4 h-4 rounded-full bg-emerald-500 text-slate-950 text-[10px] font-bold flex items-center justify-center">
                {creationsCount}
              </span>
            )}
          </button>

          <button
            onClick={() => handleNav('settings')}
            className={`p-2 rounded-lg transition ${
              currentPage === 'settings'
                ? 'bg-slate-800 text-emerald-400'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
            title="Settings"
          >
            <Settings className="w-4 h-4" />
          </button>
        </nav>

        {/* Right side: PWA Install + Mobile Hamburger */}
        <div className="flex items-center gap-2">
          <PWAInstallButton />

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-xl bg-slate-800/80 text-slate-300 hover:text-white border border-slate-700/60"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-slate-800 bg-[#0d1424] px-4 pt-2 pb-6 space-y-1 animate-in slide-in-from-top duration-150 shadow-2xl">
          <button
            onClick={() => handleNav('home')}
            className={`w-full text-left px-3.5 py-2.5 rounded-xl text-sm font-semibold flex items-center justify-between ${
              currentPage === 'home' ? 'bg-slate-800 text-emerald-400' : 'text-slate-200'
            }`}
          >
            <span>Home</span>
          </button>

          <div className="pt-2 pb-1 text-[11px] font-bold uppercase tracking-wider text-slate-500 px-3">
            Studio Generators
          </div>

          <button
            onClick={() => handleNav('generator-skin')}
            className={`w-full text-left px-3.5 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2.5 ${
              currentPage === 'generator-skin'
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                : 'text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <div className="flex-1">Skin Pack Generator</div>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500 text-slate-950 font-bold">
              3D
            </span>
          </button>

          <button
            onClick={() => handleNav('generator-texture')}
            className={`w-full text-left px-3.5 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2.5 ${
              currentPage === 'generator-texture'
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                : 'text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Palette className="w-4 h-4 text-cyan-400" />
            <div className="flex-1">Texture Pack Generator</div>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-400 font-bold">
              RP
            </span>
          </button>

          <button
            onClick={() => handleNav('generator-addon')}
            className={`w-full text-left px-3.5 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2.5 ${
              currentPage === 'generator-addon'
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                : 'text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Layers className="w-4 h-4 text-purple-400" />
            <div className="flex-1">Add-on Generator (BP & RP)</div>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-400 font-bold">
              BP+RP
            </span>
          </button>

          <button
            onClick={() => handleNav('generator-structure')}
            className={`w-full text-left px-3.5 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2.5 ${
              currentPage === 'generator-structure'
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                : 'text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Box className="w-4 h-4 text-amber-400" />
            <div className="flex-1">Structure / Build Generator</div>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 font-bold">
              NBT
            </span>
          </button>

          <button
            onClick={() => handleNav('generator-world')}
            className={`w-full text-left px-3.5 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2.5 ${
              currentPage === 'generator-world'
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                : 'text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Globe className="w-4 h-4 text-emerald-400" />
            <div className="flex-1">World Builder Pack</div>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold">
              Hubs
            </span>
          </button>

          <div className="pt-2 pb-1 text-[11px] font-bold uppercase tracking-wider text-slate-500 px-3">
            Utilities
          </div>

          <button
            onClick={() => handleNav('install-guide')}
            className={`w-full text-left px-3.5 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2.5 ${
              currentPage === 'install-guide' ? 'bg-slate-800 text-emerald-400' : 'text-slate-200'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>How to Install (.mcpack)</span>
          </button>

          <button
            onClick={() => handleNav('creations')}
            className={`w-full text-left px-3.5 py-2.5 rounded-xl text-sm font-semibold flex items-center justify-between ${
              currentPage === 'creations' ? 'bg-slate-800 text-emerald-400' : 'text-slate-200'
            }`}
          >
            <span className="flex items-center gap-2.5">
              <FolderArchive className="w-4 h-4" />
              My Creations
            </span>
            {creationsCount > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-emerald-500 text-slate-950 text-xs font-bold">
                {creationsCount}
              </span>
            )}
          </button>

          <button
            onClick={() => handleNav('settings')}
            className={`w-full text-left px-3.5 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2.5 ${
              currentPage === 'settings' ? 'bg-slate-800 text-emerald-400' : 'text-slate-200'
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>Settings</span>
          </button>

          <button
            onClick={() => handleNav('about')}
            className={`w-full text-left px-3.5 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2.5 ${
              currentPage === 'about' ? 'bg-slate-800 text-emerald-400' : 'text-slate-200'
            }`}
          >
            <Info className="w-4 h-4" />
            <span>About mc-generator</span>
          </button>
        </div>
      )}
    </header>
  );
};
