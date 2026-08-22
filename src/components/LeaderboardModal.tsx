import React, { useState, useEffect } from 'react';
import { UserProfile } from '../types/game';
import { DEFAULT_LEADERBOARDS, LeaderboardEntry } from '../data/leaderboardData';
import { Language, translations } from '../i18n/translations';
import { sound } from '../utils/soundEngine';
import { 
  X, 
  Trophy, 
  Crown, 
  Medal, 
  Flame, 
  Coins, 
  Shield, 
  User, 
  Search, 
  RefreshCw, 
  Globe2, 
  Zap, 
  Calendar, 
  Award, 
  ArrowUpRight,
  TrendingUp,
  Sparkles
} from 'lucide-react';

interface LeaderboardModalProps {
  user: UserProfile;
  lang: Language;
  isOpen: boolean;
  onClose: () => void;
}

const COUNTRIES = [
  { code: 'all', name: 'جميع الدول 🌍', flag: '🌍' },
  { code: 'SA', name: 'السعودية 🇸🇦', flag: '🇸🇦' },
  { code: 'EG', name: 'مصر 🇪🇬', flag: '🇪🇬' },
  { code: 'AE', name: 'الإمارات 🇦🇪', flag: '🇦🇪' },
  { code: 'KW', name: 'الكويت 🇰🇼', flag: '🇰🇼' },
  { code: 'MA', name: 'المغرب 🇲🇦', flag: '🇲🇦' },
  { code: 'DZ', name: 'الجزائر 🇩🇿', flag: '🇩🇿' },
  { code: 'IQ', name: 'العراق 🇮🇶', flag: '🇮🇶' },
  { code: 'JO', name: 'الأردن 🇯🇴', flag: '🇯🇴' },
  { code: 'QA', name: 'قطر 🇶🇦', flag: '🇶🇦' },
  { code: 'BH', name: 'البحرين 🇧🇭', flag: '🇧🇭' },
  { code: 'OM', name: 'عُمان 🇴🇲', flag: '🇴🇲' },
  { code: 'TN', name: 'تونس 🇹🇳', flag: '🇹🇳' },
];

