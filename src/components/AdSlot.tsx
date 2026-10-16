import React, { useState, useEffect } from 'react';
import { Download, X, ShieldCheck, Sparkles } from 'lucide-react';
import { CREATOR_NAME, CREATOR_YOUTUBE_URL } from '../config';

interface AdSlotProps {
  fileName: string;
  fileSizeStr?: string;
  onConfirmDownload: () => void;
  onCancel: () => void;
}

export const AdSlot: React.FC<AdSlotProps> = ({
  fileName,
  fileSizeStr,
  onConfirmDownload,
  onCancel,
}) => {
  const [countdown, setCountdown] = useState<number>(5);

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => {
      setCountdown((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  const canProceed = countdown === 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-[#0e1627] border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Top Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-800 bg-[#121c30]">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <h3 className="font-bold text-white text-sm">Download Ready</h3>
          </div>

          {canProceed ? (
            <button
              onClick={onCancel}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
              title="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          ) : (
            <div className="text-xs font-mono text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
              Ready in {countdown}s
            </div>
          )}
        </div>

        {/* Content Body */}
        <div className="p-6 flex flex-col items-center text-center">
          {/* File Card Info */}
          <div className="w-full bg-[#141f33] border border-slate-700/60 rounded-xl p-4 mb-5 flex items-center gap-3 text-left">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center shrink-0 text-emerald-400">
              <Download className="w-6 h-6" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="font-bold text-white text-sm truncate">{fileName}</div>
              <div className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                <span className="px-1.5 py-0.2 rounded bg-slate-800 text-emerald-400 font-mono text-[10px]">
                  Bedrock Add-on
                </span>
                {fileSizeStr && <span>{fileSizeStr}</span>}
              </div>
            </div>
          </div>

          {/* AdSense Placement Container (Transparent & Clean) */}
          <div className="w-full min-h-[160px] max-h-[220px] bg-[#090e18] border-2 border-dashed border-slate-700/80 rounded-xl p-4 flex flex-col items-center justify-center relative overflow-hidden mb-5">
            <div className="text-[10px] uppercase font-mono tracking-wider text-slate-500 absolute top-2 right-2">
              Advertisement Space
            </div>

            {/* This div is ready for Google AdSense script integration */}
            <div id="google-adsense-slot" className="w-full flex flex-col items-center justify-center py-4">
              <Sparkles className="w-6 h-6 text-emerald-400/50 mb-2" />
              <p className="text-xs text-slate-400 max-w-xs leading-relaxed">
                Thank you for supporting <strong className="text-slate-200">mc-generator</strong>! Ad revenue keeps this service 100% free with no subscriptions.
              </p>
            </div>
          </div>

          {/* Countdown / Download Buttons */}
          <div className="w-full flex flex-col sm:flex-row items-center gap-2.5">
            {canProceed ? (
              <>
                <button
                  onClick={onConfirmDownload}
                  className="w-full sm:flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm shadow-lg shadow-emerald-500/25 transition active:scale-98 cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  Download .mcpack
                </button>
                <button
                  onClick={onCancel}
                  className="w-full sm:w-auto px-4 py-3 rounded-xl border border-slate-700 hover:bg-slate-800 text-slate-300 text-sm font-medium transition cursor-pointer"
                >
                  Skip & Close
                </button>
              </>
            ) : (
              <button
                disabled
                className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-slate-800 text-slate-400 font-medium text-sm cursor-not-allowed border border-slate-700"
              >
                <span className="w-4 h-4 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
                Download button opens in {countdown}s...
              </button>
            )}
          </div>

          {/* Security & Honest note */}
          <div className="mt-4 flex items-center justify-center gap-1.5 text-[11px] text-slate-400">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Genuine Bedrock file • Virus-free • Direct install</span>
          </div>

          {/* Creator Credit requirement */}
          <div className="mt-3 pt-3 border-t border-slate-800/80 w-full text-center text-xs text-slate-400">
            Made with mc-generator by{' '}
            <a
              href={CREATOR_YOUTUBE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="text-emerald-400 hover:underline font-semibold"
            >
              {CREATOR_NAME}
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
