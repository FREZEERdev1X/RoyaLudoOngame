import React, { useEffect } from 'react';
import { GamePlayer, PlayerColor } from '../types/game';
import { Language, translations } from '../i18n/translations';
import { sound } from '../utils/soundEngine';
import confetti from 'canvas-confetti';
import { Trophy, Crown, Coins, Sparkles, RotateCcw, Home, Star } from 'lucide-react';

interface WinCelebrationModalProps {
  winners: string[]; // List of winner player IDs in order of finish
  players: GamePlayer[];
  myPlayerId: string;
  betAmount: number;
  lang: Language;
  onPlayAgain: () => void;
  onReturnToLobby: () => void;
}

export const WinCelebrationModal: React.FC<WinCelebrationModalProps> = ({
  winners,
  players,
  myPlayerId,
  betAmount,
  lang,
  onPlayAgain,
  onReturnToLobby,
}) => {
  const t = translations[lang];

  useEffect(() => {
    sound.playVictory();
    // Confetti cannon
    const end = Date.now() + 3 * 1000;
    const interval: any = setInterval(() => {
      if (Date.now() > end) {
        return clearInterval(interval);
      }
      confetti({
        startVelocity: 30,
        spread: 360,
        ticks: 60,
        origin: { x: Math.random(), y: Math.random() - 0.2 },
      });
    }, 300);

    return () => clearInterval(interval);
  }, []);

  const winnerPlayer = players.find((p) => p.id === winners[0]) || players[0];
  const isMeWinner = winnerPlayer?.id === myPlayerId;
  const totalPrizePool = betAmount * players.length;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-lg flex items-center justify-center p-4 animate-in zoom-in-95 duration-300">
      <div className="bg-slate-900 border-2 border-amber-500/50 rounded-3xl w-full max-w-lg p-6 flex flex-col items-center text-center shadow-[0_0_50px_rgba(245,158,11,0.3)] relative text-white">
        
        {/* Giant Trophy Icon */}
        <div className="relative my-2">
          <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-amber-500 via-yellow-400 to-amber-300 flex items-center justify-center text-slate-950 shadow-[0_0_30px_rgba(251,191,36,0.6)]">
            <Trophy size={48} className="stroke-[2.5]" />
          </div>
          <Crown size={32} className="absolute -top-3 left-1/2 -translate-x-1/2 text-yellow-300 fill-yellow-400 animate-bounce" />
        </div>

        {/* Winner Title */}
        <h2 className="text-2xl sm:text-3xl font-black text-amber-300 mt-3">
          {isMeWinner ? '🏆 مبارك! أنت بطل اللودو الملكي!' : `🏆 الفائز: ${winnerPlayer?.name}`}
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          {isMeWinner
            ? 'لقد سيطرت على الرقعة وأوصلت جميع قطعك إلى خط النهاية بنجاح!'
            : 'مباراة حماسية رائعة، حظاً أوفر في الجولة القادمة!'}
        </p>

        {/* Prize Pool Award Box */}
        <div className="w-full bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 my-5 flex items-center justify-around">
          <div className="text-center">
            <div className="text-[11px] text-slate-400 font-bold mb-1">الجائزة المالية الكبرى</div>
            <div className="flex items-center justify-center gap-1.5 text-amber-400 font-black text-xl">
              <Coins size={22} className="stroke-[2.5]" />
              <span>+{totalPrizePool.toLocaleString()} ذهب</span>
            </div>
          </div>
          <div className="h-8 border-r border-slate-700"></div>
          <div className="text-center">
            <div className="text-[11px] text-slate-400 font-bold mb-1">نقاط الخبرة XP</div>
            <div className="flex items-center justify-center gap-1 text-emerald-400 font-black text-xl">
              <Star size={20} className="fill-emerald-400" />
              <span>+350 XP</span>
            </div>
          </div>
        </div>

        {/* Final Standings List */}
        <div className="w-full space-y-2 mb-6 text-start">
          <div className="text-[11px] font-bold text-slate-400 px-1">الترتيب النهائي للجولة:</div>
          {players.map((p, idx) => {
            const isFirst = p.id === winners[0];
            const finishedPawns = p.pawns.filter((pos) => pos === 200).length;

            return (
              <div
                key={p.id}
                className={`flex items-center justify-between p-2.5 rounded-xl border ${
                  isFirst
                    ? 'bg-amber-500/20 border-amber-400 shadow-md font-bold text-amber-300'
                    : 'bg-slate-800/60 border-slate-700 text-slate-300'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className="w-5 text-center font-black text-xs">
                    {isFirst ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : '4️⃣'}
                  </span>
                  <img src={p.avatar} alt="" className="w-7 h-7 rounded-full bg-slate-700 object-cover" />
                  <span className="text-xs">{p.name}</span>
                </div>
                <div className="text-[11px] font-semibold">
                  {finishedPawns}/4 قطع وصلت
                </div>
              </div>
            );
          })}
        </div>

        {/* Action Buttons */}
        <div className="w-full flex gap-3">
          <button
            onClick={() => {
              sound.playClick();
              onReturnToLobby();
            }}
            className="flex-1 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all active:scale-95"
          >
            <Home size={16} />
            <span>{t.returnToLobby}</span>
          </button>

          <button
            onClick={() => {
              sound.playClick();
              onPlayAgain();
            }}
            className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black text-xs sm:text-sm flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg"
          >
            <RotateCcw size={16} />
            <span>{t.playAgain}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
