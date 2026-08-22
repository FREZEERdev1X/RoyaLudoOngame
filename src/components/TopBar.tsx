import React from 'react';
import { UserProfile } from '../types/game';
import { Language, translations } from '../i18n/translations';
import { sound } from '../utils/soundEngine';
import { 
  Coins, 
  Gem, 
  Crown, 
  Volume2, 
  VolumeX, 
  Globe, 
  Gift, 
  Sparkles, 
  ShoppingBag, 
  Trophy, 
  User, 
  Flame 
} from 'lucide-react';

interface TopBarProps {
  user: UserProfile;
  lang: Language;
  onLanguageChange: (lang: Language) => void;
  onOpenStore: () => void;
  onOpenLeaderboard: () => void;
  onOpenDailyRewards: () => void;
  onOpenLuckySpin: () => void;
  onOpenProfile: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
  onlineCount?: number;
}

export const TopBar: React.FC<TopBarProps> = ({
  user,
  lang,
  onLanguageChange,
  onOpenStore,
  onOpenLeaderboard,
  onOpenDailyRewards,
  onOpenLuckySpin,
  onOpenProfile,
  isMuted,
  onToggleMute,
  onlineCount = 1420,
}) => {
  const t = translations[lang];
  const isVip = user.isVipMaster;

  return (
    <header className="w-full bg-slate-900/95 backdrop-blur-md border-b border-amber-500/20 text-white px-3 sm:px-6 py-2.5 flex items-center justify-between sticky top-0 z-40 shadow-xl select-none">
      {/* Brand & VIP Title */}
      <div className="flex items-center gap-2.5">
        <div 
          onClick={onOpenProfile} 
          className="relative cursor-pointer group flex items-center gap-2"
          id="user-profile-trigger"
        >
          <div className="relative">
            <img
              src={user.avatar}
              alt={user.name}
              className={`w-10 h-10 rounded-full border-2 bg-slate-800 object-cover ${
                isVip ? 'border-amber-400 shadow-[0_0_12px_rgba(251,191,36,0.6)]' : 'border-slate-600'
              }`}
            />
            {isVip && (
              <div className="absolute -top-2 -right-1 bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950 rounded-full p-0.5 shadow-md">
                <Crown size={12} className="stroke-[2.5]" />
              </div>
            )}
            <div className="absolute -bottom-1 -right-1 bg-blue-600 text-white text-[10px] font-bold px-1.5 rounded-full border border-slate-900">
              {user.level}
            </div>
          </div>
          <div className="hidden sm:block text-start">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-sm tracking-wide group-hover:text-amber-400 transition-colors">
                {user.name}
              </span>
              {isVip && (
                <span className="bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950 font-black text-[10px] px-1.5 py-0.2 rounded font-sans uppercase tracking-tight">
                  VIP MASTER
                </span>
              )}
            </div>
            <div className="text-[11px] text-slate-400 flex items-center gap-1">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>{user.email || 'Guest Player'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Center Currencies & Daily Action Badges */}
      <div className="flex items-center gap-2 sm:gap-4">
        {/* Coins Badge */}
        <div 
          onClick={onOpenStore}
          className="cursor-pointer flex items-center gap-1.5 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 px-2.5 py-1 rounded-full transition-all duration-200"
          id="coins-badge"
          title={t.coins}
        >
          <div className="w-5 h-5 rounded-full bg-amber-500 flex items-center justify-center text-slate-950 shadow-inner">
            <Coins size={12} className="stroke-[2.5]" />
          </div>
          <span className="font-bold text-xs sm:text-sm text-amber-300">
            {user.coins.toLocaleString()}
          </span>
        </div>

        {/* Gems Badge */}
        <div 
          onClick={onOpenStore}
          className="cursor-pointer flex items-center gap-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 px-2.5 py-1 rounded-full transition-all duration-200"
          id="gems-badge"
          title={t.gems}
        >
          <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center text-slate-950 shadow-inner">
            <Gem size={12} className="stroke-[2.5]" />
          </div>
          <span className="font-bold text-xs sm:text-sm text-emerald-300">
            {user.gems.toLocaleString()}
          </span>
        </div>

        {/* Daily Streak Indicator */}
        <button
          onClick={() => {
            sound.playClick();
            onOpenDailyRewards();
          }}
          className="relative flex items-center gap-1 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 px-2 sm:px-2.5 py-1 rounded-full text-rose-400 transition-all text-xs font-semibold"
          id="daily-rewards-btn"
          title={t.dailyRewards}
        >
          <Gift size={15} className="text-rose-400 animate-bounce" />
          <span className="hidden md:inline">{t.dailyRewards}</span>
          <span className="bg-rose-500 text-white text-[10px] px-1 rounded-full">
            {user.loginStreak}d
          </span>
        </button>

        {/* Lucky Spin Button */}
        <button
          onClick={() => {
            sound.playClick();
            onOpenLuckySpin();
          }}
          className="relative flex items-center gap-1 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 px-2 sm:px-2.5 py-1 rounded-full text-purple-300 transition-all text-xs font-semibold"
          id="lucky-spin-btn"
          title={t.luckySpin}
        >
          <Sparkles size={15} className="text-purple-400 animate-spin" />
          <span className="hidden md:inline">{t.luckySpin}</span>
        </button>
      </div>

      {/* Right Controls (Store, Leaderboard, Audio, Language) */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        {/* Store Button */}
        <button
          onClick={() => {
            sound.playClick();
            onOpenStore();
          }}
          className="p-2 rounded-xl bg-gradient-to-r from-amber-500/20 to-yellow-500/20 hover:from-amber-500/30 hover:to-yellow-500/30 border border-amber-500/40 text-amber-300 transition-transform active:scale-95"
          id="topbar-store-btn"
          title={t.store}
        >
          <ShoppingBag size={18} />
        </button>

        {/* Leaderboard Button */}
        <button
          onClick={() => {
            sound.playClick();
            onOpenLeaderboard();
          }}
          className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-amber-300 transition-transform active:scale-95"
          id="topbar-leaderboard-btn"
          title={t.leaderboard}
        >
          <Trophy size={18} />
        </button>

        {/* Mute/Sound Toggle */}
        <button
          onClick={onToggleMute}
          className={`p-2 rounded-xl border transition-colors ${
            isMuted 
              ? 'bg-red-500/10 border-red-500/30 text-red-400' 
              : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-300'
          }`}
          id="sound-toggle-btn"
          title={t.soundEffects}
        >
          {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
        </button>

        {/* Language Switcher Dropdown */}
        <div className="relative group">
          <button 
            className="flex items-center gap-1 p-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-xs font-semibold"
            id="lang-menu-btn"
          >
            <Globe size={18} />
            <span className="uppercase">{lang}</span>
          </button>
          
          <div className="absolute end-0 top-full mt-1 w-32 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl overflow-hidden hidden group-hover:block z-50">
            {[
              { code: 'ar', label: 'العربية (AR)' },
              { code: 'en', label: 'English (EN)' },
              { code: 'fr', label: 'Français (FR)' },
              { code: 'es', label: 'Español (ES)' },
              { code: 'tr', label: 'Türkçe (TR)' },
            ].map((item) => (
              <button
                key={item.code}
                onClick={() => {
                  sound.playClick();
                  onLanguageChange(item.code as Language);
                }}
                className={`w-full text-start px-3 py-2 text-xs font-medium transition-colors hover:bg-slate-800 flex items-center justify-between ${
                  lang === item.code ? 'text-amber-400 bg-amber-500/10 font-bold' : 'text-slate-300'
                }`}
              >
                <span>{item.label}</span>
                {lang === item.code && <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>}
              </button>
            ))}
          </div>
        </div>
      </div>
    </header>
  );
};