export const LeaderboardModal: React.FC<LeaderboardModalProps> = ({
  user,
  lang,
  isOpen,
  onClose,
}) => {
  const [leaderboardData, setLeaderboardData] = useState<any[]>([]);
  const [userRankInfo, setUserRankInfo] = useState<any>(null);
  const [seasonInfo, setSeasonInfo] = useState<any>(null);
  const [category, setCategory] = useState<'coins' | 'wins' | 'level' | 'weekly'>('coins');
  const [selectedCountry, setSelectedCountry] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const t = translations[lang];

  const calculateFallbackLeaderboard = () => {
    let list: LeaderboardEntry[] = [...DEFAULT_LEADERBOARDS];
    const userEntry: LeaderboardEntry = {
      id: user.id,
      name: user.name,
      avatar: user.avatar,
      coins: user.coins,
      gems: user.gems,
      wins: user.wins,
      totalGames: user.totalGames,
      winRate: user.totalGames > 0 ? Math.round((user.wins / user.totalGames) * 100) : 50,
      level: user.level,
      country: user.country || 'SA',
      countryName: 'السعودية',
      weeklyPoints: (user.wins || 0) * 250 + Math.floor((user.coins || 0) / 100),
      badge: user.isVipMaster ? '👑 VIP Master' : '🎲 Pro Player',
      rankTitle: user.isVipMaster ? 'إمبراطور اللودو' : 'بطل اللودو',
      isVip: user.isVipMaster,
      email: user.email,
    };

    const existingIdx = list.findIndex((e) => (user.email && e.email === user.email) || e.name === user.name);
    if (existingIdx !== -1) {
      list[existingIdx] = userEntry;
    } else {
      list.push(userEntry);
    }

    if (selectedCountry && selectedCountry !== 'all') {
      list = list.filter((e) => e.country.toLowerCase() === selectedCountry.toLowerCase());
    }

    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      list = list.filter(
        (e) =>
          e.name.toLowerCase().includes(q) ||
          e.countryName.toLowerCase().includes(q) ||
          e.rankTitle.toLowerCase().includes(q)
      );
    }

    list.sort((a, b) => {
      if (category === 'wins') {
        if (b.wins !== a.wins) return b.wins - a.wins;
        return b.winRate - a.winRate;
      } else if (category === 'level') {
        if (b.level !== a.level) return b.level - a.level;
        return b.coins - a.coins;
      } else if (category === 'weekly') {
        return (b.weeklyPoints || 0) - (a.weeklyPoints || 0);
      }
      return b.coins - a.coins;
    });

    const ranked = list.map((item, idx) => ({ ...item, rank: idx + 1 }));
    const myIndex = ranked.findIndex((e) => (user.email && e.email === user.email) || e.name === user.name);
    let myRankInfo = null;
    if (myIndex !== -1) {
      const me = ranked[myIndex];
      const prev = myIndex > 0 ? ranked[myIndex - 1] : null;
      myRankInfo = {
        rank: myIndex + 1,
        totalPlayers: ranked.length,
        percentile: Math.max(1, Math.round(((ranked.length - myIndex) / ranked.length) * 100)),
        coinsToNextRank: prev ? Math.max(0, prev.coins - me.coins + 100) : 0,
        winsToNextRank: prev ? Math.max(0, prev.wins - me.wins + 1) : 0,
        userData: me,
      };
    }

    setLeaderboardData(ranked);
    setUserRankInfo(myRankInfo);
    setSeasonInfo({
      seasonName: 'موسم الأساطير الذهبي 🏆',
      seasonNumber: 14,
      daysRemaining: 4,
      firstPrize: '150,000 قطعة ذهبية + تاج الإمبراطور VIP',
      secondPrize: '75,000 قطعة ذهبية + سكن نرد التنين',
      thirdPrize: '35,000 قطعة ذهبية + سكن رقعة الملوك',
    });
  };

  const fetchLeaderboard = () => {
    setIsLoading(true);
    const params = new URLSearchParams({
      category,
      country: selectedCountry,
      search: searchQuery,
      userEmail: user.email || '',
      userName: user.name || '',
    });

    fetch(`/api/leaderboard?${params.toString()}`)
      .then((res) => {
        if (!res.ok) throw new Error('API unavailable');
        return res.json();
      })
      .then((data) => {
        if (data && data.leaderboards && data.leaderboards.length > 0) {
          setLeaderboardData(data.leaderboards);
          setUserRankInfo(data.userRank);
          setSeasonInfo(data.seasonInfo);
        } else {
          calculateFallbackLeaderboard();
        }
      })
      .catch(() => {
        calculateFallbackLeaderboard();
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  useEffect(() => {
    if (isOpen) {
      // Sync current user first to ensure real live ranking
      fetch('/api/leaderboard/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: user.name,
          email: user.email,
          avatar: user.avatar,
          coins: user.coins,
          gems: user.gems,
          wins: user.wins,
          losses: user.losses,
          totalGames: user.totalGames,
          level: user.level,
          country: user.country || 'SA',
          isVipMaster: user.isVipMaster,
        }),
      })
        .catch(() => {})
        .finally(() => {
          fetchLeaderboard();
        });
    }
  }, [isOpen, category, selectedCountry, searchQuery]);

  if (!isOpen) return null;

  const top3 = leaderboardData.slice(0, 3);
  const rest = leaderboardData.slice(3);

  // Country Flag helper
  const getFlag = (countryCode: string) => {
    const item = COUNTRIES.find((c) => c.code.toLowerCase() === (countryCode || '').toLowerCase());
    return item ? item.flag : '🌐';
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-2.5 sm:p-5 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-amber-500/40 rounded-3xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl relative text-white overflow-hidden">
        
        {/* Modal Top Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-800 bg-slate-950/40">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-400 flex items-center justify-center text-slate-950 shadow-lg shrink-0">
              <Trophy size={24} className="stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-black text-white">{t.leaderboard} العالمي المباشر</h2>
                <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-[10px] font-extrabold px-2 py-0.5 rounded-full flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                  مباشر ومحدث
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                تنافس مع نخبة أبطال اللودو حول العالم واربح جوائز الدوري الأسبوعي
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                sound.playClick();
                fetchLeaderboard();
              }}
              title="تحديث البيانات"
              className={`p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all ${
                isLoading ? 'animate-spin text-amber-400' : ''
              }`}
            >
              <RefreshCw size={18} />
            </button>

            <button
              onClick={() => {
                sound.playClick();
                onClose();
              }}
              className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Tournament / Season Rewards Banner */}
        {seasonInfo && (
          <div className="bg-gradient-to-r from-amber-500/15 via-yellow-500/10 to-purple-500/15 border-b border-slate-800 px-4 py-2.5 flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2">
              <Sparkles size={16} className="text-amber-400 animate-pulse" />
              <span className="font-bold text-amber-300">{seasonInfo.seasonName} (الموسم #{seasonInfo.seasonNumber})</span>
              <span className="text-slate-400 hidden sm:inline">•</span>
              <span className="text-slate-300 hidden sm:inline">الجائزة الأولى: {seasonInfo.firstPrize}</span>
            </div>
            <div className="flex items-center gap-1.5 bg-slate-950/70 border border-slate-700 px-2.5 py-1 rounded-xl font-mono text-[11px] text-amber-300 font-bold">
              <Calendar size={12} />
              <span>متبقي {seasonInfo.daysRemaining} أيام على التتويج</span>
            </div>
          </div>
        )}

        {/* Filters & Search Control Bar */}
        <div className="p-3 sm:px-5 sm:py-3 border-b border-slate-800 bg-slate-900/60 flex flex-col sm:flex-row items-center justify-between gap-2.5">
          {/* Category Tabs */}
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-2xl border border-slate-800 w-full sm:w-auto overflow-x-auto">
            <button
              onClick={() => {
                sound.playClick();
                setCategory('coins');
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
                category === 'coins'
                  ? 'bg-amber-500 text-slate-950 font-black shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Coins size={13} />
              <span>الثروة والذهب</span>
            </button>

            <button
              onClick={() => {
                sound.playClick();
                setCategory('wins');
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
                category === 'wins'
                  ? 'bg-amber-500 text-slate-950 font-black shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Trophy size={13} />
              <span>أكثر انتصارات</span>
            </button>

            <button
              onClick={() => {
                sound.playClick();
                setCategory('level');
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
                category === 'level'
                  ? 'bg-amber-500 text-slate-950 font-black shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Zap size={13} />
              <span>أعلى مستوى</span>
            </button>

            <button
              onClick={() => {
                sound.playClick();
                setCategory('weekly');
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
                category === 'weekly'
                  ? 'bg-amber-500 text-slate-950 font-black shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Flame size={13} />
              <span>الدوري الأسبوعي</span>
            </button>
          </div>

          {/* Search & Country Select */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-44">
              <Search size={14} className="absolute start-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                placeholder="بحث عن لاعب..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700/80 rounded-xl ps-8 pe-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
              />
            </div>

            <select
              value={selectedCountry}
              onChange={(e) => {
                sound.playClick();
                setSelectedCountry(e.target.value);
              }}
              className="bg-slate-950 border border-slate-700/80 rounded-xl px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-amber-400 font-medium cursor-pointer"
            >
              {COUNTRIES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          
          {/* Top 3 Podium (Only shown if no custom search) */}
          {!searchQuery && top3.length >= 3 && (
            <div className="grid grid-cols-3 gap-2 sm:gap-4 items-end mb-4 pt-4">
              
              {/* 2nd Place (Silver) */}
              <div className="bg-gradient-to-b from-slate-800/80 to-slate-900 border-2 border-slate-400/50 rounded-3xl p-3 sm:p-4 flex flex-col items-center text-center order-1 relative shadow-lg">
                <div className="absolute -top-3.5 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-tr from-slate-300 to-slate-100 text-slate-950 font-black text-xs sm:text-sm flex items-center justify-center shadow-md border-2 border-white">
                  2
                </div>
                <div className="relative mb-2 mt-1">
                  <img
                    src={top3[1].avatar}
                    alt=""
                    className="w-12 h-12 sm:w-14 sm:h-14 rounded-full border-2 border-slate-300 object-cover shadow-md"
                  />
                  <span className="absolute -bottom-1 -right-1 text-sm">{getFlag(top3[1].country)}</span>
                </div>
                <div className="font-bold text-xs sm:text-sm text-white truncate max-w-full">{top3[1].name}</div>
                <div className="text-[10px] text-slate-400 font-medium">{top3[1].rankTitle || 'فارس فضي'}</div>
                
                <div className="text-xs text-amber-300 font-black flex items-center gap-1 mt-1.5 bg-slate-950/60 px-2.5 py-1 rounded-xl border border-slate-800">
                  <Coins size={12} className="text-amber-400" />
                  <span>{top3[1].coins.toLocaleString()}</span>
                </div>
                <span className="text-[10px] text-emerald-400 font-bold mt-1">
                  {top3[1].wins} انتصار • Lv.{top3[1].level}
                </span>
              </div>

              {/* 1st Place (Champion Gold) */}
              <div className="bg-gradient-to-b from-amber-500/25 via-yellow-500/15 to-slate-900 border-2 border-amber-400 rounded-3xl p-4 sm:p-5 flex flex-col items-center text-center order-2 relative shadow-[0_0_25px_rgba(251,191,36,0.35)] scale-105">
                <div className="absolute -top-4 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950 font-black text-base flex items-center justify-center shadow-xl border-2 border-amber-200 animate-bounce">
                  👑
                </div>
                <div className="relative mb-2 mt-2">
                  <img
                    src={top3[0].avatar}
                    alt=""
                    className="w-16 h-16 sm:w-18 sm:h-18 rounded-full border-3 border-amber-400 object-cover shadow-[0_0_15px_rgba(251,191,36,0.5)]"
                  />
                  <span className="absolute -bottom-1 -right-1 text-base">{getFlag(top3[0].country)}</span>
                </div>
                <div className="font-black text-sm sm:text-base text-amber-300 truncate max-w-full">{top3[0].name}</div>
                <div className="text-[11px] text-amber-400 font-bold">{top3[0].rankTitle || 'ملك اللودو العالمي'}</div>

                <div className="text-xs sm:text-sm text-amber-300 font-black flex items-center gap-1.5 mt-2 bg-slate-950/80 px-3 py-1.5 rounded-xl border border-amber-500/40 shadow-inner">
                  <Coins size={14} className="text-amber-400" />
                  <span>{top3[0].coins.toLocaleString()}</span>
                </div>
                <div className="flex items-center gap-2 text-[10px] text-amber-400 font-bold mt-1">
                  <span>{top3[0].wins} فوز ({top3[0].winRate}%)</span>
                  <span>•</span>
                  <span>Lv.{top3[0].level}</span>
                </div>
              </div>

              {/* 3rd Place (Bronze) */}
              <div className="bg-gradient-to-b from-slate-800/80 to-slate-900 border-2 border-amber-700/60 rounded-3xl p-3 sm:p-4 flex flex-col items-center text-center order-3 relative shadow-lg">
                <div className="absolute -top-3.5 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-tr from-amber-700 to-amber-600 text-white font-black text-xs sm:text-sm flex items-center justify-center shadow-md border-2 border-amber-400">
                  3
                </div>
                <div className="relative mb-2 mt-1">
                  <img
                    src={top3[2].avatar}
                    alt=""
                    className="w-12 h-12 sm:w-14 sm:h-14 rounded-full border-2 border-amber-700 object-cover shadow-md"
                  />
                  <span className="absolute -bottom-1 -right-1 text-sm">{getFlag(top3[2].country)}</span>
                </div>
                <div className="font-bold text-xs sm:text-sm text-white truncate max-w-full">{top3[2].name}</div>
                <div className="text-[10px] text-slate-400 font-medium">{top3[2].rankTitle || 'فارس برونزي'}</div>

                <div className="text-xs text-amber-300 font-black flex items-center gap-1 mt-1.5 bg-slate-950/60 px-2.5 py-1 rounded-xl border border-slate-800">
                  <Coins size={12} className="text-amber-400" />
                  <span>{top3[2].coins.toLocaleString()}</span>
                </div>
                <span className="text-[10px] text-emerald-400 font-bold mt-1">
                  {top3[2].wins} انتصار • Lv.{top3[2].level}
                </span>
              </div>
            </div>
          )}

          {/* List Rankings Header */}
          <div className="flex items-center justify-between text-xs font-bold text-slate-400 px-2">
            <span>ترتيب اللاعبين ({leaderboardData.length} لاعب مسجل)</span>
            <span>النقاط والإحصائيات</span>
          </div>

          {/* Scrollable Player List */}
          <div className="space-y-2">
            {(searchQuery ? leaderboardData : rest).map((entry, idx) => {
              const isMe = (user.email && entry.email === user.email) || entry.name === user.name;
              const rank = searchQuery ? entry.rank : idx + 4;

              return (
                <div
                  key={entry.id || idx}
                  className={`flex items-center justify-between p-3 sm:p-3.5 rounded-2xl border transition-all ${
                    isMe
                      ? 'bg-amber-500/20 border-amber-400 shadow-[0_0_15px_rgba(251,191,36,0.2)]'
                      : 'bg-slate-800/60 border-slate-700/70 hover:bg-slate-800'
                  }`}
                >
                  {/* Left info */}
                  <div className="flex items-center gap-3">
                    <span
                      className={`w-7 h-7 rounded-xl flex items-center justify-center font-black text-xs ${
                        rank <= 3
                          ? 'bg-amber-500 text-slate-950'
                          : rank <= 10
                          ? 'bg-slate-700 text-amber-300'
                          : 'text-slate-400 bg-slate-900'
                      }`}
                    >
                      #{rank}
                    </span>

                    <div className="relative">
                      <img
                        src={entry.avatar}
                        alt=""
                        className="w-10 h-10 rounded-full bg-slate-700 object-cover border border-slate-600"
                      />
                      <span className="absolute -bottom-1 -right-1 text-xs">
                        {getFlag(entry.country)}
                      </span>
                    </div>

                    <div className="text-start">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-xs sm:text-sm text-white">{entry.name}</span>
                        {entry.badge && (
                          <span className="text-[9px] bg-slate-700/80 text-amber-300 border border-slate-600 px-1.5 py-0.2 rounded-md font-medium">
                            {entry.badge}
                          </span>
                        )}
                        {isMe && (
                          <span className="bg-amber-500 text-slate-950 font-black text-[9px] px-1.5 py-0.2 rounded-md">
                            أنت 👈
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                        <span className="text-amber-400 font-bold">Lv.{entry.level || 1}</span>
                        <span>•</span>
                        <span>{entry.wins || 0} فوز ({entry.winRate || 50}%)</span>
                        <span>•</span>
                        <span>{entry.countryName || 'عالمي'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Right Score */}
                  <div className="text-end">
                    <div className="flex items-center justify-end gap-1.5 text-amber-300 font-black text-xs sm:text-sm">
                      <Coins size={14} className="text-amber-400" />
                      <span>{entry.coins.toLocaleString()}</span>
                    </div>
                    {category === 'weekly' && (
                      <div className="text-[10px] text-purple-300 font-bold mt-0.5">
                        {entry.weeklyPoints?.toLocaleString() || 0} نقطة أسبوعية
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {leaderboardData.length === 0 && (
              <div className="text-center py-12 text-slate-400">
                <Trophy size={36} className="mx-auto mb-2 opacity-30 text-amber-400" />
                <p className="text-sm font-bold">لا توجد نتائج تطابق بحثك</p>
              </div>
            )}
          </div>
        </div>

        {/* Sticky Bottom Rank Bar for Current User */}
        {userRankInfo && (
          <div className="bg-slate-950 border-t border-amber-500/30 p-3 sm:px-5 sm:py-3.5 flex items-center justify-between gap-3 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-400 text-slate-950 flex items-center justify-center font-black text-sm shadow-md">
                #{userRankInfo.rank}
              </div>

              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs sm:text-sm font-bold text-white">ترتيبك العالمي المباشر:</span>
                  <span className="text-amber-400 font-black text-xs sm:text-sm">المركز #{userRankInfo.rank}</span>
                  <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-bold px-1.5 py-0.2 rounded">
                    (أفضل {userRankInfo.percentile}%)
                  </span>
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-2">
                  <span>رصيدك: {user.coins.toLocaleString()} 🪙</span>
                  {userRankInfo.coinsToNextRank > 0 && (
                    <span className="text-amber-300/90 font-medium">
                      • يفصلك {userRankInfo.coinsToNextRank.toLocaleString()} ذهب للمركز #{userRankInfo.rank - 1} 🚀
                    </span>
                  )}
                </div>
              </div>
            </div>

            <button
              onClick={() => {
                sound.playClick();
                onClose();
              }}
              className="bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black text-xs px-4 py-2.5 rounded-xl shadow-lg transition-all transform active:scale-95 whitespace-nowrap"
            >
              العب الآن وارفع ترتيبك 🎲
            </button>
          </div>
        )}

      </div>
    </div>
  );
};

