import React, { useState } from 'react';
import { GameRoom, RoomPlayer, Spectator } from '../types/game';
import { Language, translations } from '../i18n/translations';
import { sound } from '../utils/soundEngine';
import { Copy, Check, Users, Play, LogOut, Crown, Bot, Sparkles, Coins, Eye, Radio } from 'lucide-react';

interface WaitingRoomProps {
  room: GameRoom;
  myPlayerId: string;
  isSpectator?: boolean;
  lang: Language;
  onStartGame: () => void;
  onLeaveRoom: () => void;
}

export const WaitingRoom: React.FC<WaitingRoomProps> = ({
  room,
  myPlayerId,
  isSpectator = false,
  lang,
  onStartGame,
  onLeaveRoom,
}) => {
  const [copied, setCopied] = useState(false);
  const t = translations[lang];

  const isHost = room.hostId === myPlayerId && !isSpectator;
  const maxPlayers = room.mode === '2p' ? 2 : room.mode === '3p' ? 3 : 4;
  const currentCount = room.players.length;
  const spectators = room.spectators || [];

  const handleCopyCode = () => {
    sound.playClick();
    navigator.clipboard.writeText(room.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-4 sm:p-6 text-white select-none">
      <div className="bg-slate-900/95 border-2 border-amber-500/30 rounded-3xl p-5 sm:p-8 shadow-2xl backdrop-blur-xl">
        
        {/* Spectator Status Banner */}
        {isSpectator && (
          <div className="mb-5 bg-gradient-to-r from-purple-900/60 via-indigo-900/60 to-purple-900/60 border border-purple-500/40 rounded-2xl p-3.5 flex items-center justify-between shadow-lg">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-purple-500/20 border border-purple-400/50 flex items-center justify-center text-purple-300">
                <Eye size={18} className="animate-pulse" />
              </div>
              <div className="text-start">
                <div className="text-xs font-black text-purple-200 flex items-center gap-1.5">
                  <span>وضع المشاهد (Spectator Mode)</span>
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                </div>
                <div className="text-[11px] text-purple-300/80">
                  أنت متصل كمشاهد • ستتابع مجريات المباراة مباشرة فور بدء اللعب
                </div>
              </div>
            </div>
            <span className="text-[10px] bg-purple-500/30 text-purple-200 border border-purple-400/30 px-2.5 py-1 rounded-full font-bold">
              بث مباشر 🔴
            </span>
          </div>
        )}

        {/* Room Header & Room Code Box */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-6 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="bg-amber-500 text-slate-950 text-xs font-black px-2 py-0.5 rounded-full">
                {room.mode.toUpperCase()} MATCH
              </span>
              <span className="text-xs text-slate-400">غرفة خاصة</span>
              {spectators.length > 0 && (
                <span className="bg-purple-500/20 border border-purple-500/40 text-purple-300 text-xs font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Eye size={12} />
                  <span>{spectators.length} مشاهد</span>
                </span>
              )}
            </div>
            <h2 className="text-xl font-black text-white mt-1">{room.name}</h2>
          </div>

          {/* Copyable Room Code */}
          <div className="flex items-center gap-2 bg-slate-950 border border-slate-700 rounded-2xl p-2 px-3 shadow-inner">
            <div className="text-start">
              <div className="text-[10px] text-slate-400 font-bold uppercase">{t.roomCode}</div>
              <div className="text-lg font-black text-amber-400 tracking-widest">{room.code}</div>
            </div>
            <button
              onClick={handleCopyCode}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
              title={t.copyCode}
            >
              {copied ? <Check size={18} className="text-emerald-400" /> : <Copy size={18} />}
            </button>
          </div>
        </div>

        {/* Bet Pool Info */}
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-3 my-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Coins size={18} className="text-amber-400" />
            <span className="text-xs text-slate-300">رهان الدخول: <b className="text-amber-300">{room.bet} ذهب</b></span>
          </div>
          <div className="text-xs text-slate-300">
            مجموع الجائزة: <b className="text-amber-400">{(room.bet * maxPlayers).toLocaleString()} ذهب 🏆</b>
          </div>
        </div>

        {/* Players Grid */}
        <div className="my-6">
          <div className="text-xs font-bold text-slate-400 mb-3 flex items-center justify-between">
            <span>اللاعبون المنضمون ({currentCount}/{maxPlayers}):</span>
            <span className="text-[11px] text-emerald-400 animate-pulse">في انتظار البدء...</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {room.players.map((p) => {
              const isRoomHost = p.id === room.hostId;
              const isMe = p.id === myPlayerId && !isSpectator;

              return (
                <div
                  key={p.id}
                  className="bg-slate-800/70 border border-slate-700 rounded-2xl p-3 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <img src={p.avatar} alt="" className="w-10 h-10 rounded-full bg-slate-700 object-cover border" />
                      {isRoomHost && (
                        <Crown size={12} className="absolute -top-1 -right-1 text-amber-400 fill-amber-400" />
                      )}
                    </div>
                    <div className="text-start">
                      <div className="font-bold text-xs sm:text-sm text-white flex items-center gap-1">
                        <span>{p.name}</span>
                        {isMe && <span className="bg-amber-500 text-slate-950 text-[9px] font-black px-1 rounded">أنت</span>}
                      </div>
                      <div className="text-[10px] text-slate-400 capitalize">
                        اللون: {p.color}
                      </div>
                    </div>
                  </div>

                  <span className="bg-emerald-500/20 text-emerald-400 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-500/30">
                    جاهز ✓
                  </span>
                </div>
              );
            })}

            {/* Empty Slots */}
            {Array.from({ length: Math.max(0, maxPlayers - currentCount) }).map((_, i) => (
              <div
                key={`empty-${i}`}
                className="bg-slate-950/40 border border-dashed border-slate-800 rounded-2xl p-3 flex items-center justify-center text-slate-600 text-xs font-semibold"
              >
                <Users size={16} className="me-1.5 opacity-50" />
                <span>مكان شاغر (سيملأ بروبوت عند البدء)</span>
              </div>
            ))}
          </div>
        </div>

        {/* Live Spectator Lounge Section */}
        {spectators.length > 0 && (
          <div className="my-5 pt-4 border-t border-slate-800">
            <div className="text-xs font-bold text-purple-300 mb-2.5 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Eye size={14} className="text-purple-400" />
                <span>المشاهدون الحاضرون في الغرفة ({spectators.length}):</span>
              </span>
              <span className="text-[10px] text-slate-400">بث مباشر للمباراة</span>
            </div>

            <div className="flex flex-wrap gap-2">
              {spectators.map((spec) => {
                const isMeSpec = spec.id === myPlayerId;
                return (
                  <div
                    key={spec.id}
                    className={`flex items-center gap-2 bg-slate-800/80 border rounded-xl py-1 px-2.5 ${
                      isMeSpec ? 'border-purple-400/80 bg-purple-950/40 text-purple-200' : 'border-slate-700 text-slate-300'
                    }`}
                  >
                    <img src={spec.avatar} alt="" className="w-5 h-5 rounded-full bg-slate-700 object-cover" />
                    <span className="text-xs font-semibold">
                      {spec.name} {isMeSpec && '(أنت)'}
                    </span>
                    <span className="text-[10px] text-purple-400">👁️</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Action Controls */}
        <div className="flex items-center justify-between gap-3 pt-4 border-t border-slate-800">
          <button
            onClick={() => {
              sound.playClick();
              onLeaveRoom();
            }}
            className="py-3 px-5 rounded-2xl bg-slate-800 hover:bg-slate-750 text-slate-400 hover:text-white font-bold text-xs sm:text-sm flex items-center gap-2 transition-colors"
          >
            <LogOut size={16} />
            <span>{isSpectator ? 'مغادرة المشاهدة' : 'مغادرة الغرفة'}</span>
          </button>

          {isHost ? (
            <button
              onClick={() => {
                sound.playClick();
                onStartGame();
              }}
              className="py-3.5 px-8 rounded-2xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black text-sm shadow-xl flex items-center gap-2 transition-transform active:scale-95"
            >
              <Play size={18} />
              <span>{t.startGame}</span>
            </button>
          ) : isSpectator ? (
            <div className="text-xs text-purple-300 font-semibold flex items-center gap-1.5 animate-pulse">
              <Radio size={14} className="text-red-400" />
              <span>أنت في وضع المشاهدة، بانتظار إطلاق صافرة البداية...</span>
            </div>
          ) : (
            <div className="text-xs text-slate-400 font-semibold animate-pulse">
              في انتظار بدء اللعبة من قِبل منشئ الغرفة...
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
