import express from "express";
import http from "http";
import path from "path";
import { WebSocketServer, WebSocket } from "ws";
import { createServer as createViteServer } from "vite";

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const server = http.createServer(app);

app.use(express.json());

// In-Memory Database & State for Rooms & Players
export interface Player {
  id: string;
  name: string;
  avatar: string;
  color: "red" | "green" | "yellow" | "blue";
  isBot?: boolean;
  isReady?: boolean;
  score?: number;
  rank?: number;
  email?: string;
  pawnSkin?: string;
  diceSkin?: string;
  coins?: number;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderColor: string;
  text?: string;
  emoji?: string;
  timestamp: number;
}

export interface Spectator {
  id: string;
  name: string;
  avatar: string;
  country?: string;
  joinedAt: number;
}

export interface GameRoom {
  code: string;
  name: string;
  mode: "2p" | "3p" | "4p";
  bet: number;
  status: "waiting" | "playing" | "finished";
  hostId: string;
  players: Player[];
  spectators: Spectator[];
  turnIndex: number;
  currentTurnColor: "red" | "green" | "yellow" | "blue";
  diceValue: number | null;
  hasRolled: boolean;
  consecutiveSixes: number;
  pawns: Record<string, number[]>; // color -> [pawn0Pos, pawn1Pos, pawn2Pos, pawn3Pos]
  winners: string[]; // list of player ids who reached 4 pawns home
  boardTheme: string;
  createdAt: number;
  lastActionTime: number;
}

const rooms = new Map<string, GameRoom>();
const socketsByRoom = new Map<string, Map<string, WebSocket>>();
const activeSockets = new Map<WebSocket, { roomId?: string; playerId?: string; playerName?: string; isSpectator?: boolean }>();

// Leaderboard in-memory seed with realistic active international players + live updates
export interface LeaderboardEntry {
  id: string;
  name: string;
  avatar: string;
  email?: string;
  coins: number;
  gems?: number;
  wins: number;
  totalGames: number;
  winRate: number;
  level: number;
  country: string;
  countryName?: string;
  weeklyPoints: number;
  badge?: string;
  rankTitle?: string;
  isVip?: boolean;
  lastActive: number;
}

