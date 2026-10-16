import React from 'react';
import { LEGAL_DISCLAIMER, SITE_NAME, CREATOR_NAME, CREATOR_YOUTUBE_URL } from '../config';
import { Shield, Lock, FileText, Mail } from 'lucide-react';

interface LegalPageProps {
  type: 'terms' | 'privacy';
}

export const LegalPage: React.FC<LegalPageProps> = ({ type }) => {
  if (type === 'privacy') {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        <div className="border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2 text-xs text-emerald-400 font-semibold uppercase tracking-wider">
            <Lock className="w-4 h-4" />
            <span>Privacy & Data Protection</span>
          </div>
          <h1 className="font-pixel text-lg sm:text-2xl text-white mt-1">
            PRIVACY POLICY
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Last updated: October 2026
          </p>
        </div>

        <div className="rounded-2xl bg-[#0e1627] border border-slate-800 p-6 sm:p-8 space-y-4 text-xs sm:text-sm text-slate-300 leading-relaxed">
          <h3 className="font-bold text-white text-base">1. No Account or Personal Data Collection</h3>
          <p>
            {SITE_NAME} operates entirely without user accounts, passwords, or personal identity collection. We do not ask for your email address, phone number, real name, or credit card details.
          </p>

          <h3 className="font-bold text-white text-base">2. Local Storage</h3>
          <p>
            Your creations and preferences are stored exclusively on your own device using browser <code className="text-emerald-400">localStorage</code>. This data never leaves your device unless you choose to export it as a file.
          </p>

          <h3 className="font-bold text-white text-base">3. AI Generations & Prompts</h3>
          <p>
            When you enter a character description or click "Improve prompt", the text prompt is sent to Google's Gemini API via a secure backend proxy. We do not store or sell your prompts.
          </p>

          <h3 className="font-bold text-white text-base">4. Advertising</h3>
          <p>
            {SITE_NAME} displays a single clean advertisement slot before downloading files to cover server and API hosting costs. No intrusive trackers or deceptive malware buttons are used.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      <div className="border-b border-slate-800 pb-4">
        <div className="flex items-center gap-2 text-xs text-emerald-400 font-semibold uppercase tracking-wider">
          <FileText className="w-4 h-4" />
          <span>Legal Agreement</span>
        </div>
        <h1 className="font-pixel text-lg sm:text-2xl text-white mt-1">
          TERMS OF SERVICE
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Last updated: October 2026
        </p>
      </div>

      <div className="rounded-2xl bg-[#0e1627] border border-slate-800 p-6 sm:p-8 space-y-4 text-xs sm:text-sm text-slate-300 leading-relaxed">
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs flex items-start gap-2.5">
          <Shield className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{LEGAL_DISCLAIMER}</span>
        </div>

        <h3 className="font-bold text-white text-base">1. Acceptance of Terms</h3>
        <p>
          By accessing and using {SITE_NAME}, you agree to comply with these terms. If you do not agree, please do not use this website.
        </p>

        <h3 className="font-bold text-white text-base">2. User Generated Content & Ownership</h3>
        <p>
          You are free to use, edit, and share the Bedrock packs generated on {SITE_NAME} in your personal Minecraft worlds, multiplayer servers, and gaming videos. You agree not to submit prompts requesting hateful, abusive, illegal, sexually explicit, or infringing content.
        </p>

        <h3 className="font-bold text-white text-base">3. Disclaimer of Warranties</h3>
        <p>
          {SITE_NAME} is provided "as is" without warranty of any kind. While we rigorously test all Bedrock manifest schemas and files for Minecraft compatibility, we cannot guarantee performance across every device or Minecraft version.
        </p>

        <h3 className="font-bold text-white text-base">4. Creator Attribution</h3>
        <p>
          By default, generated pack manifests include a small attribution credit to creator {CREATOR_NAME}. You can toggle this setting off anytime in the Settings menu with zero limitation.
        </p>
      </div>
    </div>
  );
};
