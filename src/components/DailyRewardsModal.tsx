import React from 'react';
import { UserProfile } from '../types/game';
import { Language, translations } from '../i18n/translations';
import { sound } from '../utils/soundEngine';
import confetti from 'canvas-confetti';
import { X, Gift, Coins, Gem, Check, Sparkles, Crown } from 'lucide-react';

interface DailyRewardsModalProps {
  user: UserProfile;
  lang: Language;
  isOpen: boolean;
  onClose: () => void;
  onClaimReward: (day: number, coins: number, gems: number) => void;
}

const STREAK_DAYS = [
  { day: 1, coins: 500, gems: 10, label: 'اليوم 1', isChest: false },
  { day: 2, coins: 1000, gems: 20, label: 'اليوم 2', isChest: false },
  { day: 3, coins: 1500, gems: 35, label: 'اليوم 3', isChest: false },
  { day: 4, coins: 2500, gems: 50, label: 'اليوم 4', isChest: false },
  { day: 5, coins: 4000, gems: 75, label: 'اليوم 5', isChest: false },
  { day: 6, coins: 6000, gems: 100, label: 'اليوم 6', isChest: false },
  { day: 7, coins: 15000, gems: 300, label: 'اليوم 7 (الكنز الملكي)', isChest: true },
];

export const DailyRewardsModal: React.FC<DailyRewardsModalProps> = ({
  user,
  lang,
  isOpen,
  onClose,
  onClaimReward,
}) => {
  const t = translations[lang];

  if (!isOpen) return null;

  const currentStreak = user.loginStreak || 1;
  const todayStr = new Date().toISOString().split('T')[0];
  const canClaimToday = user.lastDailyRewardDate !== todayStr;

  const handleClaim = (dayItem: typeof STREAK_DAYS[0]) => {
    if (!canClaimToday) return;
    sound.playCoins();
    sound.playVictory();
    confetti({
      particleCount: 100,
      spread: 80,
      origin: { y: 0.6 },
    });
    onClaimReward(dayItem.day, dayItem.coins, dayItem.gems);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-rose-500/30 rounded-3xl w-full max-w-2xl p-5 sm:p-6 flex flex-col shadow-2xl relative text-white">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-rose-500 to-pink-500 flex items-center justify-center text-white shadow-lg">
              <Gift size={22} />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black text-white">{t.dailyRewards}</h2>
              <p className="text-xs text-slate-400">
                سجل حضورك يومياً لتحصل على مكافآت تصاعدية وجوائز كبرى!
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              sound.playClick();
              onClose();
            }}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* 7-Day Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-6">
          {STREAK_DAYS.map((item) => {
            const isPassed = item.day < currentStreak;
            const isCurrent = item.day === currentStreak;
            const isFuture = item.day > currentStreak;

            return (
              <div
                key={item.day}
                className={`relative rounded-2xl p-3 sm:p-4 border flex flex-col items-center justify-between text-center transition-all ${
                  item.isChest ? 'col-span-2 sm:col-span-2 bg-gradient-to-br from-amber-500/20 via-yellow-500/10 to-purple-500/20 border-amber-500/50' : ''
                } ${
                  isCurrent
                    ? 'bg-rose-500/15 border-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.3)] ring-2 ring-rose-400'
                    : isPassed
                    ? 'bg-slate-800/40 border-slate-800 opacity-60'
                    : 'bg-slate-800/80 border-slate-700'
                }`}
              >
                {/* Day Header Badge */}
                <div className="w-full flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold text-slate-400">
                    {t.day} {item.day}
                  </span>
                  {isPassed && (
                    <span className="bg-emerald-500 text-slate-950 p-0.5 rounded-full">
                      <Check size={12} className="stroke-[3]" />
                    </span>
                  )}
                  {isCurrent && (
                    <span className="bg-rose-500 text-white text-[9px] font-black px-1.5 py-0.2 rounded-full">
                      اليوم
                    </span>
                  )}
                </div>

                {/* Gift Icon / Chest */}
                <div className="my-2">
                  {item.isChest ? (
                    <div className="relative">
                      <Crown size={38} className="text-amber-400 animate-bounce" />
                      <Sparkles size={16} className="absolute -top-1 -right-1 text-yellow-300 animate-spin" />
                    </div>
                  ) : (
                    <Gift size={30} className={isCurrent ? 'text-rose-400 animate-pulse' : 'text-slate-400'} />
                  )}
                </div>

                {/* Rewards Breakdown */}
                <div className="w-full space-y-1 my-1">
                  <div className="flex items-center justify-center gap-1 text-amber-300 font-bold text-xs">
                    <Coins size={12} />
                    <span>+{item.coins.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-center gap-1 text-emerald-300 font-bold text-xs">
                    <Gem size={12} />
                    <span>+{item.gems.toLocaleString()}</span>
                  </div>
                </div>

                {/* Action / Status */}
                <div className="w-full mt-2">
                  {isPassed ? (
                    <span className="text-[10px] text-emerald-400 font-bold">
                      تم الاستلام ✓
                    </span>
                  ) : isCurrent ? (
                    <button
                      onClick={() => handleClaim(item)}
                      disabled={!canClaimToday}
                      className="w-full py-1.5 rounded-xl bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-400 hover:to-pink-400 disabled:opacity-50 text-white text-xs font-black transition-all shadow-md active:scale-95"
                    >
                      {canClaimToday ? t.claimReward : t.alreadyClaimed}
                    </button>
                  ) : (
                    <span className="text-[10px] text-slate-500">
                      قريباً
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
