export interface DailyQuest {
  id: string;
  title: string;
  description: string;
  progress: number;
  maxProgress: number;
  rewardCoins: number;
  rewardGems?: number;
  isClaimed: boolean;
}

export type PlayerColor = 'red' | 'green' | 'yellow' | 'blue';
export type RoomMode = '2p' | '3p' | '4p';

export interface MatchHistoryItem {
  id: string;
  timestamp: number;
  dateStr: string;
  mode: '2p' | '3p' | '4p' | 'bot' | 'local' | 'online' | 'private';
  modeLabel: string;
  result: 'win' | 'loss';
  bet: number;
  coinsDelta: number;
  xpEarned: number;
  myColor: PlayerColor;
  finishedPawns: number;
  opponentsCount: number;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatar: string;
  coins: number;
  gems: number;
  level: number;
  xp: number;
  wins: number;
  losses: number;
  totalGames: number;
  selectedPawnSkin: string;
  selectedDiceSkin: string;
  selectedBoardSkin: string;
  unlockedPawnSkins: string[];
  unlockedDiceSkins: string[];
  unlockedBoardSkins: string[];
  isVipMaster?: boolean;
  lastDailyRewardDate?: string;
  loginStreak: number;
  lastLuckySpinDate?: string;
  password?: string;
  country?: string;
  matchHistory?: MatchHistoryItem[];
}

export interface PawnSkin {
  id: string;
  name: { ar: string; en: string; fr: string; es: string; tr: string };
  priceCoins: number;
  priceGems: number;
  rarity: 'common' | 'rare' | 'epic' | 'legendary' | 'mythic';
  colorPalette: {
    red: string;
    green: string;
    yellow: string;
    blue: string;
    glow: string;
    border: string;
  };
  iconName: string;
  description: { ar: string; en: string };
}

export interface DiceSkin {
  id: string;
  name: { ar: string; en: string; fr: string; es: string; tr: string };
  priceCoins: number;
  priceGems: number;
  rarity: 'common' | 'rare' | 'epic' | 'legendary' | 'mythic';
  bgGradient: string;
  dotColor: string;
  glowColor: string;
  iconName: string;
}

export interface BoardSkin {
  id: string;
  name: { ar: string; en: string; fr: string; es: string; tr: string };
  priceCoins: number;
  priceGems: number;
  rarity: 'common' | 'rare' | 'epic' | 'legendary' | 'mythic';
  bgTheme: string;
  boardBg: string;
  pathTileBg: string;
  gridLineColor: string;
  previewUrl: string;
}

export interface GamePlayer {
  id: string;
  name: string;
  email?: string;
  avatar: string;
  color: PlayerColor;
  isBot?: boolean;
  pawnSkin?: string;
  diceSkin?: string;
  isReady?: boolean;
  pawns: number[]; // Array of 4 pawn positions: -1 (base), 0-51 (main track), 100-105 (home stretch), 200 (finished)
  isTurn?: boolean;
  rank?: number;
}

export interface Spectator {
  id: string;
  name: string;
  avatar: string;
  country?: string;
  joinedAt: number;
}

export interface RoomState {
  code: string;
  name: string;
  mode: RoomMode;
  bet: number;
  status: 'waiting' | 'playing' | 'finished';
  hostId: string;
  players: GamePlayer[];
  spectators?: Spectator[];
  currentTurnIndex: number;
  diceValue: number | null;
  hasRolled: boolean;
  consecutiveSixes: number;
  boardTheme: string;
  winners: string[]; // player IDs in order of victory
  turnTimeLeft: number;
  lastActionDesc?: { ar: string; en: string };
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderColor: PlayerColor | 'spectator';
  isSpectator?: boolean;
  text?: string;
  emoji?: string;
  timestamp: number;
}

export interface RoomPlayer {
  id: string;
  name: string;
  avatar: string;
  color: PlayerColor;
  isBot?: boolean;
  isReady?: boolean;
  score?: number;
  rank?: number;
  email?: string;
  pawnSkin?: string;
  diceSkin?: string;
  coins?: number;
}

export interface GameRoom {
  code: string;
  name: string;
  mode: RoomMode;
  bet: number;
  status: 'waiting' | 'playing' | 'finished';
  hostId: string;
  players: RoomPlayer[];
  spectators: Spectator[];
  turnIndex: number;
  currentTurnColor: PlayerColor;
  diceValue: number | null;
  hasRolled: boolean;
  consecutiveSixes: number;
  pawns: Record<string, number[]>;
  winners: string[];
  boardTheme: string;
  createdAt: number;
  lastActionTime: number;
}
