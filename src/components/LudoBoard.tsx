import React, { useMemo, useState } from 'react';
import { GamePlayer, PlayerColor, Spectator } from '../types/game';
import { 
  MAIN_PATH_COORDINATES, 
  HOME_CORRIDORS, 
  BASE_COORDINATES, 
  GOAL_COORDINATES, 
  SAFE_INDICES, 
  COLOR_START_INDEX,
  canPawnMove,
  getPawnCoordinate
} from '../game/ludoEngine';
import { PAWN_SKINS, BOARD_SKINS } from '../data/skins';
import { sound } from '../utils/soundEngine';
import { DiceRoller } from './DiceRoller';
import { Crown, Star, Sparkles, Trophy, Bot, Eye, Smile, Clock } from 'lucide-react';

interface FlyingEmoji {
  id: string;
  emoji: string;
  fromPlayerColor: PlayerColor;
  toPlayerColor: PlayerColor;
}

interface LudoBoardProps {
  players: GamePlayer[];
  currentTurnColor: PlayerColor;
  diceValue: number | null;
  hasRolled: boolean;
  myColor: PlayerColor;
  isMyTurn: boolean;
  boardSkinId: string;
  pawnSkinId: string;
  diceSkinId: string;
  onRollDice: () => void;
  onSelectPawn: (pawnIndex: number) => void;
  flyingEmojis: FlyingEmoji[];
  isOnlineMode?: boolean;
  isSpectator?: boolean;
  spectators?: Spectator[];
  onSendSpectatorEmoji?: (emoji: string) => void;
  isMovingPawn?: boolean;
  movingPawnInfo?: { color: PlayerColor; pawnIndex: number } | null;
  turnTimer?: number;
  maxTurnTime?: number;
}