let leaderboards: LeaderboardEntry[] = [
  {
    id: "hamody-vip",
    name: "👑 Hamody (المالك VIP)",
    avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=hamodydeab3",
    email: "hamodydeab3@gmail.com",
    coins: 9999999,
    gems: 9999,
    wins: 924,
    totalGames: 960,
    winRate: 96,
    level: 100,
    country: "SA",
    countryName: "السعودية",
    weeklyPoints: 48500,
    badge: "👑 Grand Master",
    rankTitle: "إمبراطور اللودو",
    isVip: true,
    lastActive: Date.now(),
  },
  {
    id: "p1",
    name: "سلطان النرد الذهبي",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sultan",
    coins: 485000,
    gems: 1250,
    wins: 340,
    totalGames: 410,
    winRate: 83,
    level: 58,
    country: "EG",
    countryName: "مصر",
    weeklyPoints: 31200,
    badge: "🔥 Ludo Champion",
    rankTitle: "أسطورة الشرق",
    lastActive: Date.now() - 1000 * 60 * 12,
  },
  {
    id: "p2",
    name: "Tariq_AlZaabi 🇦🇪",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Tariq",
    coins: 390400,
    gems: 980,
    wins: 295,
    totalGames: 380,
    winRate: 78,
    level: 52,
    country: "AE",
    countryName: "الإمارات",
    weeklyPoints: 27900,
    badge: "⭐ Elite Master",
    rankTitle: "صقر دبي",
    lastActive: Date.now() - 1000 * 60 * 30,
  },
  {
    id: "p3",
    name: "أميرة اللودو المغربية 🇲🇦",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Amira",
    coins: 315000,
    gems: 740,
    wins: 260,
    totalGames: 345,
    winRate: 75,
    level: 48,
    country: "MA",
    countryName: "المغرب",
    weeklyPoints: 24100,
    badge: "💎 Diamond Roller",
    rankTitle: "أميرة النرد",
    lastActive: Date.now() - 1000 * 60 * 45,
  },
  {
    id: "p4",
    name: "ShadowSniper 🇰🇼",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Shadow",
    coins: 240000,
    gems: 520,
    wins: 215,
    totalGames: 310,
    winRate: 69,
    level: 43,
    country: "KW",
    countryName: "الكويت",
    weeklyPoints: 19800,
    badge: "🎲 Pro Strategist",
    rankTitle: "قناص البيادق",
    lastActive: Date.now() - 1000 * 60 * 90,
  },
  {
    id: "p5",
    name: "فارس نجد 🇸🇦",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Fares",
    coins: 198000,
    gems: 410,
    wins: 185,
    totalGames: 270,
    winRate: 68,
    level: 39,
    country: "SA",
    countryName: "السعودية",
    weeklyPoints: 16500,
    badge: "🛡️ Knight Roller",
    rankTitle: "فارس الصحراء",
    lastActive: Date.now() - 1000 * 60 * 150,
  },
  {
    id: "p6",
    name: "محارب_الرافدين 🇮🇶",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Baghdad",
    coins: 162000,
    gems: 330,
    wins: 154,
    totalGames: 230,
    winRate: 67,
    level: 36,
    country: "IQ",
    countryName: "العراق",
    weeklyPoints: 14200,
    badge: "⚡ Thunder Dice",
    rankTitle: "بطل بابل",
    lastActive: Date.now() - 1000 * 60 * 180,
  },
  {
    id: "p7",
    name: "نسر قرطاج 🇹🇳",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Tunis",
    coins: 135000,
    gems: 280,
    wins: 130,
    totalGames: 200,
    winRate: 65,
    level: 32,
    country: "TN",
    countryName: "تونس",
    weeklyPoints: 11900,
    badge: "🦅 Sky Roller",
    rankTitle: "نسر المتوسط",
    lastActive: Date.now() - 1000 * 60 * 220,
  },
  {
    id: "p8",
    name: "محرز_الملكي 🇩🇿",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Algeria",
    coins: 118000,
    gems: 250,
    wins: 115,
    totalGames: 185,
    winRate: 62,
    level: 30,
    country: "DZ",
    countryName: "الجزائر",
    weeklyPoints: 10400,
    badge: "🔥 Desert Fox",
    rankTitle: "ثعلب اللودو",
    lastActive: Date.now() - 1000 * 60 * 260,
  },
  {
    id: "p9",
    name: "نشامى_عمان 🇯🇴",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Amman",
    coins: 96000,
    gems: 190,
    wins: 98,
    totalGames: 160,
    winRate: 61,
    level: 27,
    country: "JO",
    countryName: "الأردن",
    weeklyPoints: 8700,
    badge: "🎯 Precision Master",
    rankTitle: "نشمي الأردن",
    lastActive: Date.now() - 1000 * 60 * 300,
  },
  {
    id: "p10",
    name: "العنابي_الذهبي 🇶🇦",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Doha",
    coins: 84500,
    gems: 170,
    wins: 86,
    totalGames: 145,
    winRate: 59,
    level: 25,
    country: "QA",
    countryName: "قطر",
    weeklyPoints: 7600,
    badge: "💎 Pearl Roller",
    rankTitle: "لؤلؤة الخليج",
    lastActive: Date.now() - 1000 * 60 * 340,
  },
  {
    id: "p11",
    name: "البحريني_الذكي 🇧🇭",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Manama",
    coins: 72000,
    gems: 140,
    wins: 74,
    totalGames: 130,
    winRate: 57,
    level: 23,
    country: "BH",
    countryName: "البحرين",
    weeklyPoints: 6300,
    badge: "🎲 Quick Striker",
    rankTitle: "داهية النرد",
    lastActive: Date.now() - 1000 * 60 * 380,
  },
  {
    id: "p12",
    name: "صلالة_المجد 🇴🇲",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Muscat",
    coins: 61500,
    gems: 120,
    wins: 65,
    totalGames: 115,
    winRate: 56,
    level: 21,
    country: "OM",
    countryName: "عُمان",
    weeklyPoints: 5200,
    badge: "🌊 Frankincense Star",
    rankTitle: "بطل عُمان",
    lastActive: Date.now() - 1000 * 60 * 420,
  },
];

// Track SSE streaming clients per room
const sseClientsByRoom = new Map<string, Set<express.Response>>();

