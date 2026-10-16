import React from 'react';
import { UserSettings, CREATOR_NAME, CREATOR_YOUTUBE_URL } from '../config';
import { Settings, Shield, ExternalLink, Youtube, Info, Check } from 'lucide-react';

interface SettingsPageProps {
  settings: UserSettings;
  onUpdateSettings: (newSettings: Partial<UserSettings>) => void;
  onClearHistory: () => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({
  settings,
  onUpdateSettings,
  onClearHistory,
}) => {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* Title */}
      <div className="border-b border-slate-800 pb-5">
        <div className="flex items-center gap-2 text-xs text-emerald-400 font-semibold uppercase tracking-wider">
          <Settings className="w-4 h-4" />
          <span>Application Settings</span>
        </div>
        <h1 className="font-pixel text-lg sm:text-2xl text-white mt-1">
          SETTINGS & PREFERENCES
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Customize your export preferences and local storage options. No account required.
        </p>
      </div>

      <div className="space-y-6">
        {/* Creator Credit Setting */}
        <div className="rounded-2xl bg-[#0e1627] border border-slate-800 p-6 space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <div className="font-bold text-white text-sm flex items-center gap-2">
                <span>Include creator credit in generated files</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-mono">
                  Default ON
                </span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed max-w-lg">
                Adds a small respectful author credit to the generated <code className="text-slate-300">manifest.json</code> and <code className="text-slate-300">texts/en_US.lang</code> ("Created with mc-generator by {CREATOR_NAME}"). There is absolutely no penalty or feature limitation if you turn this off!
              </p>
            </div>

            <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-1">
              <input
                type="checkbox"
                checked={settings.includeCreatorCredit}
                onChange={(e) => onUpdateSettings({ includeCreatorCredit: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
            </label>
          </div>
        </div>

        {/* Local Storage History Setting */}
        <div className="rounded-2xl bg-[#0e1627] border border-slate-800 p-6 space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <div className="font-bold text-white text-sm">
                Auto-save creations to local device history
              </div>
              <p className="text-xs text-slate-400 leading-relaxed max-w-lg">
                Stores your generated skin packs and add-ons in browser localStorage so you can easily re-download them from "My Creations" anytime.
              </p>
            </div>

            <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-1">
              <input
                type="checkbox"
                checked={settings.autoSaveHistory}
                onChange={(e) => onUpdateSettings({ autoSaveHistory: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
            </label>
          </div>

          <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
            <span className="text-xs text-slate-400">Clear local history data</span>
            <button
              onClick={() => {
                if (window.confirm('Delete all saved local creations?')) {
                  onClearHistory();
                  alert('Local history cleared.');
                }
              }}
              className="px-3.5 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 text-xs font-semibold transition"
            >
              Clear Storage
            </button>
          </div>
        </div>

        {/* About Creator Card */}
        <div className="rounded-2xl bg-[#0e1627] border border-slate-800 p-6 space-y-3">
          <h4 className="text-sm font-bold text-white flex items-center gap-2">
            <Youtube className="w-4 h-4 text-red-500" />
            <span>Creator Information</span>
          </h4>
          <p className="text-xs text-slate-400 leading-relaxed">
            mc-generator was designed and built by <strong>{CREATOR_NAME}</strong> to give Minecraft Bedrock players high-quality, free creation tools without paywalls or restrictive app store subscriptions.
          </p>
          <div className="pt-2">
            <a
              href={CREATOR_YOUTUBE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold transition shadow-md"
            >
              <Youtube className="w-4 h-4" />
              <span>Subscribe on YouTube (@kairox47)</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