export const LudoBoard: React.FC<LudoBoardProps> = ({
  players,
  currentTurnColor,
  diceValue,
  hasRolled,
  myColor,
  isMyTurn,
  boardSkinId,
  pawnSkinId,
  diceSkinId,
  onRollDice,
  onSelectPawn,
  flyingEmojis,
  isOnlineMode = false,
  isSpectator = false,
  spectators = [],
  onSendSpectatorEmoji,
  isMovingPawn = false,
  movingPawnInfo = null,
  turnTimer = 30,
  maxTurnTime = 30,
}) => {
  const [showSpectatorList, setShowSpectatorList] = useState(false);
  const currentBoardSkin = BOARD_SKINS.find((b) => b.id === boardSkinId) || BOARD_SKINS[0];
  const currentPawnSkin = PAWN_SKINS.find((p) => p.id === pawnSkinId) || PAWN_SKINS[0];

  // Map overlapping pawns on the same grid tile so they never completely obscure each other
  const tilePawnMap = useMemo(() => {
    const map: Record<string, { color: PlayerColor; pawnIdx: number }[]> = {};
    players.forEach((player) => {
      player.pawns.forEach((pos, pawnIdx) => {
        const coord = getPawnCoordinate(player.color, pawnIdx, pos);
        const key = `${coord.row.toFixed(1)}_${coord.col.toFixed(1)}`;
        if (!map[key]) map[key] = [];
        map[key].push({ color: player.color, pawnIdx });
      });
    });
    return map;
  }, [players]);

  // Map players by color for quick lookup
  const playerMap = useMemo(() => {
    const map: Partial<Record<PlayerColor, GamePlayer>> = {};
    players.forEach((p) => {
      map[p.color] = p;
    });
    return map;
  }, [players]);

  // Color schemes for board quadrants
  const colorThemes = {
    red: {
      primary: '#ef4444',
      light: '#fee2e2',
      dark: '#991b1b',
      border: '#dc2626',
      star: '#f87171',
    },
    green: {
      primary: '#10b981',
      light: '#d1fae5',
      dark: '#065f46',
      border: '#059669',
      star: '#34d399',
    },
    yellow: {
      primary: '#eab308',
      light: '#fef9c3',
      dark: '#854d0e',
      border: '#ca8a04',
      star: '#fde047',
    },
    blue: {
      primary: '#3b82f6',
      light: '#dbeafe',
      dark: '#1e40af',
      border: '#2563eb',
      star: '#60a5fa',
    },
  };

  const COLOR_CYCLE: PlayerColor[] = ['red', 'green', 'yellow', 'blue'];

  const BOARD_ROTATIONS: Record<PlayerColor, number> = {
    red: 0,
    green: 270,
    yellow: 180,
    blue: 90,
  };

  const boardAngle = isSpectator ? 0 : (BOARD_ROTATIONS[myColor] ?? 0);

  // Dynamic relative corner slot positioning
  // Bottom-Left slot is ALWAYS myColor (the current player / viewer)
  const myIdx = isSpectator ? 0 : COLOR_CYCLE.indexOf(myColor);
  const bottomLeftColor = COLOR_CYCLE[(myIdx + 0) % 4];
  const topLeftColor = COLOR_CYCLE[(myIdx + 1) % 4];
  const topRightColor = COLOR_CYCLE[(myIdx + 2) % 4];
  const bottomRightColor = COLOR_CYCLE[(myIdx + 3) % 4];

  // Find valid movable pawns for current active player
  const activePlayer = playerMap[currentTurnColor];
  const movablePawnIndices: number[] = useMemo(() => {
    if (isSpectator || !activePlayer || diceValue === null || !hasRolled) return [];
    const valid: number[] = [];
    activePlayer.pawns.forEach((pos, idx) => {
      if (canPawnMove(currentTurnColor, pos, diceValue)) {
        valid.push(idx);
      }
    });
    return valid;
  }, [activePlayer, currentTurnColor, diceValue, hasRolled, isSpectator]);

  // Render a player panel box in corner
  const renderPlayerBadge = (color: PlayerColor, cornerPos: string) => {
    const p = playerMap[color];
    const isCurrent = currentTurnColor === color;

    // Do not render empty/ghost cards for inactive colors
    if (!p) {
      return null;
    }

    const theme = colorThemes[color];
    const isMe = !isSpectator && (p.color === myColor || (!isOnlineMode && !p.isBot));

    return (
      <div
        className={`absolute ${cornerPos} z-20 flex items-center gap-2 sm:gap-2.5 p-1.5 sm:p-2 rounded-2xl border transition-all duration-300 backdrop-blur-md ${
          isCurrent
            ? 'bg-slate-900/95 ring-2 ring-amber-400 shadow-[0_0_18px_rgba(251,191,36,0.65)] scale-105'
            : isMe
            ? 'bg-slate-900/90 border-amber-400/60 shadow-md'
            : 'bg-slate-900/80 border-slate-700/80'
        }`}
        style={{ borderColor: isCurrent ? '#fbbf24' : isMe ? theme.primary : theme.primary }}
      >
        <div className="relative">
          <img
            src={p.avatar}
            alt={p.name}
            className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-slate-800 object-cover border-2 shadow-sm"
            style={{ borderColor: theme.primary }}
          />
          {p.isBot && (
            <div className="absolute -top-1 -right-1 bg-slate-700 text-slate-200 rounded-full p-0.5" title="Bot">
              <Bot size={10} />
            </div>
          )}
          {/* Pawns home counter */}
          <div 
            className="absolute -bottom-1 -right-1 text-white text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center border border-slate-900 shadow-sm"
            style={{ backgroundColor: theme.primary }}
            title="البيادق التي وصلت إلى النهاية"
          >
            {p.pawns.filter((pos) => pos === 200).length}
          </div>
        </div>

        <div className="text-start pr-1 min-w-[65px] sm:min-w-[85px]">
          <div className="flex items-center gap-1">
            <span className="text-xs sm:text-sm font-bold text-white max-w-[75px] sm:max-w-[110px] truncate">
              {p.name}
            </span>
            {isMe && (
              <span className="bg-amber-500 text-slate-950 text-[9px] font-black px-1.5 py-0.2 rounded shadow-xs">
                أنت
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5 mt-0.5">
            <span 
              className="inline-block w-2 h-2 rounded-full shadow-xs" 
              style={{ backgroundColor: theme.primary }}
            ></span>
            <span className="text-[10px] text-slate-400 font-medium capitalize">
              {color === 'red' ? 'أحمر' : color === 'yellow' ? 'أصفر' : color === 'green' ? 'أخضر' : 'أزرق'}
            </span>
            {isCurrent && (
              <div className={`flex items-center gap-0.5 px-1 py-0.2 rounded-full text-[9px] font-bold font-mono transition-colors ${
                turnTimer <= 5
                  ? 'bg-red-500/30 text-red-300 border border-red-500/60 animate-pulse'
                  : turnTimer <= 10
                  ? 'bg-amber-500/25 text-amber-300 border border-amber-500/40'
                  : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
              }`}>
                <Clock size={9} className={turnTimer <= 5 ? 'animate-spin' : ''} />
                <span>{turnTimer}ث</span>
              </div>
            )}
          </div>
        </div>

        {/* Dice attached to player if active turn */}
        {isCurrent && (
          <div className="ms-1">
            <DiceRoller
              diceValue={diceValue}
              hasRolled={hasRolled}
              isMyTurn={!isSpectator && isMe && isMyTurn}
              diceSkinId={p.diceSkin || diceSkinId}
              onRoll={onRollDice}
              disabled={isSpectator || p.isBot || !isMe || isMovingPawn}
            />
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="relative flex flex-col items-center justify-center p-2 sm:p-4 max-w-full overflow-hidden">
      {/* Live Spectator Mode Header Bar */}
      <div className="w-full max-w-[620px] mb-2 flex items-center justify-between gap-2 px-1">
        {isSpectator ? (
          <div className="flex items-center gap-2 bg-gradient-to-r from-purple-950/80 via-indigo-950/80 to-purple-950/80 border border-purple-500/50 px-3 py-1.5 rounded-2xl shadow-lg backdrop-blur-md">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-ping"></span>
            <div className="flex items-center gap-1.5 text-xs font-black text-purple-200">
              <Eye size={14} className="text-purple-400" />
              <span>وضع المشاهد (بث مباشر) 👁️</span>
            </div>
          </div>
        ) : (
          <div className="text-[11px] text-slate-400 font-semibold flex items-center gap-1">
            <span>مباراة لودو رويال</span>
          </div>
        )}

        {/* Spectator Count Badge (Clickable to view who is watching) */}
        {spectators.length > 0 && (
          <div className="relative">
            <button
              onClick={() => setShowSpectatorList(!showSpectatorList)}
              className="flex items-center gap-1.5 bg-slate-900/90 hover:bg-slate-800 border border-purple-500/40 px-2.5 py-1 rounded-full text-xs text-purple-300 font-bold shadow-md transition-all active:scale-95"
              title="المشاهدون المباشرون"
            >
              <Eye size={14} className="text-purple-400 animate-pulse" />
              <span>{spectators.length} مشاهد</span>
            </button>

            {/* Spectator Dropdown List */}
            {showSpectatorList && (
              <div className="absolute top-8 end-0 z-50 w-52 bg-slate-900/95 border border-purple-500/40 rounded-2xl p-2.5 shadow-2xl backdrop-blur-xl animate-in fade-in zoom-in-95 duration-200">
                <div className="text-[11px] font-bold text-purple-300 mb-2 pb-1 border-b border-slate-800 flex items-center justify-between">
                  <span>المشاهدون الآن ({spectators.length}):</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                </div>
                <div className="max-h-36 overflow-y-auto space-y-1.5">
                  {spectators.map((spec) => (
                    <div key={spec.id} className="flex items-center gap-2 text-xs text-slate-200 bg-slate-800/60 p-1.5 rounded-xl">
                      <img src={spec.avatar} alt="" className="w-5 h-5 rounded-full bg-slate-700 object-cover" />
                      <span className="truncate font-semibold">{spec.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Top 2 Player Panels (Dynamic Perspective) */}
      <div className="w-full max-w-[620px] relative h-12 mb-2">
        {renderPlayerBadge(topLeftColor, 'top-0 left-0')}
        {renderPlayerBadge(topRightColor, 'top-0 right-0')}
      </div>

      {/* 30-Second Turn Countdown & Active Player Bar */}
      <div className="w-full max-w-[340px] sm:max-w-[480px] md:max-w-[540px] mb-2 bg-slate-900/90 border border-slate-800 rounded-2xl p-2 px-3 shadow-lg backdrop-blur-md select-none">
        <div className="flex items-center justify-between gap-2 mb-1.5">
          <div className="flex items-center gap-2">
            <span
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: colorThemes[currentTurnColor]?.primary || '#fbbf24' }}
            />
            <span className="text-xs font-bold text-white flex items-center gap-1 truncate max-w-[200px] sm:max-w-[320px]">
              {!isSpectator && currentTurnColor === myColor ? (
                <span className="text-amber-300 font-black">🎯 دورك الآن للعب!</span>
              ) : (
                <span>
                  🎲 دور:{' '}
                  <strong style={{ color: colorThemes[currentTurnColor]?.primary || '#fbbf24' }}>
                    {activePlayer?.name || currentTurnColor}
                  </strong>
                </span>
              )}
            </span>
          </div>

          <div
            className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-full font-mono text-xs font-black transition-colors ${
              turnTimer <= 5
                ? 'bg-red-600 text-white animate-pulse shadow-md shadow-red-600/50'
                : turnTimer <= 10
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : 'bg-slate-800 text-amber-300 border border-slate-700'
            }`}
          >
            <Clock size={12} className={turnTimer <= 5 ? 'text-white' : 'text-amber-400'} />
            <span className="tabular-nums">{turnTimer} ث</span>
          </div>
        </div>

        {/* 30s Countdown Progress Bar without transition jump on reset */}
        <div className="w-full h-1.5 bg-slate-950/90 rounded-full overflow-hidden p-0.5 border border-slate-800/80">
          <div
            className={`h-full rounded-full ${
              turnTimer <= 5
                ? 'bg-gradient-to-r from-red-600 to-rose-400'
                : turnTimer <= 10
                ? 'bg-gradient-to-r from-amber-500 to-yellow-300'
                : 'bg-gradient-to-r from-emerald-500 to-teal-300'
            }`}
            style={{
              width: `${Math.max(0, Math.min(100, (turnTimer / maxTurnTime) * 100))}%`,
              transition: turnTimer === maxTurnTime ? 'none' : 'width 1s linear',
            }}
          />
        </div>
      </div>

      {/* Main Board Container */}
      <div className="relative w-full max-w-[340px] sm:max-w-[480px] md:max-w-[540px] aspect-square rounded-2xl shadow-2xl p-2 select-none border-4 border-amber-600/40 bg-slate-950">
        
        {/* SVG Board Rendering for High Precision & Crisp Scaling with Player-Centric Rotation */}
        <svg
          viewBox="0 0 15 15"
          className="w-full h-full rounded-xl overflow-hidden shadow-inner transition-transform duration-500 ease-out"
          style={{
            backgroundColor: currentBoardSkin.boardBg,
            transform: `rotate(${boardAngle}deg)`,
          }}
        >
          <defs>
            {/* Gradients for Home Base Corners */}
            <radialGradient id="greenBaseGrad" cx="30%" cy="30%" r="70%">
              <stop offset="0%" stopColor="#34d399" />
              <stop offset="100%" stopColor="#059669" />
            </radialGradient>
            <radialGradient id="yellowBaseGrad" cx="30%" cy="30%" r="70%">
              <stop offset="0%" stopColor="#fde047" />
              <stop offset="100%" stopColor="#ca8a04" />
            </radialGradient>
            <radialGradient id="redBaseGrad" cx="30%" cy="30%" r="70%">
              <stop offset="0%" stopColor="#f87171" />
              <stop offset="100%" stopColor="#dc2626" />
            </radialGradient>
            <radialGradient id="blueBaseGrad" cx="30%" cy="30%" r="70%">
              <stop offset="0%" stopColor="#60a5fa" />
              <stop offset="100%" stopColor="#2563eb" />
            </radialGradient>
            <radialGradient id="centerTrophyGrad" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#fef08a" />
              <stop offset="100%" stopColor="#ca8a04" />
            </radialGradient>
          </defs>

          {/* 1. Base Quadrants (6x6 cells each corner) */}
          {/* Top-Left: Green Base */}
          <rect x="0" y="0" width="6" height="6" fill="url(#greenBaseGrad)" stroke="#047857" strokeWidth="0.08" />
          <rect x="1" y="1" width="4" height="4" rx="0.5" fill="#ffffff" stroke="#059669" strokeWidth="0.06" opacity="0.95" />
          
          {/* Top-Right: Yellow Base */}
          <rect x="9" y="0" width="6" height="6" fill="url(#yellowBaseGrad)" stroke="#a16207" strokeWidth="0.08" />
          <rect x="10" y="1" width="4" height="4" rx="0.5" fill="#ffffff" stroke="#ca8a04" strokeWidth="0.06" opacity="0.95" />

          {/* Bottom-Left: Red Base */}
          <rect x="0" y="9" width="6" height="6" fill="url(#redBaseGrad)" stroke="#b91c1c" strokeWidth="0.08" />
          <rect x="1" y="10" width="4" height="4" rx="0.5" fill="#ffffff" stroke="#dc2626" strokeWidth="0.06" opacity="0.95" />

          {/* Bottom-Right: Blue Base */}
          <rect x="9" y="9" width="6" height="6" fill="url(#blueBaseGrad)" stroke="#1d4ed8" strokeWidth="0.08" />
          <rect x="10" y="10" width="4" height="4" rx="0.5" fill="#ffffff" stroke="#2563eb" strokeWidth="0.06" opacity="0.95" />

          {/* Base Inner Token Wells (4 per base) */}
          {(['green', 'yellow', 'red', 'blue'] as PlayerColor[]).forEach((col) => {
            const coords = BASE_COORDINATES[col];
            coords.forEach((coord, idx) => {
              // Circle wells
            });
          })}

          {/* Green base 4 inner circles */}
          <circle cx="2" cy="2" r="0.75" fill="#10b981" stroke="#065f46" strokeWidth="0.06" />
          <circle cx="4" cy="2" r="0.75" fill="#10b981" stroke="#065f46" strokeWidth="0.06" />
          <circle cx="2" cy="4" r="0.75" fill="#10b981" stroke="#065f46" strokeWidth="0.06" />
          <circle cx="4" cy="4" r="0.75" fill="#10b981" stroke="#065f46" strokeWidth="0.06" />

          {/* Yellow base 4 inner circles */}
          <circle cx="11" cy="2" r="0.75" fill="#eab308" stroke="#854d0e" strokeWidth="0.06" />
          <circle cx="13" cy="2" r="0.75" fill="#eab308" stroke="#854d0e" strokeWidth="0.06" />
          <circle cx="11" cy="4" r="0.75" fill="#eab308" stroke="#854d0e" strokeWidth="0.06" />
          <circle cx="13" cy="4" r="0.75" fill="#eab308" stroke="#854d0e" strokeWidth="0.06" />

          {/* Red base 4 inner circles */}
          <circle cx="2" cy="11" r="0.75" fill="#ef4444" stroke="#991b1b" strokeWidth="0.06" />
          <circle cx="4" cy="11" r="0.75" fill="#ef4444" stroke="#991b1b" strokeWidth="0.06" />
          <circle cx="2" cy="13" r="0.75" fill="#ef4444" stroke="#991b1b" strokeWidth="0.06" />
          <circle cx="4" cy="13" r="0.75" fill="#ef4444" stroke="#991b1b" strokeWidth="0.06" />

          {/* Blue base 4 inner circles */}
          <circle cx="11" cy="11" r="0.75" fill="#3b82f6" stroke="#1e40af" strokeWidth="0.06" />
          <circle cx="13" cy="11" r="0.75" fill="#3b82f6" stroke="#1e40af" strokeWidth="0.06" />
          <circle cx="11" cy="13" r="0.75" fill="#3b82f6" stroke="#1e40af" strokeWidth="0.06" />
          <circle cx="13" cy="13" r="0.75" fill="#3b82f6" stroke="#1e40af" strokeWidth="0.06" />

          {/* 2. Common Track Tiles (52 Cells) */}
          {MAIN_PATH_COORDINATES.map((coord, idx) => {
            const isSafe = SAFE_INDICES.includes(idx);
            let tileFill = currentBoardSkin.pathTileBg;
            let tileStroke = currentBoardSkin.gridLineColor;

            // Highlight start tiles
            if (idx === COLOR_START_INDEX.red) tileFill = colorThemes.red.primary;
            if (idx === COLOR_START_INDEX.green) tileFill = colorThemes.green.primary;
            if (idx === COLOR_START_INDEX.yellow) tileFill = colorThemes.yellow.primary;
            if (idx === COLOR_START_INDEX.blue) tileFill = colorThemes.blue.primary;

            return (
              <g key={`main-tile-${idx}`}>
                <rect
                  x={coord.col}
                  y={coord.row}
                  width="1"
                  height="1"
                  fill={tileFill}
                  stroke={tileStroke}
                  strokeWidth="0.04"
                />
                {/* Safe Star Icon on Safe Squares */}
                {isSafe && (
                  <text
                    x={coord.col + 0.5}
                    y={coord.row + 0.68}
                    textAnchor="middle"
                    fontSize="0.55"
                    fill={idx === 0 || idx === 13 || idx === 26 || idx === 39 ? '#ffffff' : '#f59e0b'}
                    fontWeight="bold"
                  >
                    ★
                  </text>
                )}
              </g>
            );
          })}

          {/* 3. Home Stretch Corridors (5 Cells per color) */}
          {HOME_CORRIDORS.red.map((coord, i) => (
            <rect
              key={`red-home-${i}`}
              x={coord.col}
              y={coord.row}
              width="1"
              height="1"
              fill={colorThemes.red.primary}
              stroke="#b91c1c"
              strokeWidth="0.04"
            />
          ))}
          {HOME_CORRIDORS.green.map((coord, i) => (
            <rect
              key={`green-home-${i}`}
              x={coord.col}
              y={coord.row}
              width="1"
              height="1"
              fill={colorThemes.green.primary}
              stroke="#047857"
              strokeWidth="0.04"
            />
          ))}
          {HOME_CORRIDORS.yellow.map((coord, i) => (
            <rect
              key={`yellow-home-${i}`}
              x={coord.col}
              y={coord.row}
              width="1"
              height="1"
              fill={colorThemes.yellow.primary}
              stroke="#a16207"
              strokeWidth="0.04"
            />
          ))}
          {HOME_CORRIDORS.blue.map((coord, i) => (
            <rect
              key={`blue-home-${i}`}
              x={coord.col}
              y={coord.row}
              width="1"
              height="1"
              fill={colorThemes.blue.primary}
              stroke="#1d4ed8"
              strokeWidth="0.04"
            />
          ))}

          {/* 4. Center Triangle Goal (3x3 at rows 6..8, cols 6..8) */}
          {/* Top Triangle (Yellow) */}
          <polygon points="6,6 9,6 7.5,7.5" fill={colorThemes.yellow.primary} stroke="#a16207" strokeWidth="0.04" />
          {/* Right Triangle (Blue) */}
          <polygon points="9,6 9,9 7.5,7.5" fill={colorThemes.blue.primary} stroke="#1d4ed8" strokeWidth="0.04" />
          {/* Bottom Triangle (Red) */}
          <polygon points="6,9 9,9 7.5,7.5" fill={colorThemes.red.primary} stroke="#b91c1c" strokeWidth="0.04" />
          {/* Left Triangle (Green) */}
          <polygon points="6,6 6,9 7.5,7.5" fill={colorThemes.green.primary} stroke="#047857" strokeWidth="0.04" />

          {/* Center Trophy / Star Icon */}
          <circle cx="7.5" cy="7.5" r="0.8" fill="url(#centerTrophyGrad)" stroke="#a16207" strokeWidth="0.05" />
          <text x="7.5" y="7.8" textAnchor="middle" fontSize="0.75" fill="#78350f" fontWeight="bold">
            👑
          </text>

          {/* 5. Render Pawns for all players with 3D Hop Animation & Overlap Management */}
          {players.map((player) => {
            const isPlayerActive = currentTurnColor === player.color;
            const isMe = !isSpectator && (player.color === myColor || (!isOnlineMode && !player.isBot));

            return player.pawns.map((pos, pawnIdx) => {
              const coord = getPawnCoordinate(player.color, pawnIdx, pos);
              const isMovable = !isSpectator && isPlayerActive && isMyTurn && isMe && movablePawnIndices.includes(pawnIdx);

              // Pawn Palette from skin
              const palette = currentPawnSkin.colorPalette;
              const pawnColor = palette[player.color];

              // Anti-overlap offset calculation
              const tileKey = `${coord.row.toFixed(1)}_${coord.col.toFixed(1)}`;
              const pawnsOnTile = tilePawnMap[tileKey] || [];
              const onTileIndex = pawnsOnTile.findIndex(
                (p) => p.color === player.color && p.pawnIdx === pawnIdx
              );
              const countOnTile = pawnsOnTile.length;

              let offsetX = 0;
              let offsetY = 0;
              let baseScale = 1;

              if (countOnTile === 2) {
                offsetX = onTileIndex === 0 ? -0.15 : 0.15;
                offsetY = onTileIndex === 0 ? -0.15 : 0.15;
                baseScale = 0.86;
              } else if (countOnTile === 3) {
                if (onTileIndex === 0) { offsetX = -0.16; offsetY = -0.14; }
                else if (onTileIndex === 1) { offsetX = 0.16; offsetY = -0.14; }
                else { offsetX = 0; offsetY = 0.16; }
                baseScale = 0.76;
              } else if (countOnTile >= 4) {
                if (onTileIndex === 0) { offsetX = -0.16; offsetY = -0.16; }
                else if (onTileIndex === 1) { offsetX = 0.16; offsetY = -0.16; }
                else if (onTileIndex === 2) { offsetX = -0.16; offsetY = 0.16; }
                else { offsetX = 0.16; offsetY = 0.16; }
                baseScale = 0.72;
              }

              const isCurrentlyJumping =
                movingPawnInfo?.color === player.color &&
                movingPawnInfo?.pawnIndex === pawnIdx;

              const finalScale = isCurrentlyJumping ? 1.3 : baseScale;

              return (
                <g
                  key={`pawn-${player.color}-${pawnIdx}`}
                  transform={`translate(${coord.col + 0.5 + offsetX}, ${coord.row + 0.5 + offsetY}) rotate(${-boardAngle})`}
                  style={{
                    transition: 'transform 0.22s cubic-bezier(0.34, 1.56, 0.64, 1)',
                  }}
                  className={isMovable && !isMovingPawn ? 'cursor-pointer' : ''}
                  onClick={() => {
                    if (isMovable && !isMovingPawn) {
                      sound.playStep();
                      onSelectPawn(pawnIdx);
                    }
                  }}
                >
                  <g
                    transform={`scale(${finalScale})`}
                    style={{
                      transition: 'transform 0.18s cubic-bezier(0.34, 1.56, 0.64, 1)',
                    }}
                  >
                    {/* Movable Aura Highlight */}
                    {isMovable && !isMovingPawn && (
                      <>
                        <circle
                          cx={0}
                          cy={0}
                          r="0.58"
                          fill="none"
                          stroke="#fbbf24"
                          strokeWidth="0.1"
                          className="animate-ping opacity-75"
                        />
                        <circle
                          cx={0}
                          cy={0}
                          r="0.52"
                          fill="none"
                          stroke="#f59e0b"
                          strokeWidth="0.06"
                          className="animate-pulse"
                        />
                      </>
                    )}

                    {/* Pawn Shadow (drops down when jumping) */}
                    <ellipse
                      cx={0}
                      cy={isCurrentlyJumping ? 0.35 : 0.16}
                      rx={isCurrentlyJumping ? 0.26 : 0.38}
                      ry={isCurrentlyJumping ? 0.12 : 0.18}
                      fill="rgba(0,0,0,0.35)"
                      style={{
                        transition: 'all 0.18s ease-out',
                      }}
                    />

                    {/* Pawn Outer Body */}
                    <circle
                      cx={0}
                      cy={isCurrentlyJumping ? -0.2 : 0}
                      r="0.42"
                      fill={pawnColor}
                      stroke={isMovable ? '#ffffff' : palette.border}
                      strokeWidth={isMovable ? '0.08' : '0.05'}
                      style={{
                        filter: isCurrentlyJumping
                          ? 'drop-shadow(0 8px 12px rgba(0,0,0,0.5))'
                          : 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))',
                        transition: 'all 0.18s ease-out',
                      }}
                    />

                    {/* Pawn Inner Shine / Dome */}
                    <circle
                      cx={-0.08}
                      cy={isCurrentlyJumping ? -0.28 : -0.08}
                      r="0.2"
                      fill="#ffffff"
                      opacity="0.5"
                      style={{ transition: 'all 0.18s ease-out' }}
                    />

                    {/* Pawn Number Indicator or Trophy */}
                    {pos === 200 ? (
                      <text
                        x={0}
                        y={isCurrentlyJumping ? -0.08 : 0.12}
                        textAnchor="middle"
                        fontSize="0.35"
                        fill="#ffffff"
                        fontWeight="bold"
                        style={{ transition: 'all 0.18s ease-out' }}
                      >
                        🏆
                      </text>
                    ) : (
                      <text
                        x={0}
                        y={isCurrentlyJumping ? -0.1 : 0.1}
                        textAnchor="middle"
                        fontSize="0.28"
                        fill="#ffffff"
                        fontWeight="bold"
                        style={{ transition: 'all 0.18s ease-out' }}
                      >
                        {pawnIdx + 1}
                      </text>
                    )}
                  </g>
                </g>
              );
            });
          })}
        </svg>

        {/* Flying Interactive Emojis Overlay */}
        {flyingEmojis.map((fe, idx) => (
          <div
            key={fe.id ? `${fe.id}-${idx}` : `fe-${idx}`}
            className="absolute z-50 text-4xl animate-bounce transition-all duration-700 pointer-events-none"
            style={{
              top: '40%',
              left: '45%',
            }}
          >
            {fe.emoji}
          </div>
        ))}
      </div>

      {/* Spectator Live Cheering Reactions Bar (if spectator) */}
      {isSpectator && (
        <div className="w-full max-w-[480px] mt-3 bg-slate-900/90 border border-purple-500/40 rounded-2xl p-2 px-3 flex items-center justify-between gap-1 shadow-lg backdrop-blur-md">
          <div className="flex items-center gap-1.5 text-xs text-purple-300 font-bold whitespace-nowrap">
            <Smile size={14} className="text-purple-400" />
            <span>تفاعل المشاهد:</span>
          </div>
          <div className="flex items-center gap-1.5">
            {['👏', '🔥', '👑', '🎉', '🍿', '😮', '❤️'].map((emoji) => (
              <button
                key={emoji}
                onClick={() => {
                  sound.playSafeStar();
                  if (onSendSpectatorEmoji) onSendSpectatorEmoji(emoji);
                }}
                className="text-xl p-1 hover:scale-125 hover:bg-slate-800 rounded-xl transition-transform active:scale-95"
                title={`تفاعل بـ ${emoji}`}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Bottom 2 Player Panels (Dynamic Perspective - Bottom Left is Always You) */}
      <div className="w-full max-w-[620px] relative h-12 mt-2">
        {renderPlayerBadge(bottomLeftColor, 'bottom-0 left-0')}
        {renderPlayerBadge(bottomRightColor, 'bottom-0 right-0')}
      </div>
    </div>
  );
};