// Helper to broadcast room state to all connected WS clients and SSE streams in room
function broadcastToRoom(roomCode: string, payload: any) {
  const code = roomCode.toUpperCase();
  const msg = JSON.stringify(payload);

  // 1. Broadcast to WebSockets
  const roomSockets = socketsByRoom.get(code);
  if (roomSockets) {
    roomSockets.forEach((ws) => {
      if (ws.readyState === WebSocket.OPEN) {
        try {
          ws.send(msg);
        } catch (e) {}
      }
    });
  }

  // 2. Broadcast to Server-Sent Events (SSE) subscribers
  const sseSet = sseClientsByRoom.get(code);
  if (sseSet) {
    sseSet.forEach((res) => {
      try {
        res.write(`data: ${msg}\n\n`);
      } catch (e) {
        sseSet.delete(res);
      }
    });
  }
}

// REST API Endpoints
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", activeRooms: rooms.size, onlineCount: activeSockets.size });
});

// Comprehensive Real Global Leaderboard API
app.get("/api/leaderboard", (req, res) => {
  const category = (req.query.category as string) || "coins"; // coins, wins, level, weekly
  const country = (req.query.country as string) || "all";
  const search = ((req.query.search as string) || "").trim().toLowerCase();
  const userEmail = (req.query.userEmail as string) || "";
  const userName = (req.query.userName as string) || "";

  let list = [...leaderboards];

  // Country filter
  if (country && country !== "all") {
    list = list.filter((e) => e.country.toLowerCase() === country.toLowerCase());
  }

  // Search filter
  if (search) {
    list = list.filter(
      (e) =>
        e.name.toLowerCase().includes(search) ||
        (e.countryName && e.countryName.toLowerCase().includes(search)) ||
        (e.rankTitle && e.rankTitle.toLowerCase().includes(search))
    );
  }

  // Dynamic sorting based on category
  list.sort((a, b) => {
    if (category === "wins") {
      if (b.wins !== a.wins) return b.wins - a.wins;
      return b.winRate - a.winRate;
    } else if (category === "level") {
      if (b.level !== a.level) return b.level - a.level;
      return b.coins - a.coins;
    } else if (category === "weekly") {
      return (b.weeklyPoints || 0) - (a.weeklyPoints || 0);
    }
    // Default by coins
    return b.coins - a.coins;
  });

  // Calculate full rankings
  const rankedList = list.map((item, index) => ({
    ...item,
    rank: index + 1,
  }));

  // Find requesting user rank
  let userRankInfo: any = null;
  const userIndex = rankedList.findIndex(
    (e) => (userEmail && e.email === userEmail) || (userName && e.name === userName)
  );

  if (userIndex !== -1) {
    const u = rankedList[userIndex];
    const nextPlayer = userIndex > 0 ? rankedList[userIndex - 1] : null;
    userRankInfo = {
      rank: userIndex + 1,
      totalPlayers: rankedList.length,
      percentile: Math.max(1, Math.round(((rankedList.length - userIndex) / rankedList.length) * 100)),
      coinsToNextRank: nextPlayer ? Math.max(0, nextPlayer.coins - u.coins + 100) : 0,
      winsToNextRank: nextPlayer ? Math.max(0, nextPlayer.wins - u.wins + 1) : 0,
      userData: u,
    };
  }

  res.json({
    leaderboards: rankedList,
    totalPlayers: rankedList.length,
    userRank: userRankInfo,
    seasonInfo: {
      seasonName: "موسم الأساطير الذهبي 🏆",
      seasonNumber: 14,
      daysRemaining: 4,
      firstPrize: "150,000 قطعة ذهبية + تاج الإمبراطور VIP",
      secondPrize: "75,000 قطعة ذهبية + سكن نرد التنين",
      thirdPrize: "35,000 قطعة ذهبية + سكن رقعة الملوك",
    },
  });
});

