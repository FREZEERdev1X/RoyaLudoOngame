import React, { useState } from 'react';
import { UserProfile, MatchHistoryItem } from '../types/game';
import { Language, translations } from '../i18n/translations';
import { sound } from '../utils/soundEngine';
import { PAWN_SKINS, DICE_SKINS, BOARD_SKINS } from '../data/skins';
import { 
  X, 
  User, 
  Crown, 
  Trophy, 
  Coins, 
  Gem, 
  Flame, 
  Shield, 
  Check, 
  Edit2, 
  ShoppingBag,
  Sparkles,
  History,
  Calendar,
  Award,
  TrendingUp,
  XCircle,
  CheckCircle2,
  Gamepad2
} from 'lucide-react';

interface ProfileModalProps {
  user: UserProfile;
  lang: Language;
  isOpen: boolean;
  onClose: () => void;
  onUpdateName: (name: string) => void;
  onOpenStore: () => void;
  onOpenGoogleAuth: () => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({
  user,
  lang,
  isOpen,
  onClose,
  onUpdateName,
  onOpenStore,
  onOpenGoogleAuth,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'history'>('overview');
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(user.name);
  const t = translations[lang];

  if (!isOpen) return null;

  const currentPawn = PAWN_SKINS.find((s) => s.id === user.selectedPawnSkin) || PAWN_SKINS[0];
  const currentDice = DICE_SKINS.find((s) => s.id === user.selectedDiceSkin) || DICE_SKINS[0];
  const currentBoard = BOARD_SKINS.find((s) => s.id === user.selectedBoardSkin) || BOARD_SKINS[0];

  const handleSaveName = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameInput.trim()) return;
    sound.playClick();
    onUpdateName(nameInput.trim());
    setIsEditingName(false);
  };

  const winRate = user.totalGames > 0 ? Math.round((user.wins / user.totalGames) * 100) : 100;
  const xpForNextLevel = user.level * 500;
  const xpPercent = Math.min(100, Math.round((user.xp / xpForNextLevel) * 100));

  // Get last 5 matches from user or fallback mock data matching user's stats
  const historyList: MatchHistoryItem[] = (user.matchHistory && user.matchHistory.length > 0)
    ? user.matchHistory.slice(0, 5)
    : [
        {
          id: 'hist-1',
          timestamp: Date.now() - 1000 * 60 * 25,
          dateStr: 'اليوم، 14:20',
          mode: '2p',
          modeLabel: '1 ضد 1 (سريعة)',
          result: 'win',
          bet: 500,
          coinsDelta: 1000,
          xpEarned: 400,
          myColor: 'red',
          finishedPawns: 4,
          opponentsCount: 2,
        },
        {
          id: 'hist-2',
          timestamp: Date.now() - 1000 * 60 * 120,
          dateStr: 'اليوم، 12:45',
          mode: '4p',
          modeLabel: 'مباراة 4 لاعبين ملكية',
          result: user.wins > 1 ? 'win' : 'loss',
          bet: 1000,
          coinsDelta: user.wins > 1 ? 4000 : -1000,
          xpEarned: user.wins > 1 ? 450 : 100,
          myColor: 'green',
          finishedPawns: user.wins > 1 ? 4 : 2,
          opponentsCount: 4,
        },
        {
          id: 'hist-3',
          timestamp: Date.now() - 1000 * 60 * 60 * 24,
          dateStr: 'أمس، 21:10',
          mode: 'bot',
          modeLabel: 'تحدي الذكاء الاصطناعي',
          result: 'win',
          bet: 500,
          coinsDelta: 1000,
          xpEarned: 350,
          myColor: 'yellow',
          finishedPawns: 4,
          opponentsCount: 2,
        },
        {
          id: 'hist-4',
          timestamp: Date.now() - 1000 * 60 * 60 * 48,
          dateStr: 'قبل يومين',
          mode: 'private',
          modeLabel: 'غرفة أصدقاء خاصة',
          result: 'win',
          bet: 2000,
          coinsDelta: 4000,
          xpEarned: 500,
          myColor: 'blue',
          finishedPawns: 4,
          opponentsCount: 2,
        },
        {
          id: 'hist-5',
          timestamp: Date.now() - 1000 * 60 * 60 * 72,
          dateStr: 'قبل 3 أيام',
          mode: '4p',
          modeLabel: 'دوري الأبطال 4 لاعبين',
          result: user.losses > 0 ? 'loss' : 'win',
          bet: 1000,
          coinsDelta: user.losses > 0 ? -1000 : 4000,
          xpEarned: user.losses > 0 ? 120 : 400,
          myColor: 'red',
          finishedPawns: user.losses > 0 ? 3 : 4,
          opponentsCount: 4,
        },
      ];

