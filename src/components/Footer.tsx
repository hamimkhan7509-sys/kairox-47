import React from 'react';
import { CREATOR_NAME, CREATOR_YOUTUBE_URL, LEGAL_DISCLAIMER, SITE_NAME } from '../config';
import { PageId } from './Navbar';
import { Youtube, Shield, ExternalLink, Heart } from 'lucide-react';

interface FooterProps {
  onNavigate: (page: PageId) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  return (
    <footer className="mt-20 border-t border-slate-800/80 bg-[#070b14] text-slate-400 text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
          {/* Col 1: Branding & Creator Credit */}
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center gap-2">
              <span className="font-pixel text-sm text-white">{SITE_NAME}</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                Bedrock Free Tools
              </span>
            </div>
            <p className="text-slate-400 text-xs max-w-sm leading-relaxed">
              Create custom Minecraft Bedrock skins, textures, behavior add-ons, and structures using cutting-edge AI. Exports genuine <code className="text-emerald-400">.mcpack</code> and <code className="text-emerald-400">.mcaddon</code> files that open directly in Pocket Edition on Android, iOS, and Windows.
            </p>

            <div className="pt-2 flex items-center gap-2 text-slate-300">
              <Heart className="w-3.5 h-3.5 text-red-500 fill-red-500" />
              <span>Made by</span>
              <a
                href={CREATOR_YOUTUBE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="text-emerald-400 hover:text-emerald-300 font-bold flex items-center gap-1 transition"
              >
                <span>{CREATOR_NAME}</span>
                <ExternalLink className="w-3 h-3" />
              </a>
              <span className="text-slate-600">•</span>
              <a
                href={CREATOR_YOUTUBE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-[11px] bg-red-600/20 text-red-400 hover:bg-red-600/30 px-2 py-0.5 rounded-full border border-red-500/30 transition"
              >
                <Youtube className="w-3 h-3" />
                <span>YouTube Channel</span>
              </a>
            </div>
          </div>

          {/* Col 2: Generators */}
          <div>
            <h4 className="font-bold text-white uppercase tracking-wider text-[11px] mb-3">
              Generators
            </h4>
            <ul className="space-y-2">
              <li>
                <button
                  onClick={() => onNavigate('generator-skin')}
                  className="hover:text-emerald-400 transition cursor-pointer flex items-center gap-1.5"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  <span>Skin Pack (.mcpack)</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('generator-texture')}
                  className="hover:text-slate-200 transition text-slate-500 cursor-pointer"
                >
                  Texture Pack Generator (Phase 2)
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('generator-addon')}
                  className="hover:text-slate-200 transition text-slate-500 cursor-pointer"
                >
                  Add-on Generator BP/RP (Phase 3)
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('generator-structure')}
                  className="hover:text-slate-200 transition text-slate-500 cursor-pointer"
                >
                  Structure Generator (Phase 4)
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('generator-world')}
                  className="hover:text-slate-200 transition text-slate-500 cursor-pointer"
                >
                  World Builder Pack (Phase 5)
                </button>
              </li>
            </ul>
          </div>

          {/* Col 3: Resources & Legal */}
          <div>
            <h4 className="font-bold text-white uppercase tracking-wider text-[11px] mb-3">
              Guides & Legal
            </h4>
            <ul className="space-y-2">
              <li>
                <button
                  onClick={() => onNavigate('install-guide')}
                  className="hover:text-emerald-400 transition cursor-pointer"
                >
                  How to Install .mcpack
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('about')}
                  className="hover:text-emerald-400 transition cursor-pointer"
                >
                  About {CREATOR_NAME} & Project
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('terms')}
                  className="hover:text-emerald-400 transition cursor-pointer"
                >
                  Terms of Service
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('privacy')}
                  className="hover:text-emerald-400 transition cursor-pointer"
                >
                  Privacy Policy
                </button>
              </li>
            </ul>
          </div>
        </div>

        {/* Mandatory Legal & Disclaimer Banner */}
        <div className="pt-6 border-t border-slate-800/80 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-[11px] text-slate-400 text-center md:text-left">
            <Shield className="w-4 h-4 text-emerald-400 shrink-0 hidden sm:inline-block" />
            <span>{LEGAL_DISCLAIMER}</span>
          </div>

          <div className="text-[11px] text-slate-400 text-center">
            &copy; {new Date().getFullYear()} {SITE_NAME} • Completely Free & Unofficial
          </div>
        </div>
      </div>
    </footer>
  );
};