// Full Real-Time Sync endpoint for active players
app.post("/api/leaderboard/sync", (req, res) => {
  const {
    name,
    email,
    avatar,
    coins,
    gems,
    wins,
    losses,
    totalGames,
    level,
    country,
    isVipMaster,
  } = req.body;

  if (!name) return res.status(400).json({ error: "Name is required" });

  let entry = leaderboards.find((e) => (email && e.email === email) || e.name === name);

  const calculatedWinRate = totalGames > 0 ? Math.round((wins / totalGames) * 100) : (wins > 0 ? 100 : 50);
  const weeklyPts = (wins || 0) * 250 + Math.floor((coins || 0) / 100);

  if (entry) {
    entry.name = name;
    if (avatar) entry.avatar = avatar;
    if (email) entry.email = email;
    entry.coins = Math.max(entry.coins, coins ?? entry.coins);
    if (gems !== undefined) entry.gems = gems;
    entry.wins = Math.max(entry.wins, wins ?? entry.wins);
    entry.totalGames = Math.max(entry.totalGames, totalGames ?? (entry.wins + (losses || 0)));
    entry.winRate = calculatedWinRate;
    entry.level = Math.max(entry.level, level ?? entry.level);
    if (country) entry.country = country;
    if (isVipMaster) entry.isVip = true;
    entry.weeklyPoints = weeklyPts;
    entry.lastActive = Date.now();
  } else {
    entry = {
      id: "usr-" + Date.now(),
      name,
      email,
      avatar: avatar || "https://api.dicebear.com/7.x/bottts/svg?seed=" + encodeURIComponent(name),
      coins: coins || 1000,
      gems: gems || 20,
      wins: wins || 0,
      totalGames: totalGames || (wins || 0) + (losses || 0),
      winRate: calculatedWinRate,
      level: level || 1,
      country: country || "SA",
      countryName: "السعودية",
      weeklyPoints: weeklyPts,
      badge: isVipMaster ? "👑 VIP Master" : "🎲 Ludo Player",
      rankTitle: level && level > 20 ? "فارس النرد" : "مبتدئ طموح",
      isVip: isVipMaster || false,
      lastActive: Date.now(),
    };
    leaderboards.push(entry);
  }

  res.json({ success: true, entry });
});

// Helper to create a new room
function createNewRoom(payload: {
  code?: string;
  name?: string;
  mode?: "2p" | "3p" | "4p";
  bet?: number;
  hostPlayer: Player;
  boardTheme?: string;
}): GameRoom {
  const roomCode = (payload.code || Math.random().toString(36).substring(2, 8)).toUpperCase();
  const newRoom: GameRoom = {
    code: roomCode,
    name: payload.name?.trim() || `غرفة ${payload.hostPlayer.name}`,
    mode: payload.mode || "4p",
    bet: Number(payload.bet) || 500,
    status: "waiting",
    hostId: payload.hostPlayer.id,
    players: [{ ...payload.hostPlayer, color: "red", isReady: true }],
    spectators: [],
    turnIndex: 0,
    currentTurnColor: "red",
    diceValue: null,
    hasRolled: false,
    consecutiveSixes: 0,
    pawns: {
      red: [-1, -1, -1, -1],
      green: [-1, -1, -1, -1],
      yellow: [-1, -1, -1, -1],
      blue: [-1, -1, -1, -1],
    },
    winners: [],
    boardTheme: payload.boardTheme || "classic",
    createdAt: Date.now(),
    lastActionTime: Date.now(),
  };
  rooms.set(roomCode, newRoom);
  return newRoom;
}

// List public active rooms & games available to join or spectate
app.get("/api/rooms", (req, res) => {
  const allRooms = Array.from(rooms.values())
    .map((r) => {
      const maxP = r.mode === "2p" ? 2 : r.mode === "3p" ? 3 : 4;
      return {
        code: r.code,
        name: r.name,
        mode: r.mode,
        bet: r.bet,
        status: r.status,
        playerCount: r.players.length,
        maxPlayers: maxP,
        spectatorCount: r.spectators ? r.spectators.length : 0,
        boardTheme: r.boardTheme,
        canJoinAsPlayer: r.status === "waiting" && r.players.length < maxP,
        canSpectate: true,
      };
    });
  res.json({ rooms: allRooms });
});

// REST API for creating a room directly (fallback and instant creation)
app.post("/api/rooms/create", (req, res) => {
  try {
    const { name, mode, bet, hostPlayer, boardTheme, code } = req.body;
    if (!hostPlayer || !hostPlayer.id) {
      return res.status(400).json({ error: "Host player details required" });
    }
    const newRoom = createNewRoom({ code, name, mode, bet, hostPlayer, boardTheme });
    res.json({ success: true, room: newRoom });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to create room" });
  }
});