  const colorBadgeBg = {
    red: 'bg-red-500',
    green: 'bg-emerald-500',
    yellow: 'bg-amber-500',
    blue: 'bg-blue-500',
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-lg p-5 sm:p-6 flex flex-col shadow-2xl relative text-white overflow-hidden max-h-[92vh]">
        
        {/* Close Button */}
        <button
          onClick={() => {
            sound.playClick();
            onClose();
          }}
          className="absolute top-4 end-4 p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors z-10"
        >
          <X size={20} />
        </button>

        {/* Profile Card Header */}
        <div className="flex flex-col items-center text-center pb-3 border-b border-slate-800">
          <div className="relative mb-2">
            <img
              src={user.avatar}
              alt={user.name}
              className={`w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-slate-800 object-cover border-4 shadow-xl ${
                user.isVipMaster ? 'border-amber-400 shadow-[0_0_20px_rgba(251,191,36,0.6)]' : 'border-slate-600'
              }`}
            />
            {user.isVipMaster && (
              <div className="absolute -top-2 -right-2 bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950 p-1 rounded-full shadow-lg">
                <Crown size={16} className="fill-slate-950" />
              </div>
            )}
          </div>

          {/* Name & Title */}
          {!isEditingName ? (
            <div className="flex items-center gap-2">
              <h2 className="text-lg sm:text-xl font-black text-white">{user.name}</h2>
              <button
                onClick={() => setIsEditingName(true)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <Edit2 size={13} />
              </button>
            </div>
          ) : (
            <form onSubmit={handleSaveName} className="flex items-center gap-2">
              <input
                type="text"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                className="bg-slate-800 border border-amber-400 rounded-xl px-3 py-1 text-sm text-white focus:outline-none"
              />
              <button type="submit" className="p-1.5 bg-amber-500 text-slate-950 rounded-xl font-bold text-xs">
                حفظ
              </button>
            </form>
          )}

          <div className="text-xs text-slate-400 mt-0.5">
            {user.email || 'حساب زائر محلي'}
          </div>

          {user.isVipMaster && (
            <div className="mt-1.5 bg-gradient-to-r from-amber-500/20 to-yellow-500/20 border border-amber-400/50 text-amber-300 text-[11px] font-bold px-3 py-0.5 rounded-full flex items-center gap-1.5">
              <Crown size={13} />
              <span>{t.vipMasterAccount} (جميع السكنات مفتوحة)</span>
            </div>
          )}
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1.5 bg-slate-950/70 p-1 rounded-2xl border border-slate-800 mt-3 mb-2">
          <button
            onClick={() => {
              sound.playClick();
              setActiveTab('overview');
            }}
            className={`flex-1 py-1.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'overview'
                ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                : 'text-slate-400 hover:text-white hover:bg-slate-850'
            }`}
          >
            <Trophy size={14} />
            <span>نظرة عامة والعتاد</span>
          </button>

          <button
            onClick={() => {
              sound.playClick();
              setActiveTab('history');
            }}
            className={`flex-1 py-1.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'history'
                ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                : 'text-slate-400 hover:text-white hover:bg-slate-850'
            }`}
          >
            <History size={14} />
            <span>سجل آخر 5 مباريات 📜</span>
          </button>
        </div>

        {/* TAB CONTENT: Overview */}
        {activeTab === 'overview' && (
          <div className="overflow-y-auto space-y-3 pr-0.5 max-h-[48vh]">
            {/* Level & XP Progression */}
            <div className="bg-slate-800/60 border border-slate-700/80 rounded-2xl p-3">
              <div className="flex items-center justify-between text-xs font-bold mb-1.5">
                <span className="text-white">المستوى {user.level}</span>
                <span className="text-amber-400">{user.xp} / {xpForNextLevel} XP</span>
              </div>
              <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden p-0.5 border border-slate-800">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-amber-500 to-yellow-400 transition-all duration-500"
                  style={{ width: `${xpPercent}%` }}
                ></div>
              </div>
            </div>

            {/* Match Statistics Grid */}
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="bg-slate-800/50 border border-slate-700/70 rounded-2xl p-2.5">
                <div className="text-base sm:text-lg font-black text-amber-400">{user.wins}</div>
                <div className="text-[10px] text-slate-400 font-bold uppercase">{t.wins}</div>
              </div>

              <div className="bg-slate-800/50 border border-slate-700/70 rounded-2xl p-2.5">
                <div className="text-base sm:text-lg font-black text-emerald-400">{winRate}%</div>
                <div className="text-[10px] text-slate-400 font-bold uppercase">{t.winRate}</div>
              </div>

              <div className="bg-slate-800/50 border border-slate-700/70 rounded-2xl p-2.5">
                <div className="text-base sm:text-lg font-black text-blue-400">{user.totalGames}</div>
                <div className="text-[10px] text-slate-400 font-bold uppercase">إجمالي الجولات</div>
              </div>
            </div>

            {/* Currently Equipped Loadout */}
            <div className="bg-slate-800/40 border border-slate-700/60 rounded-2xl p-3">
              <div className="flex items-center justify-between text-xs font-bold text-slate-400 mb-2">
                <span>العتاد المفعل حالياً:</span>
                <button
                  onClick={() => {
                    onClose();
                    onOpenStore();
                  }}
                  className="text-amber-400 hover:underline text-[11px] flex items-center gap-1"
                >
                  <ShoppingBag size={12} />
                  <span>تغيير من المتجر</span>
                </button>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-slate-900/60 rounded-xl p-2 border border-slate-800">
                  <div className="text-[10px] text-slate-400">سكن القطع</div>
                  <div className="font-bold text-[11px] text-white truncate mt-0.5">
                    {currentPawn.name[lang] || currentPawn.name.ar}
                  </div>
                </div>

                <div className="bg-slate-900/60 rounded-xl p-2 border border-slate-800">
                  <div className="text-[10px] text-slate-400">سكن النرد</div>
                  <div className="font-bold text-[11px] text-white truncate mt-0.5">
                    {currentDice.name[lang] || currentDice.name.ar}
                  </div>
                </div>

                <div className="bg-slate-900/60 rounded-xl p-2 border border-slate-800">
                  <div className="text-[10px] text-slate-400">رقعة اللعب</div>
                  <div className="font-bold text-[11px] text-white truncate mt-0.5">
                    {currentBoard.name[lang] || currentBoard.name.ar}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB CONTENT: Match History (سجل المباريات) */}
        {activeTab === 'history' && (
          <div className="overflow-y-auto space-y-2 pr-0.5 max-h-[48vh]">
            <div className="flex items-center justify-between px-1 text-[11px] font-bold text-slate-400">
              <span>آخر 5 مباريات خاضها اللاعب:</span>
              <span className="text-amber-400">معدل الفوز: {winRate}%</span>
            </div>

            {historyList.map((match) => {
              const isWin = match.result === 'win';
              const colorDot = colorBadgeBg[match.myColor] || 'bg-red-500';

              return (
                <div
                  key={match.id}
                  className={`p-3 rounded-2xl border flex items-center justify-between gap-2.5 transition-all ${
                    isWin
                      ? 'bg-emerald-950/20 border-emerald-500/30 hover:border-emerald-500/50'
                      : 'bg-rose-950/20 border-rose-500/30 hover:border-rose-500/50'
                  }`}
                >
                  {/* Left: Result & Mode info */}
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                        isWin
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-400/40'
                          : 'bg-rose-500/20 text-rose-400 border border-rose-400/40'
                      }`}
                    >
                      {isWin ? <CheckCircle2 size={20} /> : <XCircle size={20} />}
                    </div>

                    <div>
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`text-xs font-black px-1.5 py-0.2 rounded-md ${
                            isWin ? 'bg-emerald-500/30 text-emerald-300' : 'bg-rose-500/30 text-rose-300'
                          }`}
                        >
                          {isWin ? 'فوز 🏆' : 'خسارة'}
                        </span>
                        <span className="text-xs font-bold text-white truncate max-w-[140px]">
                          {match.modeLabel}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-1">
                        <div className="flex items-center gap-1">
                          <Calendar size={10} />
                          <span>{match.dateStr}</span>
                        </div>
                        <span>•</span>
                        <div className="flex items-center gap-1">
                          <span className={`w-2 h-2 rounded-full ${colorDot}`}></span>
                          <span>{match.finishedPawns}/4 قطع</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right: Rewards / Coins Delta */}
                  <div className="text-end shrink-0">
                    <div
                      className={`text-xs font-black flex items-center justify-end gap-1 ${
                        isWin ? 'text-amber-400' : 'text-slate-400'
                      }`}
                    >
                      <Coins size={13} className="text-amber-400" />
                      <span>
                        {match.coinsDelta > 0
                          ? `+${match.coinsDelta.toLocaleString()}`
                          : match.coinsDelta.toLocaleString()}
                      </span>
                    </div>

                    <div className="text-[10px] font-bold text-emerald-400 mt-0.5">
                      +{match.xpEarned} XP
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Google Switch Account Button */}
        <div className="mt-3 pt-2 border-t border-slate-800">
          <button
            onClick={() => {
              onClose();
              onOpenGoogleAuth();
            }}
            className="w-full py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs flex items-center justify-center gap-2 border border-slate-700 transition-colors"
          >
            <User size={14} className="text-amber-400" />
            <span>تبديل الحساب أو تسجيل الدخول</span>
          </button>
        </div>

      </div>
    </div>
  );
};
