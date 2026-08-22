import React, { useEffect, useState } from 'react';
import { Sparkles, Crown, Code2, X } from 'lucide-react';

interface CreatorCreditToastProps {
  duration?: number; // duration in milliseconds (default 7000ms = 7s)
  onComplete?: () => void;
}

export const CreatorCreditToast: React.FC<CreatorCreditToastProps> = ({
  duration = 7000,
  onComplete,
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const [progress, setProgress] = useState(100); // 100% down to 0%
  const [remainingSeconds, setRemainingSeconds] = useState((duration / 1000).toFixed(1));

  useEffect(() => {
    const startTime = performance.now();
    const intervalMs = 25; // update every 25ms for smooth animation

    const timer = setInterval(() => {
      const elapsed = performance.now() - startTime;
      const left = Math.max(0, duration - elapsed);
      const percent = Math.max(0, (left / duration) * 100);
      
      setProgress(percent);
      setRemainingSeconds((left / 1000).toFixed(1));

      if (left <= 0) {
        clearInterval(timer);
        setIsVisible(false);
        if (onComplete) onComplete();
      }
    }, intervalMs);

    return () => clearInterval(timer);
  }, [duration, onComplete]);

  if (!isVisible) return null;

  return (
    <div
      id="creator-credit-intro"
      className="fixed top-5 left-1/2 -translate-x-1/2 z-[9999] w-[92%] max-w-md animate-in fade-in slide-in-from-top-4 duration-300 pointer-events-auto"
      style={{ direction: 'rtl' }}
    >
      <div className="relative overflow-hidden bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border-2 border-amber-500/80 rounded-3xl p-4 sm:p-5 shadow-[0_10px_35px_rgba(245,158,11,0.35)] backdrop-blur-2xl text-white">
        
        {/* Glow Ambient Effect */}
        <div className="absolute -top-12 -right-12 w-28 h-28 bg-amber-500/20 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-12 -left-12 w-28 h-28 bg-amber-400/20 rounded-full blur-2xl pointer-events-none" />

        <div className="relative flex items-center justify-between gap-3">
          {/* Avatar / Icon Badge */}
          <div className="relative flex-shrink-0">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600 p-0.5 shadow-lg shadow-amber-500/30 flex items-center justify-center">
              <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center text-amber-400">
                <Crown size={22} className="animate-pulse" />
              </div>
            </div>
            <span className="absolute -bottom-1 -right-1 flex h-4 w-4">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-4 w-4 bg-amber-500 border border-slate-900 items-center justify-center text-[8px]">
                ✨
              </span>
            </span>
          </div>

          {/* Content Details */}
          <div className="flex-1 text-right">
            <div className="flex items-center gap-1.5 text-amber-400 text-xs font-bold mb-0.5">
              <Code2 size={14} />
              <span>مطور اللعبة</span>
              <span className="bg-amber-500/20 border border-amber-400/40 text-amber-300 text-[10px] px-2 py-0.2 rounded-full font-black mr-auto">
                {remainingSeconds} ثانية
              </span>
            </div>

            <h3 className="text-base sm:text-lg font-black text-white tracking-wide flex items-center gap-1.5 drop-shadow-sm">
              <span>تم صنع اللعبة بواسطة</span>
              <span className="text-amber-300 underline decoration-amber-400/50 underline-offset-4 font-black">
                حمدي محمد
              </span>
            </h3>

            <p className="text-[11px] text-slate-300/85 mt-0.5">
              نتمنى لك تجربة لعب ممتعة وحماسية في لودو رويال! 👑🎲
            </p>
          </div>

          {/* Close Button */}
          <button
            onClick={() => {
              setIsVisible(false);
              if (onComplete) onComplete();
            }}
            className="flex-shrink-0 w-7 h-7 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors border border-slate-700"
            title="إغلاق"
          >
            <X size={14} />
          </button>
        </div>

        {/* Progress Bar Container */}
        <div className="mt-3.5 relative w-full bg-slate-800/90 rounded-full h-2 overflow-hidden border border-slate-700/60 p-[1px]">
          <div
            className="h-full rounded-full bg-gradient-to-r from-amber-500 via-amber-300 to-amber-500 transition-all duration-75 ease-linear shadow-[0_0_10px_rgba(245,158,11,0.6)]"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
};