// REST API for joining a room
app.post("/api/rooms/join", (req, res) => {
  try {
    const { roomCode, player, isSpectator } = req.body;
    const room = rooms.get(roomCode?.toUpperCase());
    if (!room) {
      return res.status(404).json({ error: "الغرفة غير موجودة أو انتهت صلاحيتها." });
    }

    if (!room.spectators) room.spectators = [];

    const maxPlayers = room.mode === "2p" ? 2 : room.mode === "3p" ? 3 : 4;
    const shouldSpectate = Boolean(isSpectator || room.status !== "waiting" || room.players.length >= maxPlayers);

    if (shouldSpectate) {
      if (!room.spectators.some((s) => s.id === player.id)) {
        room.spectators.push({
          id: player.id,
          name: player.name,
          avatar: player.avatar,
          country: player.country || "SA",
          joinedAt: Date.now(),
        });
      }
      return res.json({ success: true, room, isSpectator: true });
    }

    // Active player join
    const existingIndex = room.players.findIndex((p) => p.id === player.id);
    if (existingIndex === -1) {
      const availableColors: ("red" | "green" | "yellow" | "blue")[] =
        room.mode === "2p"
          ? ["red", "yellow"]
          : room.mode === "3p"
          ? ["red", "green", "yellow"]
          : ["red", "green", "yellow", "blue"];
      const usedColors = room.players.map((p) => p.color);
      const assignedColor = availableColors.find((c) => !usedColors.includes(c)) || "blue";

      room.players.push({
        ...player,
        color: assignedColor,
        isReady: true,
      });
    }

    broadcastToRoom(room.code, { type: "ROOM_UPDATED", room });
    res.json({ success: true, room, isSpectator: false });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to join room" });
  }
});

// REST API to get room info
app.get("/api/rooms/:code", (req, res) => {
  const room = rooms.get(req.params.code.toUpperCase());
  if (!room) {
    return res.status(404).json({ error: "الغرفة غير موجودة" });
  }
  res.json({ room });
});

// SSE (Server-Sent Events) Stream Endpoint for Instant Push without WS limits
app.get("/api/rooms/:code/stream", (req, res) => {
  const roomCode = req.params.code.toUpperCase();
  const room = rooms.get(roomCode);
  
  if (!room) {
    return res.status(404).json({ error: "Room not found" });
  }

  // Set SSE Headers
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.flushHeaders?.();

  if (!sseClientsByRoom.has(roomCode)) {
    sseClientsByRoom.set(roomCode, new Set());
  }
  sseClientsByRoom.get(roomCode)!.add(res);

  // Send initial room snapshot
  res.write(`data: ${JSON.stringify({ type: room.status === "playing" ? "GAME_STARTED" : "ROOM_UPDATED", room })}\n\n`);

  // Keep connection open with comment heartbeat every 15s
  const pinger = setInterval(() => {
    try {
      res.write(": ping\n\n");
    } catch (e) {
      clearInterval(pinger);
    }
  }, 15000);

  req.on("close", () => {
    clearInterval(pinger);
    const set = sseClientsByRoom.get(roomCode);
    if (set) {
      set.delete(res);
      if (set.size === 0) {
        sseClientsByRoom.delete(roomCode);
      }
    }
  });
});

