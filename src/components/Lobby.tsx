import React, { useState, useEffect } from 'react';
import { UserProfile, DailyQuest, RoomMode } from '../types/game';
import { Language, translations } from '../i18n/translations';
import { sound } from '../utils/soundEngine';
import { 
  Globe, 
  Users, 
  Bot, 
  Smartphone, 
  Plus, 
  LogIn, 
  Coins, 
  Gem, 
  Crown, 
  Sparkles, 
  Trophy, 
  Flame, 
  Copy, 
  Check, 
  Dices,
  ShieldCheck,
  Eye,
  Radio
} from 'lucide-react';

interface LobbyProps {
  user: UserProfile;
  lang: Language;
  onStartQuickMatch: (mode: RoomMode, bet: number) => void;
  onCreatePrivateRoom: (name: string, mode: RoomMode, bet: number) => void;
  onJoinPrivateRoom: (code: string, asSpectator?: boolean) => void;
  onStartVsBot: (mode: RoomMode, difficulty: 'easy' | 'medium' | 'hard') => void;
  onStartPassAndPlay: (playerCount: 2 | 3 | 4) => void;
  onOpenStore: () => void;
  onOpenGoogleAuth: () => void;
}

export const Lobby: React.FC<LobbyProps> = ({
  user,
  lang,
  onStartQuickMatch,
  onCreatePrivateRoom,
  onJoinPrivateRoom,
  onStartVsBot,
  onStartPassAndPlay,
  onOpenStore,
  onOpenGoogleAuth,
}) => {
  const [selectedMode, setSelectedMode] = useState<RoomMode>('4p');
  const [selectedBet, setSelectedBet] = useState<number>(500);
  const [joinCodeInput, setJoinCodeInput] = useState('');
  const [roomNameInput, setRoomNameInput] = useState('');
  const [botDifficulty, setBotDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [passPlayCount, setPassPlayCount] = useState<2 | 3 | 4>(4);
  const [activeTab, setActiveTab] = useState<'online' | 'private' | 'bot' | 'local'>('online');
  const [publicRooms, setPublicRooms] = useState<any[]>([]);

  const t = translations[lang];
  const BET_OPTIONS = [250, 500, 1000, 2500, 5000, 10000, 50000];

  useEffect(() => {
    // Fetch active public rooms periodically
    const fetchRooms = () => {
      fetch('/api/rooms')
        .then((res) => res.json())
        .then((data) => {
          if (data && data.rooms) {
            setPublicRooms(data.rooms);
          }
        })
        .catch(() => {});
    };
    fetchRooms();
    const interval = setInterval(fetchRooms, 4000);

    // Auto-detect room query param in URL (?room=... or ?join=...)
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const roomParam = urlParams.get('room') || urlParams.get('join') || urlParams.get('code');
      if (roomParam) {
        setJoinCodeInput(roomParam.trim().toUpperCase());
        setActiveTab('private');
      }
    } catch (e) {}

    return () => clearInterval(interval);
  }, []);

  const [isCreating, setIsCreating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);

  const handleCreateRoom = (e: React.FormEvent) => {
    e.preventDefault();
    sound.playClick();
    setIsCreating(true);
    setJoinError(null);
    onCreatePrivateRoom(
      roomNameInput.trim() || `غرفة ${user.name}`,
      selectedMode,
      selectedBet
    );
    setTimeout(() => setIsCreating(false), 2000);
  };

  const handleJoinRoom = async (e: React.FormEvent, asSpectator = false) => {
    e?.preventDefault();
    if (!joinCodeInput.trim()) return;
    sound.playClick();
    setIsJoining(true);
    setJoinError(null);

    try {
      await onJoinPrivateRoom(joinCodeInput.trim().toUpperCase(), asSpectator);
    } catch (err: any) {
      setJoinError(err?.message || 'تعذر الانضمام للغرفة. تأكد من صحة الرمز.');
    } finally {
      setTimeout(() => setIsJoining(false), 1500);
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto p-3 sm:p-6 flex flex-col gap-6 text-white select-none">
      
      {/* Hero Welcome Banner */}
      <div className="relative rounded-3xl bg-gradient-to-r from-amber-600/30 via-purple-600/20 to-blue-600/30 border border-amber-500/30 p-5 sm:p-7 shadow-2xl overflow-hidden backdrop-blur-xl">
        <div className="absolute top-0 end-0 -mt-8 -me-8 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="bg-amber-500 text-slate-950 text-xs font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                LUDO ROYALE
              </span>
              {user.isVipMaster && (
                <span className="bg-gradient-to-r from-yellow-400 to-amber-500 text-slate-950 text-xs font-black px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Crown size={12} className="stroke-[3]" />
                  <span>VIP MASTER OWNER</span>
                </span>
              )}
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              {t.appName}
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl">
              {t.tagline} • العب مع أصدقائك أو لاعبين حول العالم برهانات افتراضية ورتب عالمية
            </p>
          </div>

          {/* Quick Account Switcher / Sign-In Button */}
          <div className="flex items-center gap-2">
            {!user.email ? (
              <button
                onClick={() => {
                  sound.playClick();
                  onOpenGoogleAuth();
                }}
                className="px-4 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs sm:text-sm flex items-center gap-2 shadow-lg transition-transform active:scale-95"
                id="google-signin-banner-btn"
              >
                <LogIn size={16} />
                <span>تسجيل الدخول / إنشاء حساب</span>
              </button>
            ) : (
              <button
                onClick={() => {
                  sound.playClick();
                  onOpenGoogleAuth();
                }}
                className="flex items-center gap-2 bg-slate-800/80 hover:bg-slate-700 border border-slate-600 px-3.5 py-2 rounded-2xl transition-colors"
              >
                {user.isVipMaster ? (
                  <Crown size={16} className="text-amber-400" />
                ) : (
                  <ShieldCheck size={16} className="text-emerald-400" />
                )}
                <span className="text-xs font-bold text-slate-200">
                  {user.name}
                </span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Game Modes Section */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-4 sm:p-6 shadow-2xl backdrop-blur-md">
        
        {/* Mode Navigation Tabs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-6">
          <button
            onClick={() => {
              sound.playClick();
              setActiveTab('online');
            }}
            className={`py-3 px-2 rounded-2xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all ${
              activeTab === 'online'
                ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20 font-black scale-102'
                : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-750'
            }`}
          >
            <Globe size={18} />
            <span>{t.playOnline}</span>
          </button>

          <button
            onClick={() => {
              sound.playClick();
              setActiveTab('private');
            }}
            className={`py-3 px-2 rounded-2xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all ${
              activeTab === 'private'
                ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20 font-black scale-102'
                : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-750'
            }`}
          >
            <Users size={18} />
            <span>{t.createPrivateRoom}</span>
          </button>

          <button
            onClick={() => {
              sound.playClick();
              setActiveTab('bot');
            }}
            className={`py-3 px-2 rounded-2xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all ${
              activeTab === 'bot'
                ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20 font-black scale-102'
                : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-750'
            }`}
          >
            <Bot size={18} />
            <span>{t.vsComputer}</span>
          </button>

          <button
            onClick={() => {
              sound.playClick();
              setActiveTab('local');
            }}
            className={`py-3 px-2 rounded-2xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all ${
              activeTab === 'local'
                ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20 font-black scale-102'
                : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-750'
            }`}
          >
            <Smartphone size={18} />
            <span>{t.passAndPlay}</span>
          </button>
        </div>

        {/* TAB 1: ONLINE QUICK MATCH */}
        {activeTab === 'online' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Player Mode Select (2P vs 3P vs 4P) */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-2">
                اختر عدد اللاعبين:
              </label>
              <div className="grid grid-cols-3 gap-3 max-w-lg">
                <button
                  type="button"
                  onClick={() => setSelectedMode('2p')}
                  className={`py-3 rounded-2xl border font-black text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-all ${
                    selectedMode === '2p'
                      ? 'bg-amber-500/20 border-amber-400 text-amber-300 shadow-md ring-2 ring-amber-400/40'
                      : 'bg-slate-800/80 border-slate-700 text-slate-400 hover:text-white'
                  }`}
                >
                  <Users size={16} />
                  <span>{t.players2}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedMode('3p')}
                  className={`py-3 rounded-2xl border font-black text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-all ${
                    selectedMode === '3p'
                      ? 'bg-amber-500/20 border-amber-400 text-amber-300 shadow-md ring-2 ring-amber-400/40'
                      : 'bg-slate-800/80 border-slate-700 text-slate-400 hover:text-white'
                  }`}
                >
                  <Users size={16} />
                  <span>{t.players3}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedMode('4p')}
                  className={`py-3 rounded-2xl border font-black text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-all ${
                    selectedMode === '4p'
                      ? 'bg-amber-500/20 border-amber-400 text-amber-300 shadow-md ring-2 ring-amber-400/40'
                      : 'bg-slate-800/80 border-slate-700 text-slate-400 hover:text-white'
                  }`}
                >
                  <Users size={16} />
                  <span>{t.players4}</span>
                </button>
              </div>
            </div>

            {/* Bet Selection */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-2">
                {t.entryBet} (ذهب):
              </label>
              <div className="flex flex-wrap gap-2">
                {BET_OPTIONS.map((bet) => (
                  <button
                    key={bet}
                    type="button"
                    onClick={() => setSelectedBet(bet)}
                    className={`py-2 px-3.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all ${
                      selectedBet === bet
                        ? 'bg-amber-500 text-slate-950 border-amber-400 font-black shadow-md scale-105'
                        : 'bg-slate-800 border-slate-700 text-slate-300 hover:border-slate-600'
                    }`}
                  >
                    <Coins size={13} />
                    <span>{bet.toLocaleString()}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Quick Match Action */}
            <div className="pt-2">
              <button
                onClick={() => {
                  sound.playClick();
                  onStartQuickMatch(selectedMode, selectedBet);
                }}
                className="w-full sm:w-auto min-w-[240px] py-4 px-8 rounded-2xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black text-base transition-all transform active:scale-95 shadow-xl flex items-center justify-center gap-2"
                id="start-quick-match-btn"
              >
                <Globe size={20} />
                <span>دخول مباراة أونلاين سريعة 🎲</span>
              </button>
            </div>

            {/* Active Public Rooms Browser */}
            {publicRooms.length > 0 && (
              <div className="mt-6 pt-4 border-t border-slate-800">
                <h3 className="text-xs font-bold text-slate-400 mb-3 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                    <span>الغرف المتاحة حالياً (لعب / مشاهدة):</span>
                  </div>
                  <span className="text-[11px] text-purple-300 flex items-center gap-1">
                    <Eye size={13} />
                    <span>متاح وضع المشاهدة لجميع المباريات</span>
                  </span>
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {publicRooms.map((room) => {
                    const isFull = room.playerCount >= room.maxPlayers;
                    const isPlaying = room.status === 'playing';

                    return (
                      <div
                        key={room.code}
                        className="bg-slate-800/60 border border-slate-700 rounded-2xl p-3 flex items-center justify-between hover:border-amber-500/50 transition-all"
                      >
                        <div>
                          <div className="font-bold text-xs text-white flex items-center gap-1.5">
                            <span>{room.name}</span>
                            {isPlaying && (
                              <span className="bg-red-500/20 text-red-400 border border-red-500/30 text-[9px] font-bold px-1.5 py-0.2 rounded-full flex items-center gap-1">
                                <Radio size={10} className="animate-pulse" />
                                <span>مباراة جارية</span>
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                            <span>{room.mode.toUpperCase()}</span>
                            <span>•</span>
                            <span className="text-amber-300 flex items-center gap-0.5">
                              <Coins size={11} /> {room.bet}
                            </span>
                            <span>•</span>
                            <span>{room.playerCount}/{room.maxPlayers} لاعب</span>
                            {room.spectatorCount > 0 && (
                              <>
                                <span>•</span>
                                <span className="text-purple-300 flex items-center gap-0.5">
                                  <Eye size={11} /> {room.spectatorCount}
                                </span>
                              </>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5">
                          {/* Join to Play Button if not full and waiting */}
                          {!isFull && !isPlaying ? (
                            <button
                              onClick={() => {
                                sound.playClick();
                                onJoinPrivateRoom(room.code, false);
                              }}
                              className="py-1.5 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs"
                            >
                              لعب 🎮
                            </button>
                          ) : null}

                          {/* Spectate Button */}
                          <button
                            onClick={() => {
                              sound.playClick();
                              onJoinPrivateRoom(room.code, true);
                            }}
                            className="py-1.5 px-2.5 rounded-xl bg-purple-600/80 hover:bg-purple-600 text-white font-bold text-xs flex items-center gap-1 border border-purple-500/50 shadow-sm"
                            title="مشاهدة المباراة مباشرة"
                          >
                            <Eye size={12} />
                            <span>مشاهدة</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: PRIVATE ROOM WITH FRIENDS */}
        {activeTab === 'private' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in duration-200">
            {/* Create Room Box */}
            <form onSubmit={handleCreateRoom} className="bg-slate-800/50 border border-slate-700 rounded-2xl p-4 sm:p-5 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 text-amber-400 font-black text-sm mb-4">
                  <Plus size={18} />
                  <span>{t.createPrivateRoom}</span>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-1">اسم الغرفة:</label>
                    <input
                      type="text"
                      value={roomNameInput}
                      onChange={(e) => setRoomNameInput(e.target.value)}
                      placeholder={`غرفة ${user.name}`}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-1">النمط:</label>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => setSelectedMode('2p')}
                        className={`py-2 rounded-xl text-xs font-bold border ${
                          selectedMode === '2p' ? 'bg-amber-500/20 border-amber-400 text-amber-300' : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
                        }`}
                      >
                        {t.players2}
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedMode('3p')}
                        className={`py-2 rounded-xl text-xs font-bold border ${
                          selectedMode === '3p' ? 'bg-amber-500/20 border-amber-400 text-amber-300' : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
                        }`}
                      >
                        {t.players3}
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedMode('4p')}
                        className={`py-2 rounded-xl text-xs font-bold border ${
                          selectedMode === '4p' ? 'bg-amber-500/20 border-amber-400 text-amber-300' : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
                        }`}
                      >
                        {t.players4}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-1">{t.entryBet} (ذهب):</label>
                    <div className="flex flex-wrap gap-1.5">
                      {[500, 1000, 2500, 5000].map((b) => (
                        <button
                          key={b}
                          type="button"
                          onClick={() => setSelectedBet(b)}
                          className={`py-1 px-2.5 rounded-lg border text-[11px] font-bold ${
                            selectedBet === b ? 'bg-amber-500 text-slate-950 border-amber-400' : 'bg-slate-800 border-slate-700 text-slate-400'
                          }`}
                        >
                          {b}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={isCreating}
                className="mt-6 w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-75 text-slate-950 font-black text-xs sm:text-sm shadow-md transition-transform active:scale-95 flex items-center justify-center gap-2"
                id="submit-create-room-btn"
              >
                {isCreating ? (
                  <>
                    <span className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></span>
                    <span>جارٍ إنشاء الغرفة...</span>
                  </>
                ) : (
                  t.createRoomBtn
                )}
              </button>
            </form>

            {/* Join by Code Box */}
            <form onSubmit={(e) => handleJoinRoom(e, false)} className="bg-slate-800/50 border border-slate-700 rounded-2xl p-4 sm:p-5 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2 text-emerald-400 font-black text-sm">
                    <LogIn size={18} />
                    <span>{t.joinPrivateRoom}</span>
                  </div>
                  <span className="text-[10px] bg-purple-500/20 text-purple-300 border border-purple-500/30 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                    <Eye size={10} />
                    <span>يدعم المشاهدة</span>
                  </span>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">{t.roomCode}:</label>
                  <input
                    type="text"
                    required
                    value={joinCodeInput}
                    onChange={(e) => {
                      setJoinCodeInput(e.target.value.toUpperCase());
                      setJoinError(null);
                    }}
                    placeholder="مثال: A7K9X2"
                    maxLength={10}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-center text-base tracking-widest uppercase font-black text-amber-300 placeholder-slate-500 focus:outline-none focus:border-emerald-400"
                  />
                  
                  {joinError && (
                    <div className="mt-2 p-2.5 rounded-xl bg-red-500/20 border border-red-500/40 text-red-300 text-xs text-center font-bold animate-shake">
                      ⚠️ {joinError}
                    </div>
                  )}

                  <p className="text-[11px] text-slate-400 mt-2">
                    اطلب رمز الغرفة من صديقك للانضمام للعب معه، أو ادخل كـ <b className="text-purple-300">مشاهد (Spectator)</b> لمتابعة المباراة مباشرة دون المشاركة!
                  </p>
                </div>
              </div>

              <div className="mt-6 flex flex-col sm:flex-row gap-2">
                {/* Join as Player button */}
                <button
                  type="submit"
                  disabled={!joinCodeInput.trim() || isJoining}
                  className="flex-1 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-black text-xs sm:text-sm shadow-md transition-transform active:scale-95 flex items-center justify-center gap-1.5"
                  id="submit-join-room-btn"
                >
                  {isJoining ? (
                    <>
                      <span className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></span>
                      <span>جارٍ الاتصال...</span>
                    </>
                  ) : (
                    <>
                      <LogIn size={15} />
                      <span>انضمام كلاعب 🎮</span>
                    </>
                  )}
                </button>

                {/* Join as Spectator button */}
                <button
                  type="button"
                  disabled={!joinCodeInput.trim() || isJoining}
                  onClick={(e) => handleJoinRoom(e, true)}
                  className="py-3 px-4 rounded-xl bg-purple-600/90 hover:bg-purple-600 disabled:opacity-50 text-white font-bold text-xs sm:text-sm shadow-md transition-transform active:scale-95 flex items-center justify-center gap-1.5 border border-purple-400/30"
                  id="submit-spectate-room-btn"
                >
                  <Eye size={15} />
                  <span>مشاهدة (Spectator) 👁️</span>
                </button>
              </div>
            </form>
          </div>
        )}

        {/* TAB 3: VS COMPUTER AI */}
        {activeTab === 'bot' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-2">
                {t.selectDifficulty}:
              </label>
              <div className="grid grid-cols-3 gap-3 max-w-lg">
                {[
                  { id: 'easy', label: t.easy, desc: 'حركات عشوائية وبسيطة' },
                  { id: 'medium', label: t.medium, desc: 'تكتيك متوازن واقتناص' },
                  { id: 'hard', label: t.hard, desc: 'ذكاء اصطناعي محترف وقاتل' },
                ].map((diff) => (
                  <button
                    key={diff.id}
                    type="button"
                    onClick={() => setBotDifficulty(diff.id as any)}
                    className={`p-3 rounded-2xl border text-center transition-all ${
                      botDifficulty === diff.id
                        ? 'bg-amber-500/20 border-amber-400 text-amber-300 shadow-md ring-2 ring-amber-400/40 font-black'
                        : 'bg-slate-800 border-slate-700 text-slate-400'
                    }`}
                  >
                    <div className="text-xs sm:text-sm font-bold">{diff.label}</div>
                    <div className="text-[10px] text-slate-400 mt-0.5 hidden sm:block">{diff.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-2">
                عدد اللاعبين:
              </label>
              <div className="grid grid-cols-3 gap-3 max-w-lg">
                <button
                  type="button"
                  onClick={() => setSelectedMode('2p')}
                  className={`py-2.5 rounded-xl border text-xs font-bold ${
                    selectedMode === '2p' ? 'bg-amber-500 text-slate-950 border-amber-400 font-black' : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
                  }`}
                >
                  {t.players2}
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedMode('3p')}
                  className={`py-2.5 rounded-xl border text-xs font-bold ${
                    selectedMode === '3p' ? 'bg-amber-500 text-slate-950 border-amber-400 font-black' : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
                  }`}
                >
                  {t.players3}
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedMode('4p')}
                  className={`py-2.5 rounded-xl border text-xs font-bold ${
                    selectedMode === '4p' ? 'bg-amber-500 text-slate-950 border-amber-400 font-black' : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
                  }`}
                >
                  {t.players4}
                </button>
              </div>
            </div>

            <button
              onClick={() => {
                sound.playClick();
                onStartVsBot(selectedMode, botDifficulty);
              }}
              className="py-3.5 px-8 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-sm shadow-xl transition-transform active:scale-95"
            >
              بدء اللعب ضد الروبوت الآن 🤖
            </button>
          </div>
        )}

        {/* TAB 4: PASS AND PLAY (LOCAL) */}
        {activeTab === 'local' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-2">
                اختر عدد اللاعبين على نفس الجهاز:
              </label>
              <div className="grid grid-cols-3 gap-3 max-w-md">
                {[2, 3, 4].map((count) => (
                  <button
                    key={count}
                    type="button"
                    onClick={() => setPassPlayCount(count as any)}
                    className={`py-3 rounded-2xl border text-sm font-black transition-all ${
                      passPlayCount === count
                        ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md'
                        : 'bg-slate-800 border-slate-700 text-slate-400'
                    }`}
                  >
                    {count} لاعبين
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={() => {
                sound.playClick();
                onStartPassAndPlay(passPlayCount);
              }}
              className="py-3.5 px-8 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-sm shadow-xl transition-transform active:scale-95"
            >
              بدء اللعبة المحلية 📱
            </button>
          </div>
        )}

      </div>
    </div>
  );
};
