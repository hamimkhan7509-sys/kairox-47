import React from 'react';
import { SavedCreation } from '../types';
import { FolderArchive, Download, Trash2, Sparkles, Clock, ExternalLink } from 'lucide-react';
import { PageId } from '../components/Navbar';

interface MyCreationsPageProps {
  creations: SavedCreation[];
  onDeleteCreation: (id: string) => void;
  onClearAll: () => void;
  onNavigate: (page: PageId) => void;
}

export const MyCreationsPage: React.FC<MyCreationsPageProps> = ({
  creations,
  onDeleteCreation,
  onClearAll,
  onNavigate,
}) => {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs text-emerald-400 font-semibold uppercase tracking-wider">
            <FolderArchive className="w-4 h-4" />
            <span>Local Device Storage</span>
          </div>
          <h1 className="font-pixel text-lg sm:text-2xl text-white mt-1">
            MY CREATIONS ({creations.length})
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Packs and skins generated on this device. Saved automatically in browser memory without requiring an account.
          </p>
        </div>

        {creations.length > 0 && (
          <button
            onClick={() => {
              if (window.confirm('Are you sure you want to clear your local creation history?')) {
                onClearAll();
              }
            }}
            className="px-3.5 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 text-xs font-semibold transition self-start sm:self-auto cursor-pointer"
          >
            Clear History
          </button>
        )}
      </div>

      {/* Creations Grid */}
      {creations.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-800 p-12 text-center bg-[#0c1220]/50 space-y-4">
          <Sparkles className="w-10 h-10 text-slate-600 mx-auto" />
          <h3 className="text-base font-bold text-slate-300">No creations saved yet</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Generate your first Bedrock skin pack, texture pack, or add-on. It will appear here for instant re-download anytime.
          </p>
          <button
            onClick={() => onNavigate('generator-skin')}
            className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold shadow-lg shadow-emerald-500/20 transition cursor-pointer"
          >
            Open Skin Generator
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {creations.map((item) => (
            <div
              key={item.id}
              className="rounded-2xl bg-[#0e1627] border border-slate-800 p-5 flex flex-col justify-between hover:border-slate-700 transition shadow-xl"
            >
              <div>
                <div className="flex items-start gap-3.5 mb-3">
                  {item.previewUrl ? (
                    <img
                      src={item.previewUrl}
                      alt={item.title}
                      className="w-14 h-14 rounded-xl bg-[#080d18] object-cover shrink-0 border border-slate-700 shadow-md"
                      style={{ imageRendering: 'pixelated' }}
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/30">
                      <Sparkles className="w-6 h-6" />
                    </div>
                  )}

                  <div className="min-w-0 flex-1">
                    <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-slate-800 text-emerald-400 font-semibold">
                      {item.type.replace('_', ' ')}
                    </span>
                    <h4 className="text-sm font-bold text-white mt-1 truncate">
                      {item.title}
                    </h4>
                    <div className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                      <Clock className="w-3 h-3" />
                      <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                <p className="text-xs text-slate-400 line-clamp-2 mb-4 leading-relaxed">
                  {item.description}
                </p>
              </div>

              <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between">
                <span className="text-[11px] font-mono text-slate-500 truncate max-w-[150px]">
                  {item.fileName}
                </span>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => onDeleteCreation(item.id)}
                    className="p-2 rounded-lg bg-slate-800/80 hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition"
                    title="Delete from history"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
