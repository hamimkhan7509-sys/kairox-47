import React from 'react';
import { CREATOR_NAME, CREATOR_YOUTUBE_URL, LEGAL_DISCLAIMER, SITE_NAME } from '../config';
import { Youtube, ExternalLink, ShieldCheck, Heart, Sparkles, Terminal } from 'lucide-react';

export const AboutPage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-10">
      {/* Title */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-semibold border border-emerald-500/30">
          <Sparkles className="w-3.5 h-3.5" />
          <span>About mc-generator</span>
        </div>
        <h1 className="font-pixel text-lg sm:text-2xl text-white">
          THE FREE BEDROCK AI STUDIO
        </h1>
        <p className="text-slate-400 text-xs sm:text-sm max-w-xl mx-auto">
          Built for Minecraft Bedrock creators on mobile, tablet, and PC.
        </p>
      </div>

      <div className="space-y-6">
        {/* Mission Statement */}
        <div className="rounded-2xl bg-[#0e1627] border border-slate-800 p-6 sm:p-8 space-y-4">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-emerald-400" />
            <span>Why mc-generator was built</span>
          </h3>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            Most Minecraft add-on apps on Google Play and Apple App Store are filled with aggressive subscription paywalls, intrusive full-screen popups, and fake coins. <strong>mc-generator</strong> was created as a modern, completely free, web-based alternative that works right in your browser on phone or PC.
          </p>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            There are <strong>no subscriptions, no forced accounts, and no artificial daily generation limits</strong>. Every download produces genuine, uncorrupted <code className="text-emerald-400">.mcpack</code> and <code className="text-emerald-400">.mcaddon</code> archives featuring valid UUIDs, schemas, and original textures.
          </p>
        </div>

        {/* Creator Section */}
        <div className="rounded-2xl bg-gradient-to-br from-[#121c2e] via-[#16233b] to-[#121c2e] border border-emerald-500/40 p-6 sm:p-8 space-y-4 shadow-xl">
          <div className="flex items-center gap-2 text-xs text-emerald-400 font-bold uppercase tracking-wider">
            <Heart className="w-4 h-4 fill-emerald-400" />
            <span>About the Creator</span>
          </div>

          <h3 className="text-lg sm:text-xl font-bold text-white">
            Created by {CREATOR_NAME}
          </h3>

          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            <strong>{CREATOR_NAME}</strong> is a content creator, programmer, and Minecraft Bedrock enthusiast creating tutorials, add-ons, and gaming development showcases.
          </p>

          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            If you enjoy using mc-generator to make skin packs and add-ons for your worlds, please consider subscribing to the official YouTube channel! It's completely optional, but directly helps keep the server online and free for everyone.
          </p>

          <div className="pt-2">
            <a
              href={CREATOR_YOUTUBE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-sm shadow-lg shadow-red-600/30 transition active:scale-95"
            >
              <Youtube className="w-5 h-5" />
              <span>Visit Kairox 47 on YouTube</span>
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </div>

        {/* Tech Stack */}
        <div className="rounded-2xl bg-[#0e1627] border border-slate-800 p-6 sm:p-8 space-y-4">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Terminal className="w-5 h-5 text-emerald-400" />
            <span>Technical Architecture</span>
          </h3>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-300">
            <li className="p-3 rounded-xl bg-[#121c30] border border-slate-700/50">
              <strong className="text-white block mb-0.5">Google Gemini AI:</strong>
              Server-side structured generation with <code className="text-emerald-400">gemini-3.8-flash</code> via @google/genai SDK.
            </li>
            <li className="p-3 rounded-xl bg-[#121c30] border border-slate-700/50">
              <strong className="text-white block mb-0.5">3D WebGL Engine:</strong>
              Three.js PBR renderer with real-time Steve/Alex humanoid UV coordinates and 3D limb animation.
            </li>
            <li className="p-3 rounded-xl bg-[#121c30] border border-slate-700/50">
              <strong className="text-white block mb-0.5">Native Zip Packaging:</strong>
              JSZip generates standards-compliant <code className="text-emerald-400">.mcpack</code> containers with RFC4122 v4 UUIDs.
            </li>
            <li className="p-3 rounded-xl bg-[#121c30] border border-slate-700/50">
              <strong className="text-white block mb-0.5">PWA Enabled:</strong>
              Installable Progressive Web App for home screen launching on Android, iOS Safari, and Windows.
            </li>
          </ul>
        </div>

        {/* Legal Disclaimer */}
        <div className="rounded-2xl bg-[#0e1627] border border-slate-800 p-6 text-xs text-slate-400 space-y-2">
          <div className="flex items-center gap-2 text-slate-200 font-bold">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Legal Disclaimer</span>
          </div>
          <p className="leading-relaxed">
            {LEGAL_DISCLAIMER}
          </p>
          <p className="leading-relaxed text-[11px] text-slate-500">
            Minecraft is a registered trademark of Mojang Synergies AB / Microsoft Corporation. mc-generator does not distribute or reproduce Mojang's proprietary code, textures, or assets. All generated pixel art and configurations are created procedurally.
          </p>
        </div>
      </div>
    </div>
  );
};
