import React from 'react';
import { ExternalLink, Youtube, Heart } from 'lucide-react';
import { CREATOR_NAME, CREATOR_YOUTUBE_URL } from '../config';

export const CreatorCard: React.FC = () => {
  return (
    <div className="w-full max-w-4xl mx-auto my-10 p-5 sm:p-6 rounded-2xl bg-gradient-to-r from-[#111c2e] via-[#16243b] to-[#111c2e] border border-emerald-500/30 shadow-xl relative overflow-hidden">
      {/* Decorative accent glow */}
      <div className="absolute -top-12 -right-12 w-36 h-36 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

      <div className="flex flex-col sm:flex-row items-center justify-between gap-5 relative z-10">
        <div className="flex items-center gap-4 text-center sm:text-left">
          <div className="w-14 h-14 rounded-2xl bg-red-600/15 border border-red-500/30 flex items-center justify-center text-red-500 shrink-0 shadow-inner">
            <Youtube className="w-8 h-8" />
          </div>

          <div>
            <div className="flex items-center justify-center sm:justify-start gap-1.5 text-xs text-emerald-400 font-semibold tracking-wide uppercase">
              <Heart className="w-3.5 h-3.5 fill-emerald-400" />
              Creator Spotlight
            </div>
            <h4 className="text-base sm:text-lg font-bold text-white mt-0.5">
              Enjoying mc-generator? Subscribe to {CREATOR_NAME} on YouTube!
            </h4>
            <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-xl leading-relaxed">
              mc-generator is built and maintained free of charge. Show your support and follow tutorials, add-on showcases, and game dev tips on YouTube.
            </p>
          </div>
        </div>

        <div className="shrink-0">
          <a
            href={CREATOR_YOUTUBE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-5 py-3 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-sm shadow-lg shadow-red-600/25 transition active:scale-95"
          >
            <Youtube className="w-4 h-4" />
            <span>Visit channel</span>
            <ExternalLink className="w-3.5 h-3.5 opacity-80" />
          </a>
        </div>
      </div>
    </div>
  );
};