// Generic REST Action Fallback for Room Events (Dual-Stack Reliability)
app.post("/api/rooms/action", (req, res) => {
  try {
    const { roomCode, type, payload } = req.body;
    const room = rooms.get(roomCode?.toUpperCase());
    if (!room) {
      return res.status(404).json({ error: "Room not found" });
    }

    switch (type) {
      case "ROLL_DICE": {
        const { color, roll, consecutiveSixes } = payload;
        room.diceValue = roll;
        room.hasRolled = true;
        room.currentTurnColor = color;
        room.consecutiveSixes = consecutiveSixes || 0;
        room.lastActionTime = Date.now();
        broadcastToRoom(room.code, {
          type: "DICE_ROLLED",
          color,
          roll,
          consecutiveSixes: room.consecutiveSixes,
          room,
        });
        break;
      }
      case "MOVE_PAWN": {
        const { color, pawnIndex, roll, newPawns, nextTurnColor, gotExtraTurn, didCapture, didReachHome, isWinner, winnerId } = payload;
        if (newPawns) room.pawns = newPawns;
        room.currentTurnColor = nextTurnColor;
        room.hasRolled = false;
        room.diceValue = null;
        if (isWinner && winnerId && !room.winners.includes(winnerId)) {
          room.winners.push(winnerId);
        }
        room.lastActionTime = Date.now();
        broadcastToRoom(room.code, {
          type: "PAWN_MOVED",
          color,
          pawnIndex,
          roll,
          newPawns: room.pawns,
          nextTurnColor,
          gotExtraTurn,
          didCapture,
          didReachHome,
          isWinner,
          winnerId,
          room,
        });
        break;
      }
      case "PASS_TURN": {
        const { nextTurnColor, reason } = payload;
        room.currentTurnColor = nextTurnColor;
        room.hasRolled = false;
        room.diceValue = null;
        room.lastActionTime = Date.now();
        broadcastToRoom(room.code, {
          type: "TURN_PASSED",
          nextTurnColor,
          reason,
          room,
        });
        break;
      }
      case "START_GAME": {
        const maxPlayers = room.mode === "2p" ? 2 : room.mode === "3p" ? 3 : 4;
        const colorsNeeded: ("red" | "green" | "yellow" | "blue")[] =
          room.mode === "2p"
            ? ["red", "yellow"]
            : room.mode === "3p"
            ? ["red", "green", "yellow"]
            : ["red", "green", "yellow", "blue"];

        const botNames = ["الروبوت الذكي 🤖", "Falcon_AI 🦅", "الأسطورة 🌟", "Tiger_Bot 🐯"];
        let botIndex = 0;

        colorsNeeded.forEach((col) => {
          if (!room.players.some((p) => p.color === col) && room.players.length < maxPlayers) {
            room.players.push({
              id: `bot-${col}-${Date.now()}`,
              name: botNames[botIndex % botNames.length],
              avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${col}`,
              color: col,
              isBot: true,
              isReady: true,
            });
            botIndex++;
          }
        });

        room.status = "playing";
        room.turnIndex = 0;
        room.currentTurnColor = room.players[0].color;
        room.hasRolled = false;
        room.diceValue = null;
        room.lastActionTime = Date.now();

        broadcastToRoom(room.code, { type: "GAME_STARTED", room });
        break;
      }
      case "CHAT_MESSAGE": {
        broadcastToRoom(room.code, { type: "NEW_CHAT", message: payload?.message });
        break;
      }
      case "EMOJI_INTERACTION": {
        broadcastToRoom(room.code, {
          type: "EMOJI_THROWN",
          ...payload,
        });
        break;
      }
    }

    res.json({ success: true, room });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed action" });
  }
});

// WebSocket Server with Persistent Heartbeat Keep-Alive
const wss = new WebSocketServer({ server });

// Keep-alive heartbeat loop every 20s to prevent Cloud Run proxy / NAT timeouts
const heartbeatInterval = setInterval(() => {
  wss.clients.forEach((ws: any) => {
    if (ws.isAlive === false) {
      try {
        ws.terminate();
      } catch (e) {}
      return;
    }
    ws.isAlive = false;
    try {
      ws.ping();
    } catch (e) {}
  });
}, 20000);

wss.on("close", () => {
  clearInterval(heartbeatInterval);
});

wss.on("connection", (ws: any) => {
  ws.isAlive = true;
  ws.on("pong", () => {
    ws.isAlive = true;
  });

  activeSockets.set(ws, {});

  ws.on("message", (data) => {
    try {
      const message = JSON.parse(data.toString());
      const { type, payload } = message;

      switch (type) {
        case "CREATE_ROOM": {
          const { code, name, mode, bet, hostPlayer, boardTheme } = payload;
          const newRoom = createNewRoom({ code, name, mode, bet, hostPlayer, boardTheme });
          
          if (!socketsByRoom.has(newRoom.code)) {
            socketsByRoom.set(newRoom.code, new Map());
          }
          socketsByRoom.get(newRoom.code)!.set(hostPlayer.id, ws);
          activeSockets.set(ws, { roomId: newRoom.code, playerId: hostPlayer.id, playerName: hostPlayer.name, isSpectator: false });

          ws.send(JSON.stringify({ type: "ROOM_CREATED", room: newRoom, isSpectator: false }));
          break;
        }

        case "JOIN_ROOM": {
          const { roomCode, player } = payload;
          const isSpectator = Boolean(payload.isSpectator || payload.asSpectator);
          const room = rooms.get(roomCode);
          if (!room) {
            ws.send(JSON.stringify({ type: "ERROR", message: "الغرفة غير موجودة أو انتهت صلاحيتها." }));
            return;
          }

          if (!room.spectators) room.spectators = [];

          // Case 1: Joining as Spectator explicitly OR room is already playing/full
          const maxPlayers = room.mode === "2p" ? 2 : room.mode === "3p" ? 3 : 4;
          if (isSpectator || room.status !== "waiting" || room.players.length >= maxPlayers) {
            const existingSpecIdx = room.spectators.findIndex((s) => s.id === player.id);
            if (existingSpecIdx === -1) {
              room.spectators.push({
                id: player.id,
                name: player.name,
                avatar: player.avatar,
                country: player.country || "SA",
                joinedAt: Date.now(),
              });
            }

            if (!socketsByRoom.has(roomCode)) {
              socketsByRoom.set(roomCode, new Map());
            }
            socketsByRoom.get(roomCode)!.set(player.id, ws);
            activeSockets.set(ws, { roomId: roomCode, playerId: player.id, playerName: player.name, isSpectator: true });

            // If room is already playing, send current game state so spectator jumps right into action
            if (room.status === "playing") {
              ws.send(JSON.stringify({ type: "GAME_STARTED", room, isSpectator: true }));
            } else {
              ws.send(JSON.stringify({ type: "ROOM_UPDATED", room, isSpectator: true }));
            }

            broadcastToRoom(roomCode, { 
              type: "ROOM_UPDATED", 
              room,
              notification: `👁️ انضم ${player.name} إلى وضع المشاهدة.` 
            });
            return;
          }

          // Case 2: Joining as Active Player
          const existingIndex = room.players.findIndex((p) => p.id === player.id);

          if (existingIndex === -1) {
            // Assign available color
            const availableColors: ("red" | "green" | "yellow" | "blue")[] =
              room.mode === "2p"
                ? ["red", "yellow"]
                : room.mode === "3p"
                ? ["red", "green", "yellow"]
                : ["red", "green", "yellow", "blue"];
            
            const usedColors = room.players.map((p) => p.color);
            const assignedColor = availableColors.find((c) => !usedColors.includes(c)) || "blue";

            room.players.push({
              ...player,
              color: assignedColor,
              isReady: true,
            });
          }

          if (!socketsByRoom.has(roomCode)) {
            socketsByRoom.set(roomCode, new Map());
          }
          socketsByRoom.get(roomCode)!.set(player.id, ws);
          activeSockets.set(ws, { roomId: roomCode, playerId: player.id, playerName: player.name, isSpectator: false });

          broadcastToRoom(roomCode, { type: "ROOM_UPDATED", room });
          break;
        }

        case "START_GAME": {
          const { roomCode } = payload;
          const room = rooms.get(roomCode);
          if (!room) return;

          // Fill with bots if room not full and host requests start
          const maxPlayers = room.mode === "2p" ? 2 : room.mode === "3p" ? 3 : 4;
          const colorsNeeded: ("red" | "green" | "yellow" | "blue")[] =
            room.mode === "2p"
              ? ["red", "yellow"]
              : room.mode === "3p"
              ? ["red", "green", "yellow"]
              : ["red", "green", "yellow", "blue"];

          const botNames = ["الروبوت الذكي 🤖", "Falcon_AI 🦅", "الأسطورة 🌟", "Tiger_Bot 🐯"];
          let botIndex = 0;

          colorsNeeded.forEach((col) => {
            if (!room.players.some((p) => p.color === col) && room.players.length < maxPlayers) {
              room.players.push({
                id: `bot-${col}-${Date.now()}`,
                name: botNames[botIndex % botNames.length],
                avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${col}`,
                color: col,
                isBot: true,
                isReady: true,
              });
              botIndex++;
            }
          });

          room.status = "playing";
          room.turnIndex = 0;
          room.currentTurnColor = room.players[0].color;
          room.hasRolled = false;
          room.diceValue = null;
          room.lastActionTime = Date.now();

          broadcastToRoom(roomCode, { type: "GAME_STARTED", room });
          break;
        }

        case "ROLL_DICE": {
          const { roomCode, color, roll, consecutiveSixes } = payload;
          const room = rooms.get(roomCode);
          if (room) {
            room.diceValue = roll;
            room.hasRolled = true;
            room.currentTurnColor = color;
            room.consecutiveSixes = consecutiveSixes || 0;
            room.lastActionTime = Date.now();
            broadcastToRoom(roomCode, {
              type: "DICE_ROLLED",
              color,
              roll,
              consecutiveSixes: room.consecutiveSixes,
              room,
            });
          }
          break;
        }

        case "MOVE_PAWN": {
          const { roomCode, color, pawnIndex, roll, newPawns, nextTurnColor, gotExtraTurn, didCapture, didReachHome, isWinner, winnerId } = payload;
          const room = rooms.get(roomCode);
          if (room) {
            if (newPawns) room.pawns = newPawns;
            room.currentTurnColor = nextTurnColor;
            room.hasRolled = false;
            room.diceValue = null;
            if (isWinner && winnerId && !room.winners.includes(winnerId)) {
              room.winners.push(winnerId);
            }
            room.lastActionTime = Date.now();
            broadcastToRoom(roomCode, {
              type: "PAWN_MOVED",
              color,
              pawnIndex,
              roll,
              newPawns: room.pawns,
              nextTurnColor,
              gotExtraTurn,
              didCapture,
              didReachHome,
              isWinner,
              winnerId,
              room,
            });
          }
          break;
        }

        case "PASS_TURN": {
          const { roomCode, nextTurnColor, reason } = payload;
          const room = rooms.get(roomCode);
          if (room) {
            room.currentTurnColor = nextTurnColor;
            room.hasRolled = false;
            room.diceValue = null;
            room.lastActionTime = Date.now();
            broadcastToRoom(roomCode, {
              type: "TURN_PASSED",
              nextTurnColor,
              reason,
              room,
            });
          }
          break;
        }

        case "SYNC_STATE": {
          const { roomCode, roomState } = payload;
          if (roomCode && roomState) {
            const current = rooms.get(roomCode);
            rooms.set(roomCode, { 
              ...roomState, 
              spectators: current?.spectators || roomState.spectators || [],
              lastActionTime: Date.now() 
            });
            broadcastToRoom(roomCode, { type: "STATE_SYNCED", room: roomState });
          }
          break;
        }

        case "CHAT_MESSAGE": {
          const { roomCode, message: chatMsg } = payload;
          broadcastToRoom(roomCode, { type: "NEW_CHAT", message: chatMsg });
          break;
        }

        case "EMOJI_INTERACTION": {
          const { roomCode, emoji, fromPlayerId, toPlayerId, isSpectator } = payload;
          broadcastToRoom(roomCode, {
            type: "EMOJI_THROWN",
            emoji,
            fromPlayerId,
            toPlayerId,
            isSpectator: isSpectator || false,
          });
          break;
        }

        case "LEAVE_ROOM": {
          const { roomCode, playerId, isSpectator } = payload;
          const room = rooms.get(roomCode);
          if (room) {
            if (isSpectator && room.spectators) {
              room.spectators = room.spectators.filter((s) => s.id !== playerId);
            } else {
              room.players = room.players.filter((p) => p.id !== playerId);
            }

            if (socketsByRoom.has(roomCode)) {
              socketsByRoom.get(roomCode)!.delete(playerId);
            }

            if (room.players.length === 0 && (!room.spectators || room.spectators.length === 0)) {
              rooms.delete(roomCode);
            } else {
              if (room.hostId === playerId && room.players.length > 0) {
                room.hostId = room.players[0].id;
              }
              broadcastToRoom(roomCode, { type: "ROOM_UPDATED", room });
            }
          }
          break;
        }
      }
    } catch (err) {
      console.error("WS Parse error", err);
    }
  });

  ws.on("close", () => {
    const info = activeSockets.get(ws);
    if (info && info.roomId && info.playerId) {
      if (socketsByRoom.has(info.roomId)) {
        socketsByRoom.get(info.roomId)!.delete(info.playerId);
      }
      // Note: Do not immediately destroy the room or remove player on transient WS drops,
      // as players may reconnect or communicate via SSE / REST Polling!
    }
    activeSockets.delete(ws);
  });
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  server.listen(PORT, "0.0.0.0", () => {
    console.log(`Ludo Royale Server running on http://localhost:${PORT}`);
  });
}

startServer();
