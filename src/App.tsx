import React, { useState, useEffect, useRef } from 'react';
import { 
  UserProfile, 
  GamePlayer, 
  PlayerColor, 
  ChatMessage, 
  RoomState,
  MatchHistoryItem,
  GameRoom,
  RoomMode
} from './types/game';
import { networkManager } from './game/networkManager';
import { Language, translations } from './i18n/translations';
import { 
  VIP_EMAIL, 
  isSpecialVipUser, 
  getUserUnlockedPawnSkins, 
  getUserUnlockedDiceSkins, 
  getUserUnlockedBoardSkins 
} from './data/skins';
import { 
  canPawnMove, 
  calculateNewPosition, 
  getPathSequence,
  chooseBotMove, 
  isSafeTile 
} from './game/ludoEngine';
import { sound } from './utils/soundEngine';

// Components
import { TopBar } from './components/TopBar';
import { Lobby } from './components/Lobby';
import { LudoBoard } from './components/LudoBoard';
import { InGameChat } from './components/InGameChat';
import { StoreModal } from './components/StoreModal';
import { LuckySpinModal } from './components/LuckySpinModal';
import { DailyRewardsModal } from './components/DailyRewardsModal';
import { LeaderboardModal } from './components/LeaderboardModal';
import { GoogleAuthModal } from './components/GoogleAuthModal';
import { WinCelebrationModal } from './components/WinCelebrationModal';
import { WaitingRoom } from './components/WaitingRoom';
import { ProfileModal } from './components/ProfileModal';
import { CreatorCreditToast } from './components/CreatorCreditToast';

import { MessageSquare, ArrowLeft, RotateCcw, Sparkles, Eye } from 'lucide-react';

const DEFAULT_NEW_USER: UserProfile = {
  id: 'player_' + Math.random().toString(36).substring(2, 9),
  name: 'لاعب جديد',
  email: '',
  avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=KingSultan',
  coins: 1000,
  gems: 20,
  level: 1,
  xp: 0,
  wins: 0,
  losses: 0,
  totalGames: 0,
  selectedPawnSkin: 'classic',
  selectedDiceSkin: 'dice_classic',
  selectedBoardSkin: 'board_classic',
  unlockedPawnSkins: ['classic'],
  unlockedDiceSkins: ['dice_classic'],
  unlockedBoardSkins: ['board_classic'],
  isVipMaster: false,
  loginStreak: 1,
};

export default function App() {
  const [lang, setLang] = useState<Language>('ar');
  const [user, setUser] = useState<UserProfile>(() => {
    const saved = localStorage.getItem('ludo_user_profile');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (isSpecialVipUser(parsed.email)) {
          return {
            ...parsed,
            coins: 500000,
            gems: 5000,
            level: 50,
            isVipMaster: true,
            unlockedPawnSkins: getUserUnlockedPawnSkins(parsed.email),
            unlockedDiceSkins: getUserUnlockedDiceSkins(parsed.email),
            unlockedBoardSkins: getUserUnlockedBoardSkins(parsed.email),
          };
        } else {
          // Strict protection: Any non-VIP account must never inherit 500k coins or VIP status
          const hasCorruptedVipBalance = parsed.coins >= 100000 || parsed.gems >= 1000 || parsed.isVipMaster;
          return {
            ...DEFAULT_NEW_USER,
            ...parsed,
            coins: hasCorruptedVipBalance ? 1000 : (parsed.coins || 1000),
            gems: hasCorruptedVipBalance ? 20 : (parsed.gems || 20),
            level: hasCorruptedVipBalance ? 1 : (parsed.level || 1),
            isVipMaster: false,
            unlockedPawnSkins: hasCorruptedVipBalance ? ['classic'] : (parsed.unlockedPawnSkins || ['classic']),
            unlockedDiceSkins: hasCorruptedVipBalance ? ['dice_classic'] : (parsed.unlockedDiceSkins || ['dice_classic']),
            unlockedBoardSkins: hasCorruptedVipBalance ? ['board_classic'] : (parsed.unlockedBoardSkins || ['board_classic']),
            selectedPawnSkin: hasCorruptedVipBalance ? 'classic' : (parsed.selectedPawnSkin || 'classic'),
            selectedDiceSkin: hasCorruptedVipBalance ? 'dice_classic' : (parsed.selectedDiceSkin || 'dice_classic'),
            selectedBoardSkin: hasCorruptedVipBalance ? 'board_classic' : (parsed.selectedBoardSkin || 'board_classic'),
          };
        }
      } catch (e) {}
    }
    return DEFAULT_NEW_USER;
  });

  const [isMuted, setIsMuted] = useState(false);
  const [gameState, setGameState] = useState<'lobby' | 'waiting_room' | 'playing' | 'game_over'>('lobby');
  
  // Active Game State
  const TURN_DURATION = 30;
  const [turnTimer, setTurnTimer] = useState<number>(TURN_DURATION);
  const [gameMode, setGameMode] = useState<'online' | 'private' | 'bot' | 'local'>('bot');
  const [playerMode, setPlayerMode] = useState<RoomMode>('4p');
  const [currentBet, setCurrentBet] = useState(500);
  const [botDifficulty, setBotDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [players, setPlayers] = useState<GamePlayer[]>([]);
  const [currentTurnColor, setCurrentTurnColor] = useState<PlayerColor>('red');
  const [myColor, setMyColor] = useState<PlayerColor>('red');
  const [diceValue, setDiceValue] = useState<number | null>(null);
  const [hasRolled, setHasRolled] = useState(false);
  const [consecutiveSixes, setConsecutiveSixes] = useState(0);
  const [winners, setWinners] = useState<string[]>([]);
  const [actionLog, setActionLog] = useState<string>('');
  const [isMovingPawn, setIsMovingPawn] = useState<boolean>(false);
  const [movingPawnInfo, setMovingPawnInfo] = useState<{ color: PlayerColor; pawnIndex: number } | null>(null);

  // Waiting Room state for Online/Private
  const [currentRoom, setCurrentRoom] = useState<GameRoom | null>(null);
  const [isSpectator, setIsSpectator] = useState<boolean>(false);

  // Chat & Interactions
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [flyingEmojis, setFlyingEmojis] = useState<{ id: string; emoji: string; fromPlayerColor: PlayerColor; toPlayerColor: PlayerColor }[]>([]);

  // Modals
  const [isStoreOpen, setIsStoreOpen] = useState(false);
  const [isLuckySpinOpen, setIsLuckySpinOpen] = useState(false);
  const [isDailyRewardsOpen, setIsDailyRewardsOpen] = useState(false);
  const [isLeaderboardOpen, setIsLeaderboardOpen] = useState(false);
  const [isGoogleAuthOpen, setIsGoogleAuthOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [showCreatorIntro, setShowCreatorIntro] = useState(true);

  // Automatically prompt registration/login modal on first launch
  useEffect(() => {
    const saved = localStorage.getItem('ludo_user_profile');
    if (!saved) {
      setIsGoogleAuthOpen(true);
    }
  }, []);

  // Sync user state with localStorage and live global leaderboard
  useEffect(() => {
    localStorage.setItem('ludo_user_profile', JSON.stringify(user));
    
    // Live Server Leaderboard Synchronization
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
    }).catch(() => {});
  }, [user]);

  // Set RTL or LTR document direction based on language
  useEffect(() => {
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
  }, [lang]);

  // Helper to determine if current client is the authoritative match controller (for bots and timeouts)
  const isMatchController = () => {
    if (gameMode === 'bot' || gameMode === 'local') return true;
    if (currentRoom && currentRoom.hostId === user.id) return true;
    return false;
  };

  // Hybrid WebSocket & P2P WebRTC Network Event Subscription
  useEffect(() => {
    const unsubscribe = networkManager.subscribe(async (type, data) => {
      try {
        switch (type) {
          case 'ROOM_CREATED':
          case 'ROOM_UPDATED': {
            const serverRoom: GameRoom = data.room;
            if (!serverRoom) return;
            setCurrentRoom(serverRoom);
            const amSpectator = !!serverRoom.spectators?.some((s) => s.id === user.id);
            setIsSpectator(amSpectator);

            if (serverRoom.mode) {
              setPlayerMode(serverRoom.mode);
            }
            if (serverRoom.status === 'playing') {
              const gamePlayers: GamePlayer[] = serverRoom.players.map((p) => ({
                id: p.id,
                name: p.name,
                avatar: p.avatar,
                color: p.color,
                isBot: p.isBot,
                pawns: serverRoom.pawns ? (serverRoom.pawns[p.color] || [-1, -1, -1, -1]) : [-1, -1, -1, -1],
                isTurn: p.color === serverRoom.currentTurnColor,
              }));

              setPlayers(gamePlayers);
              setCurrentTurnColor(serverRoom.currentTurnColor || 'red');
              setDiceValue(serverRoom.diceValue ?? null);
              setHasRolled(serverRoom.hasRolled || false);
              setGameState('playing');
            } else {
              setGameState('waiting_room');
            }
            break;
          }
          case 'GAME_STARTED': {
            const serverRoom: GameRoom = data.room;
            if (!serverRoom) return;
            setCurrentRoom(serverRoom);
            const amSpectator = !!serverRoom.spectators?.some((s) => s.id === user.id);
            setIsSpectator(amSpectator);

            const gamePlayers: GamePlayer[] = serverRoom.players.map((p) => ({
              id: p.id,
              name: p.name,
              avatar: p.avatar,
              color: p.color,
              isBot: p.isBot,
              pawns: serverRoom.pawns ? (serverRoom.pawns[p.color] || [-1, -1, -1, -1]) : [-1, -1, -1, -1],
              isTurn: p.color === (serverRoom.currentTurnColor || 'red'),
            }));

            const me = serverRoom.players.find((p) => p.id === user.id);
            if (me) setMyColor(me.color);

            setPlayers(gamePlayers);
            setCurrentTurnColor(serverRoom.currentTurnColor || 'red');
            setDiceValue(null);
            setHasRolled(false);
            setConsecutiveSixes(0);
            setWinners([]);
            setGameState('playing');
            sound.playVictory();
            break;
          }
          case 'DICE_ROLLED': {
            if (data.color) {
              setDiceValue(data.roll);
              setHasRolled(true);
              setCurrentTurnColor(data.color);
              setConsecutiveSixes(data.consecutiveSixes || 0);
              sound.playDiceRoll();

              const rollerPlayer = players.find((p) => p.color === data.color);
              const pName = rollerPlayer ? rollerPlayer.name : data.color;

              if (data.consecutiveSixes === 3) {
                setActionLog(`${pName} حصل على 3 ستات متتالية! تم تمرير الدور 🚫`);
                sound.playCapture();
                if ((data.color === myColor || (rollerPlayer?.isBot && isMatchController())) && currentRoom) {
                  setTimeout(() => {
                    const next = getNextTurnColor(data.color);
                    advanceTurn(next, '3 ستات متتالية! تم تخطي الدور');
                  }, 1200);
                }
              } else {
                setActionLog(`${pName} رمى النرد وحصل على ${data.roll} 🎲`);

                // Check if active player has any valid moves
                const validMoves: number[] = [];
                rollerPlayer?.pawns.forEach((pos, idx) => {
                  if (canPawnMove(data.color, pos, data.roll)) {
                    validMoves.push(idx);
                  }
                });

                if (validMoves.length === 0) {
                  setActionLog(`${pName} لا توجد لديه حركات متاحة ⌛`);
                  if ((data.color === myColor || (rollerPlayer?.isBot && isMatchController())) && currentRoom) {
                    setTimeout(() => {
                      const next = getNextTurnColor(data.color);
                      advanceTurn(next, 'لا توجد حركات متاحة');
                    }, 1200);
                  }
                } else if (rollerPlayer?.isBot && isMatchController()) {
                  // If bot and this client is controller, execute bot move after short delay
                  setTimeout(() => {
                    handleBotMove(rollerPlayer, data.roll);
                  }, 700);
                }
              }
            }
            break;
          }
          case 'PAWN_MOVED': {
            // Animate remote pawn hop if move was made by someone else
            if (data.color !== myColor || isSpectator) {
              const movingPlayer = players.find((p) => p.color === data.color);
              if (movingPlayer && data.pawnIndex !== undefined && data.roll !== undefined) {
                const oldPos = movingPlayer.pawns[data.pawnIndex];
                const pathSequence = getPathSequence(data.color, oldPos, data.roll);

                setIsMovingPawn(true);
                setMovingPawnInfo({ color: data.color, pawnIndex: data.pawnIndex });

                let currentPos = oldPos;
                for (let stepIdx = 0; stepIdx < pathSequence.length; stepIdx++) {
                  currentPos = pathSequence[stepIdx];
                  setPlayers((prevPlayers) =>
                    prevPlayers.map((p) => {
                      if (p.color === data.color) {
                        const newPawns = [...p.pawns];
                        newPawns[data.pawnIndex] = currentPos;
                        return { ...p, pawns: newPawns };
                      }
                      return p;
                    })
                  );
                  sound.playStep();
                  await new Promise((resolve) => setTimeout(resolve, 180));
                }

                setIsMovingPawn(false);
                setMovingPawnInfo(null);
              }
            }

            if (data.newPawns) {
              setPlayers((prev) =>
                prev.map((p) => ({
                  ...p,
                  pawns: data.newPawns[p.color] || p.pawns,
                }))
              );
            }

            if (data.didCapture) {
              sound.playCapture();
              setActionLog(`${data.color} قام بأكل قطعة وكسب رمية إضافية! 💥`);
            } else if (data.didReachHome) {
              sound.playHomeGoal();
              setActionLog(`${data.color} أوصل قطعة إلى خط النهاية! 🌟`);
            } else {
              sound.playStep();
            }

            setCurrentTurnColor(data.nextTurnColor);
            setDiceValue(null);
            setHasRolled(false);
            setTurnTimer(TURN_DURATION);

            if (data.isWinner && data.winnerId) {
              setWinners((prev) => (prev.includes(data.winnerId) ? prev : [...prev, data.winnerId]));
              sound.playVictory();
              setGameState('game_over');
            }
            break;
          }
          case 'TURN_PASSED': {
            if (data.nextTurnColor) {
              setCurrentTurnColor(data.nextTurnColor);
              setDiceValue(null);
              setHasRolled(false);
              setConsecutiveSixes(0);
              setTurnTimer(TURN_DURATION);
              if (data.reason) {
                setActionLog(data.reason);
              }
            }
            break;
          }
          case 'STATE_SYNCED': {
            const serverRoom: GameRoom = data.room;
            if (!serverRoom) return;
            setCurrentRoom(serverRoom);
            if (serverRoom.pawns) {
              setPlayers((prev) =>
                prev.map((p) => ({
                  ...p,
                  pawns: serverRoom.pawns[p.color] || p.pawns,
                }))
              );
            }
            if (serverRoom.currentTurnColor) {
              setCurrentTurnColor(serverRoom.currentTurnColor);
            }
            setDiceValue(serverRoom.diceValue ?? null);
            setHasRolled(serverRoom.hasRolled || false);
            break;
          }
          case 'NEW_CHAT': {
            if (data.message) {
              setChatMessages((prev) => {
                if (prev.some((m) => m.id === data.message.id)) return prev;
                return [...prev, data.message];
              });
              sound.playClick();
            }
            break;
          }
          case 'EMOJI_THROWN': {
            const newEmoji = {
              id: `emoji-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
              emoji: data.emoji,
              fromPlayerColor: (data.fromPlayerColor || 'red') as PlayerColor,
              toPlayerColor: (data.toPlayerColor || 'blue') as PlayerColor,
            };
            setFlyingEmojis((prev) => [...prev, newEmoji]);
            sound.playSafeStar();
            setTimeout(() => {
              setFlyingEmojis((prev) => prev.filter((e) => e.id !== newEmoji.id));
            }, 2000);
            break;
          }
          case 'ERROR': {
            if (data.message) {
              alert(data.message);
            }
            break;
          }
        }
      } catch (err) {}
    });

    return () => {
      unsubscribe();
    };
  }, [user.id, players, myColor, isSpectator, currentRoom]);

  // Turn Order helper: dynamically cycle ONLY between players actually in the match
  const getNextTurnColor = (currentColor: PlayerColor): PlayerColor => {
    if (!players || players.length === 0) return 'red';
    const activeColors = players.map((p) => p.color);
    const standardOrder: PlayerColor[] = ['red', 'green', 'yellow', 'blue'];
    const validColors = standardOrder.filter((c) => activeColors.includes(c));
    if (validColors.length === 0) return 'red';
    const idx = validColors.indexOf(currentColor);
    if (idx === -1) return validColors[0];
    return validColors[(idx + 1) % validColors.length];
  };

  // Next Turn transition
  const advanceTurn = (nextColor?: PlayerColor, reason?: string) => {
    const next = nextColor || getNextTurnColor(currentTurnColor);
    setCurrentTurnColor(next);
    setDiceValue(null);
    setHasRolled(false);
    setConsecutiveSixes(0);
    setTurnTimer(TURN_DURATION);

    // Synchronize turn advancement in online rooms
    if (currentRoom) {
      networkManager.passTurn(currentRoom.code, next, reason);
    }
  };

  // Turn Timeout Handler: Auto-move or pass turn if 30s time runs out
  const isTimingOutRef = useRef<boolean>(false);

  const handleTurnTimeout = () => {
    const activePlayer = players.find((p) => p.color === currentTurnColor);
    if (!activePlayer) return;

    // Only trigger if human on their own client, or bot on controller client
    const isMine = activePlayer.color === myColor || gameMode === 'local';
    const isBotOnController = activePlayer.isBot && isMatchController();
    if (!isMine && !isBotOnController) return;

    const activePlayerName = activePlayer.name || currentTurnColor;
    setActionLog(`انتهى وقت دور ${activePlayerName}! تم تمرير الدور ⌛`);

    // If player has already rolled the dice, auto-execute the first available valid move
    if (hasRolled && diceValue !== null) {
      const validMoves: number[] = [];
      activePlayer.pawns.forEach((pos, idx) => {
        if (canPawnMove(currentTurnColor, pos, diceValue)) {
          validMoves.push(idx);
        }
      });

      if (validMoves.length > 0) {
        executePawnMove(currentTurnColor, validMoves[0], diceValue);
        return;
      }
    }

    // Otherwise, advance turn to next player
    const nextColor = getNextTurnColor(currentTurnColor);
    advanceTurn(nextColor, `انتهى وقت دور ${activePlayerName}`);
  };

  // Reset timeout lock on each turn change
  useEffect(() => {
    isTimingOutRef.current = false;
    setTurnTimer(TURN_DURATION);
  }, [currentTurnColor]);

  // 30-Second Turn Countdown Timer for active human players
  useEffect(() => {
    if (gameState !== 'playing' || winners.length > 0) return;

    const activePlayer = players.find((p) => p.color === currentTurnColor);
    // Bots execute automatically without a 30s timer
    if (activePlayer?.isBot) {
      setTurnTimer(TURN_DURATION);
      return;
    }

    // Pause timer during pawn hop animation
    if (isMovingPawn) return;

    const interval = setInterval(() => {
      setTurnTimer((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [currentTurnColor, gameState, isMovingPawn, winners.length, players]);

  // Handle Turn Timeout and Last 5 Seconds Alert Ticks
  useEffect(() => {
    if (gameState !== 'playing' || isMovingPawn || winners.length > 0) return;

    const activePlayer = players.find((p) => p.color === currentTurnColor);
    if (activePlayer?.isBot) return;

    if (turnTimer === 0) {
      if (!isTimingOutRef.current) {
        isTimingOutRef.current = true;
        sound.playTimerTimeout();
        handleTurnTimeout();
      }
    } else if (turnTimer <= 5 && turnTimer > 0) {
      // Play alert warning tick when it's the current player's turn
      if ((gameMode === 'local' || currentTurnColor === myColor) && !isSpectator) {
        sound.playTimerTick();
      }
    }
  }, [turnTimer, gameState, isMovingPawn, winners.length, currentTurnColor, players]);

  // Handle Dice Rolling
  const handleRollDice = () => {
    if (hasRolled || isMovingPawn) return;

    // Generate dice value 1 to 6
    const roll = Math.floor(Math.random() * 6) + 1;
    setDiceValue(roll);
    setHasRolled(true);
    sound.playDiceRoll();

    // Check consecutive sixes
    let newConsecutiveSixes = roll === 6 ? consecutiveSixes + 1 : 0;
    setConsecutiveSixes(newConsecutiveSixes);

    // Broadcast roll to online room immediately
    if (currentRoom) {
      networkManager.rollDice(currentRoom.code, currentTurnColor, roll, newConsecutiveSixes);
    }

    const activePlayer = players.find((p) => p.color === currentTurnColor);
    if (!activePlayer) return;

    if (newConsecutiveSixes === 3) {
      setActionLog('3 ستات متتالية! تم تخطي الدور 🚫');
      setTimeout(() => advanceTurn(undefined, '3 ستات متتالية! تم تخطي الدور'), 1200);
      return;
    }

    // Check if player has any valid moves
    const validMoves: number[] = [];
    activePlayer.pawns.forEach((pos, idx) => {
      if (canPawnMove(currentTurnColor, pos, roll)) {
        validMoves.push(idx);
      }
    });

    if (validMoves.length === 0) {
      setActionLog('لا توجد حركات متاحة ⌛');
      setTimeout(() => advanceTurn(undefined, 'لا توجد حركات متاحة'), 1200);
      return;
    }

    // If exactly 1 pawn is movable and it's a bot on controller machine, move it automatically
    if (activePlayer.isBot && isMatchController()) {
      setTimeout(() => {
        handleBotMove(activePlayer, roll);
      }, 700);
    }
  };

  // Handle Player Pawn Click & Move
  const handleSelectPawn = (pawnIndex: number) => {
    if (!hasRolled || diceValue === null || isMovingPawn) return;

    const activePlayer = players.find((p) => p.color === currentTurnColor);
    if (!activePlayer) return;

    if (!canPawnMove(currentTurnColor, activePlayer.pawns[pawnIndex], diceValue)) {
      return;
    }

    executePawnMove(currentTurnColor, pawnIndex, diceValue);
  };

  // Execute Pawn Move with Smooth Step-by-Step Hopping Animation & Sound
  const executePawnMove = async (color: PlayerColor, pawnIndex: number, roll: number) => {
    const activePlayer = players.find((p) => p.color === color);
    if (!activePlayer || isMovingPawn) return;

    setIsMovingPawn(true);
    setMovingPawnInfo({ color, pawnIndex });

    const oldPos = activePlayer.pawns[pawnIndex];
    const pathSequence = getPathSequence(color, oldPos, roll);

    let currentPos = oldPos;
    const updatedPawnsMap: Record<PlayerColor, number[]> = {
      red: [...(players.find((p) => p.color === 'red')?.pawns || [-1, -1, -1, -1])],
      green: [...(players.find((p) => p.color === 'green')?.pawns || [-1, -1, -1, -1])],
      yellow: [...(players.find((p) => p.color === 'yellow')?.pawns || [-1, -1, -1, -1])],
      blue: [...(players.find((p) => p.color === 'blue')?.pawns || [-1, -1, -1, -1])],
    };

    // Smooth step-by-step hop loop
    for (let stepIdx = 0; stepIdx < pathSequence.length; stepIdx++) {
      currentPos = pathSequence[stepIdx];

      setPlayers((prevPlayers) =>
        prevPlayers.map((p) => {
          if (p.color === color) {
            const newPawns = [...p.pawns];
            newPawns[pawnIndex] = currentPos;
            return { ...p, pawns: newPawns };
          }
          return p;
        })
      );

      sound.playStep();
      await new Promise((resolve) => setTimeout(resolve, 180));
    }

    const finalPos = currentPos;
    let gotExtraTurn = roll === 6;
    let didCapture = false;
    let didReachHome = finalPos === 200;

    updatedPawnsMap[color][pawnIndex] = finalPos;

    // Capture opponent pawn if landing on common track and not safe star
    if (finalPos >= 0 && finalPos <= 51 && !isSafeTile(finalPos)) {
      Object.keys(updatedPawnsMap).forEach((col) => {
        const c = col as PlayerColor;
        if (c !== color) {
          updatedPawnsMap[c] = updatedPawnsMap[c].map((pos) => {
            if (pos === finalPos) {
              didCapture = true;
              gotExtraTurn = true;
              return -1; // Knock back to base!
            }
            return pos;
          });
        }
      });

      setPlayers((prevPlayers) =>
        prevPlayers.map((p) => {
          if (p.color !== color) {
            return { ...p, pawns: updatedPawnsMap[p.color] };
          }
          return p;
        })
      );
    }

    if (didReachHome) {
      gotExtraTurn = true;
    }

    if (didCapture) {
      sound.playCapture();
      setActionLog(`${activePlayer.name} قام بأكل قطعة وكسب رمية إضافية! 💥`);
    } else if (didReachHome) {
      sound.playHomeGoal();
      setActionLog(`${activePlayer.name} أوصل قطعة إلى خط النهاية! 🌟`);
    }

    setIsMovingPawn(false);
    setMovingPawnInfo(null);

    const isWinner = updatedPawnsMap[color].every((pos) => pos === 200);
    const nextTurnColor = gotExtraTurn ? color : getNextTurnColor(color);

    // Sync state in online rooms via dedicated movePawn event
    if (currentRoom) {
      networkManager.movePawn(currentRoom.code, {
        color,
        pawnIndex,
        roll,
        newPawns: updatedPawnsMap,
        nextTurnColor,
        gotExtraTurn,
        didCapture,
        didReachHome,
        isWinner,
        winnerId: isWinner ? activePlayer.id : undefined,
      });
    }

    // Check Win Condition
    setTimeout(() => {
      checkWinCondition(color, pawnIndex, finalPos, gotExtraTurn);
    }, 300);
  };

  // Check if Player Won Match
  const checkWinCondition = (
    color: PlayerColor,
    pawnIndex: number,
    newPos: number,
    gotExtraTurn: boolean
  ) => {
    const p = players.find((pl) => pl.color === color);
    if (!p) return;

    const currentPawns = [...p.pawns];
    currentPawns[pawnIndex] = newPos;
    const isWinner = currentPawns.every((pos) => pos === 200);

    if (isWinner) {
      setWinners((prev) => [...prev, p.id]);
      sound.playVictory();
      
      // Update User XP & Coins & Leaderboard
      const totalPool = currentBet * players.length;
      const isMeWinner = p.color === myColor;

      const myPlayer = players.find((pl) => pl.color === myColor);
      const myFinishedPawns = myPlayer ? myPlayer.pawns.filter((pos) => pos === 200).length : (isMeWinner ? 4 : 2);

      const modeLabel = gameMode === 'online'
        ? (playerMode === '2p' ? 'مباراة سريعة 1 ضد 1' : playerMode === '3p' ? 'مباراة سريعة 3 لاعبين' : 'مباراة سريعة 4 لاعبين')
        : gameMode === 'private'
        ? 'غرفة أصدقاء خاصة'
        : gameMode === 'local'
        ? 'لعب محلي (تمرير)'
        : (playerMode === '2p' ? 'تحدي الذكاء الاصطناعي (1 ضد 1)' : playerMode === '3p' ? 'تحدي الذكاء الاصطناعي (3 لاعبين)' : 'تحدي الذكاء الاصطناعي (4 لاعبين)');

      const newHistoryItem: MatchHistoryItem = {
        id: `match-${Date.now()}`,
        timestamp: Date.now(),
        dateStr: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' }),
        mode: gameMode,
        modeLabel,
        result: isMeWinner ? 'win' : 'loss',
        bet: currentBet,
        coinsDelta: isMeWinner ? totalPool : (currentBet > 0 ? -currentBet : 0),
        xpEarned: isMeWinner ? 400 : 100,
        myColor,
        finishedPawns: isMeWinner ? 4 : myFinishedPawns,
        opponentsCount: players.length,
      };

      if (isMeWinner) {
        setUser((prev) => ({
          ...prev,
          coins: prev.coins + totalPool,
          wins: prev.wins + 1,
          totalGames: prev.totalGames + 1,
          xp: prev.xp + 400,
          level: Math.min(100, Math.floor((prev.xp + 400) / (prev.level * 500)) + prev.level),
          matchHistory: [newHistoryItem, ...(prev.matchHistory || [])].slice(0, 10),
        }));
      } else {
        setUser((prev) => ({
          ...prev,
          totalGames: prev.totalGames + 1,
          losses: prev.losses + 1,
          xp: prev.xp + 100,
          matchHistory: [newHistoryItem, ...(prev.matchHistory || [])].slice(0, 10),
        }));
      }

      // Sync with server leaderboard
      fetch('/api/leaderboard/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: user.name,
          email: user.email,
          avatar: user.avatar,
          coinsWon: isMeWinner ? totalPool : -currentBet,
          won: isMeWinner,
        }),
      }).catch(() => {});

      setGameState('game_over');
      return;
    }

    // If extra turn, keep current turn color and reset roll
    if (gotExtraTurn) {
      setDiceValue(null);
      setHasRolled(false);
      
      // If active player is a bot, trigger next bot roll
      if (p.isBot) {
        setTimeout(() => {
          handleBotTurn(p);
        }, 900);
      }
    } else {
      advanceTurn();
    }
  };

  // Bot AI Turn Execution
  const handleBotTurn = (botPlayer: GamePlayer) => {
    if (gameState !== 'playing' || !isMatchController() || isMovingPawn) return;

    // Roll dice for bot
    const roll = Math.floor(Math.random() * 6) + 1;
    setDiceValue(roll);
    setHasRolled(true);
    sound.playDiceRoll();

    // Check consecutive sixes
    let newConsecutiveSixes = roll === 6 ? consecutiveSixes + 1 : 0;
    setConsecutiveSixes(newConsecutiveSixes);

    if (currentRoom) {
      networkManager.rollDice(currentRoom.code, botPlayer.color, roll, newConsecutiveSixes);
    }

    if (newConsecutiveSixes === 3) {
      setActionLog(`${botPlayer.name} حصل على 3 ستات متتالية! تم تمرير الدور 🚫`);
      setTimeout(() => advanceTurn(undefined, '3 ستات متتالية! تم تخطي الدور'), 1200);
      return;
    }

    // Find all players' pawns map for heuristic scoring
    const pawnsMap: Record<PlayerColor, number[]> = {
      red: players.find((p) => p.color === 'red')?.pawns || [],
      green: players.find((p) => p.color === 'green')?.pawns || [],
      yellow: players.find((p) => p.color === 'yellow')?.pawns || [],
      blue: players.find((p) => p.color === 'blue')?.pawns || [],
    };

    setTimeout(() => {
      const bestMoveIdx = chooseBotMove(
        botPlayer.color,
        botPlayer.pawns,
        roll,
        pawnsMap,
        botDifficulty
      );

      if (bestMoveIdx === -1) {
        setActionLog(`${botPlayer.name} لم يجد حركة مناسبة ⌛`);
        setTimeout(() => advanceTurn(undefined, 'لا توجد حركات متاحة'), 1000);
      } else {
        executePawnMove(botPlayer.color, bestMoveIdx, roll);
      }
    }, 800);
  };

  const handleBotMove = (botPlayer: GamePlayer, roll: number) => {
    if (!isMatchController() || isMovingPawn) return;

    const pawnsMap: Record<PlayerColor, number[]> = {
      red: players.find((p) => p.color === 'red')?.pawns || [],
      green: players.find((p) => p.color === 'green')?.pawns || [],
      yellow: players.find((p) => p.color === 'yellow')?.pawns || [],
      blue: players.find((p) => p.color === 'blue')?.pawns || [],
    };

    const bestMoveIdx = chooseBotMove(
      botPlayer.color,
      botPlayer.pawns,
      roll,
      pawnsMap,
      botDifficulty
    );

    if (bestMoveIdx !== -1) {
      executePawnMove(botPlayer.color, bestMoveIdx, roll);
    } else {
      advanceTurn(undefined, 'لا توجد حركات متاحة');
    }
  };

  // Trigger bot turn automatically when active player is bot and this client is the match controller
  useEffect(() => {
    if (gameState === 'playing' && !hasRolled && !isMovingPawn) {
      const activePlayer = players.find((p) => p.color === currentTurnColor);
      if (activePlayer && activePlayer.isBot && isMatchController()) {
        const timer = setTimeout(() => {
          handleBotTurn(activePlayer);
        }, 1000);
        return () => clearTimeout(timer);
      }
    }
  }, [currentTurnColor, hasRolled, gameState, players, isMovingPawn]);

  // Start Quick Match Online
  const handleStartQuickMatch = (mode: RoomMode, bet: number) => {
    setGameMode('online');
    setPlayerMode(mode);
    setCurrentBet(bet);
    sound.playClick();

    networkManager.createRoom({
      name: `مباراة سريعة ${user.name}`,
      mode,
      bet,
      hostPlayer: {
        id: user.id,
        name: user.name,
        avatar: user.avatar,
        pawnSkin: user.selectedPawnSkin,
        diceSkin: user.selectedDiceSkin,
      },
      boardTheme: user.selectedBoardSkin,
    });
  };

  // Create Private Room
  const handleCreatePrivateRoom = async (name: string, mode: RoomMode, bet: number) => {
    const roomDisplayName = name.trim() || `غرفة ${user.name}`;
    setGameMode('private');
    setPlayerMode(mode);
    setCurrentBet(bet);
    setIsSpectator(false);
    sound.playClick();

    networkManager.createRoom({
      name: roomDisplayName,
      mode,
      bet,
      hostPlayer: {
        id: user.id,
        name: user.name,
        avatar: user.avatar,
        pawnSkin: user.selectedPawnSkin,
        diceSkin: user.selectedDiceSkin,
      },
      boardTheme: user.selectedBoardSkin,
    });
  };

  // Join Private Room
  const handleJoinPrivateRoom = async (code: string, asSpectator = false) => {
    setGameMode('private');
    setIsSpectator(asSpectator);
    sound.playClick();

    networkManager.joinRoom(
      code.toUpperCase(),
      {
        id: user.id,
        name: user.name,
        avatar: user.avatar,
        pawnSkin: user.selectedPawnSkin,
        diceSkin: user.selectedDiceSkin,
      },
      asSpectator
    );
  };

  // Start VS Bot Match
  const handleStartVsBot = (mode: RoomMode, difficulty: 'easy' | 'medium' | 'hard') => {
    setGameMode('bot');
    setPlayerMode(mode);
    setBotDifficulty(difficulty);
    setCurrentBet(500);
    setMyColor('red');

    let botList: GamePlayer[] = [];
    if (mode === '2p') {
      botList = [
        {
          id: user.id,
          name: user.name,
          avatar: user.avatar,
          color: 'red',
          pawns: [-1, -1, -1, -1],
          isBot: false,
        },
        {
          id: 'bot-yellow',
          name: 'سلطان الروبوت 🤖',
          avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=YellowBot',
          color: 'yellow',
          pawns: [-1, -1, -1, -1],
          isBot: true,
        },
      ];
    } else if (mode === '3p') {
      botList = [
        {
          id: user.id,
          name: user.name,
          avatar: user.avatar,
          color: 'red',
          pawns: [-1, -1, -1, -1],
          isBot: false,
        },
        {
          id: 'bot-green',
          name: 'Falcon_AI 🦅',
          avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=GreenBot',
          color: 'green',
          pawns: [-1, -1, -1, -1],
          isBot: true,
        },
        {
          id: 'bot-yellow',
          name: 'سلطان الروبوت 🤖',
          avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=YellowBot',
          color: 'yellow',
          pawns: [-1, -1, -1, -1],
          isBot: true,
        },
      ];
    } else {
      botList = [
        {
          id: user.id,
          name: user.name,
          avatar: user.avatar,
          color: 'red',
          pawns: [-1, -1, -1, -1],
          isBot: false,
        },
        {
          id: 'bot-green',
          name: 'Falcon_AI 🦅',
          avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=GreenBot',
          color: 'green',
          pawns: [-1, -1, -1, -1],
          isBot: true,
        },
        {
          id: 'bot-yellow',
          name: 'سلطان الروبوت 🤖',
          avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=YellowBot',
          color: 'yellow',
          pawns: [-1, -1, -1, -1],
          isBot: true,
        },
        {
          id: 'bot-blue',
          name: 'Tiger_Bot 🐯',
          avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=BlueBot',
          color: 'blue',
          pawns: [-1, -1, -1, -1],
          isBot: true,
        },
      ];
    }

    setPlayers(botList);
    setCurrentTurnColor('red');
    setDiceValue(null);
    setHasRolled(false);
    setWinners([]);
    setGameState('playing');
    sound.playVictory();
  };

  // Start Pass & Play Local Match
  const handleStartPassAndPlay = (count: 2 | 3 | 4) => {
    setGameMode('local');
    setPlayerMode(count === 2 ? '2p' : count === 3 ? '3p' : '4p');
    setCurrentBet(0);
    setMyColor('red');

    const colors: PlayerColor[] =
      count === 2 ? ['red', 'yellow'] : count === 3 ? ['red', 'green', 'yellow'] : ['red', 'green', 'yellow', 'blue'];

    const localPlayers: GamePlayer[] = colors.map((col, idx) => ({
      id: `local-${col}`,
      name: `اللاعب ${idx + 1} (${col})`,
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${col}`,
      color: col,
      pawns: [-1, -1, -1, -1],
      isBot: false,
    }));

    setPlayers(localPlayers);
    setCurrentTurnColor('red');
    setDiceValue(null);
    setHasRolled(false);
    setWinners([]);
    setGameState('playing');
    sound.playVictory();
  };

  // Start Game from Waiting Room
  const handleStartGameFromWaitingRoom = () => {
    sound.playClick();
    if (currentRoom) {
      networkManager.startGame(currentRoom.code);
    }
  };

  // Send Chat Message
  const handleSendMessage = (text: string) => {
    const newMsg: ChatMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      senderId: user.id,
      senderName: user.name,
      senderColor: myColor,
      isSpectator: isSpectator,
      text,
      timestamp: Date.now(),
    };

    setChatMessages((prev) => [...prev, newMsg]);

    if (currentRoom) {
      networkManager.sendChat(currentRoom.code, newMsg);
    }
  };

  // Send Interactive Emoji
  const handleSendEmoji = (emoji: string) => {
    const newEmoji = {
      id: `emoji-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      emoji,
      fromPlayerColor: myColor,
      toPlayerColor: currentTurnColor,
    };
    setFlyingEmojis((prev) => [...prev, newEmoji]);
    sound.playSafeStar();

    if (currentRoom) {
      networkManager.throwEmoji(currentRoom.code, emoji, myColor, currentTurnColor);
    }

    setTimeout(() => {
      setFlyingEmojis((prev) => prev.filter((e) => e.id !== newEmoji.id));
    }, 2000);
  };

  // Google / Custom Registration Login Handler
  const handleGoogleLogin = (email: string, name: string, avatar?: string, password?: string) => {
    const isVip = isSpecialVipUser(email);
    let updatedUser: UserProfile;

    if (isVip) {
      // ONLY for hamodydeab3@gmail.com
      updatedUser = {
        id: 'vip_hamody_master',
        email: VIP_EMAIL,
        name: name || '👑 Hamody (المالك VIP)',
        avatar: avatar || 'https://api.dicebear.com/7.x/bottts/svg?seed=hamodydeab3',
        password: password || '123456',
        coins: 500000,
        gems: 5000,
        level: 50,
        xp: 12500,
        wins: 142,
        losses: 12,
        totalGames: 154,
        isVipMaster: true,
        loginStreak: 7,
        selectedPawnSkin: 'golden_sultan',
        selectedDiceSkin: 'dice_gold',
        selectedBoardSkin: 'board_royal_velvet',
        unlockedPawnSkins: getUserUnlockedPawnSkins(VIP_EMAIL),
        unlockedDiceSkins: getUserUnlockedDiceSkins(VIP_EMAIL),
        unlockedBoardSkins: getUserUnlockedBoardSkins(VIP_EMAIL),
      };
    } else {
      // ANY OTHER USER / ACCOUNT: STRICTLY Standard Starter Balance
      updatedUser = {
        id: 'player_' + Math.random().toString(36).substring(2, 9),
        email: email ? email.trim() : '',
        name: name.trim() || 'لاعب جديد',
        avatar: avatar || 'https://api.dicebear.com/7.x/bottts/svg?seed=' + encodeURIComponent(name.trim() || 'Player'),
        password: password || '',
        coins: 1000,
        gems: 20,
        level: 1,
        xp: 0,
        wins: 0,
        losses: 0,
        totalGames: 0,
        isVipMaster: false,
        loginStreak: 1,
        unlockedPawnSkins: ['classic'],
        unlockedDiceSkins: ['dice_classic'],
        unlockedBoardSkins: ['board_classic'],
        selectedPawnSkin: 'classic',
        selectedDiceSkin: 'dice_classic',
        selectedBoardSkin: 'board_classic',
      };
    }

    setUser(updatedUser);
    localStorage.setItem('ludo_user_profile', JSON.stringify(updatedUser));
    setIsGoogleAuthOpen(false);
    sound.playVictory();
  };

  // Daily Rewards Claim
  const handleClaimDailyReward = (day: number, coins: number, gems: number) => {
    const todayStr = new Date().toISOString().split('T')[0];
    setUser((prev) => ({
      ...prev,
      coins: prev.coins + coins,
      gems: prev.gems + gems,
      loginStreak: Math.min(7, prev.loginStreak + 1),
      lastDailyRewardDate: todayStr,
    }));
  };

  // Lucky Spin Reward Won
  const handleLuckySpinReward = (reward: { type: 'coins' | 'gems' | 'skin'; amount: number }) => {
    if (reward.type === 'coins') {
      setUser((prev) => ({ ...prev, coins: prev.coins + reward.amount }));
    } else if (reward.type === 'gems') {
      setUser((prev) => ({ ...prev, gems: prev.gems + reward.amount }));
    } else if (reward.type === 'skin') {
      setUser((prev) => ({
        ...prev,
        coins: prev.coins + 10000,
        gems: prev.gems + 100,
      }));
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col font-sans selection:bg-amber-500 selection:text-slate-950">
      {/* Game Creator Launch Credit Toast (7 seconds with progress timer) */}
      {showCreatorIntro && (
        <CreatorCreditToast
          duration={7000}
          onComplete={() => setShowCreatorIntro(false)}
        />
      )}

      {/* Top Header Bar */}
      <TopBar
        user={user}
        lang={lang}
        onLanguageChange={setLang}
        onOpenStore={() => setIsStoreOpen(true)}
        onOpenLeaderboard={() => setIsLeaderboardOpen(true)}
        onOpenDailyRewards={() => setIsDailyRewardsOpen(true)}
        onOpenLuckySpin={() => setIsLuckySpinOpen(true)}
        onOpenProfile={() => setIsProfileOpen(true)}
        isMuted={isMuted}
        onToggleMute={() => {
          const next = !isMuted;
          setIsMuted(next);
          sound.setMuted(next);
        }}
      />

      {/* Main View Area */}
      <main className="flex-1 flex flex-col items-center justify-center p-2 sm:p-4">
        {/* LOBBY VIEW */}
        {gameState === 'lobby' && (
          <Lobby
            user={user}
            lang={lang}
            onStartQuickMatch={handleStartQuickMatch}
            onCreatePrivateRoom={handleCreatePrivateRoom}
            onJoinPrivateRoom={handleJoinPrivateRoom}
            onStartVsBot={handleStartVsBot}
            onStartPassAndPlay={handleStartPassAndPlay}
            onOpenStore={() => setIsStoreOpen(true)}
            onOpenGoogleAuth={() => setIsGoogleAuthOpen(true)}
          />
        )}

        {/* WAITING ROOM VIEW */}
        {gameState === 'waiting_room' && currentRoom && (
          <WaitingRoom
            room={currentRoom}
            myPlayerId={user.id}
            isSpectator={isSpectator}
            lang={lang}
            onStartGame={handleStartGameFromWaitingRoom}
            onLeaveRoom={() => {
              if (currentRoom) {
                networkManager.leaveRoom(currentRoom.code, user.id, isSpectator);
              }
              setCurrentRoom(null);
              setIsSpectator(false);
              setGameState('lobby');
            }}
          />
        )}

        {/* PLAYING / MATCH IN PROGRESS VIEW */}
        {(gameState === 'playing' || gameState === 'game_over') && (
          <div className="w-full max-w-4xl flex flex-col items-center">
            
            {/* Match Controls Bar */}
            <div className="w-full max-w-[620px] flex items-center justify-between px-2 mb-2">
              <button
                onClick={() => {
                  sound.playClick();
                  if (currentRoom) {
                    networkManager.leaveRoom(currentRoom.code, user.id, isSpectator);
                  }
                  setCurrentRoom(null);
                  setIsSpectator(false);
                  setGameState('lobby');
                }}
                className="py-1.5 px-3 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 text-xs font-bold flex items-center gap-1.5 transition-colors"
              >
                <ArrowLeft size={14} />
                <span>خروج للقائمة</span>
              </button>

              {/* Action / Turn / Spectator Notification */}
              {isSpectator ? (
                <div className="bg-purple-600/25 border border-purple-500/40 px-3.5 py-1 rounded-full text-xs font-black text-purple-300 shadow-md flex items-center gap-1.5">
                  <Eye size={14} className="text-purple-400" />
                  <span>وضع المشاهد • دور ({currentTurnColor})</span>
                </div>
              ) : (
                <div className="bg-slate-900/90 border border-slate-800 px-3.5 py-1 rounded-full text-xs font-black text-amber-300 shadow-md flex items-center gap-2 max-w-[220px] sm:max-w-md truncate">
                  <span className="truncate">
                    {actionLog || (currentTurnColor === myColor ? '🎯 دورك الآن! ارمِ النرد' : `🎲 دور اللاعب (${currentTurnColor})`)}
                  </span>
                </div>
              )}

              {/* Chat Toggle Button */}
              <button
                onClick={() => {
                  sound.playClick();
                  setIsChatOpen(!isChatOpen);
                }}
                className="py-1.5 px-3 rounded-xl bg-slate-900 border border-amber-500/30 text-amber-400 hover:bg-slate-850 text-xs font-bold flex items-center gap-1.5 transition-colors"
                id="in-game-chat-btn"
              >
                <MessageSquare size={14} />
                <span>المحادثة</span>
              </button>
            </div>

            {/* Scalable Ludo Board */}
            <LudoBoard
              players={players}
              currentTurnColor={currentTurnColor}
              diceValue={diceValue}
              hasRolled={hasRolled}
              myColor={gameMode === 'local' ? currentTurnColor : myColor}
              isMyTurn={!isSpectator && (gameMode === 'local' || currentTurnColor === myColor)}
              isOnlineMode={gameMode === 'online' || gameMode === 'private'}
              boardSkinId={user.selectedBoardSkin}
              pawnSkinId={user.selectedPawnSkin}
              diceSkinId={user.selectedDiceSkin}
              isSpectator={isSpectator}
              spectators={currentRoom?.spectators || []}
              onSendSpectatorEmoji={(emoji) => handleSendEmoji(emoji)}
              onRollDice={handleRollDice}
              onSelectPawn={handleSelectPawn}
              flyingEmojis={flyingEmojis}
              isMovingPawn={isMovingPawn}
              movingPawnInfo={movingPawnInfo}
              turnTimer={turnTimer}
              maxTurnTime={TURN_DURATION}
            />

            {/* In-Game Live Chat Drawer */}
            <InGameChat
              messages={chatMessages}
              lang={lang}
              onSendMessage={handleSendMessage}
              onSendEmoji={handleSendEmoji}
              isOpen={isChatOpen}
              onClose={() => setIsChatOpen(false)}
            />
          </div>
        )}
      </main>

      {/* MODALS */}
      <StoreModal
        user={user}
        lang={lang}
        isOpen={isStoreOpen}
        onClose={() => setIsStoreOpen(false)}
        onEquipPawnSkin={(skinId) => setUser((p) => ({ ...p, selectedPawnSkin: skinId }))}
        onEquipDiceSkin={(skinId) => setUser((p) => ({ ...p, selectedDiceSkin: skinId }))}
        onEquipBoardSkin={(skinId) => setUser((p) => ({ ...p, selectedBoardSkin: skinId }))}
        onBuyPawnSkin={(skinId, costCoins, costGems) =>
          setUser((p) => ({
            ...p,
            coins: Math.max(0, p.coins - costCoins),
            gems: Math.max(0, p.gems - costGems),
            unlockedPawnSkins: [...p.unlockedPawnSkins, skinId],
            selectedPawnSkin: skinId,
          }))
        }
        onBuyDiceSkin={(skinId, costCoins, costGems) =>
          setUser((p) => ({
            ...p,
            coins: Math.max(0, p.coins - costCoins),
            gems: Math.max(0, p.gems - costGems),
            unlockedDiceSkins: [...p.unlockedDiceSkins, skinId],
            selectedDiceSkin: skinId,
          }))
        }
        onBuyBoardSkin={(skinId, costCoins, costGems) =>
          setUser((p) => ({
            ...p,
            coins: Math.max(0, p.coins - costCoins),
            gems: Math.max(0, p.gems - costGems),
            unlockedBoardSkins: [...p.unlockedBoardSkins, skinId],
            selectedBoardSkin: skinId,
          }))
        }
      />

      <LuckySpinModal
        user={user}
        lang={lang}
        isOpen={isLuckySpinOpen}
        onClose={() => setIsLuckySpinOpen(false)}
        onRewardWon={handleLuckySpinReward}
      />

      <DailyRewardsModal
        user={user}
        lang={lang}
        isOpen={isDailyRewardsOpen}
        onClose={() => setIsDailyRewardsOpen(false)}
        onClaimReward={handleClaimDailyReward}
      />

      <LeaderboardModal
        user={user}
        lang={lang}
        isOpen={isLeaderboardOpen}
        onClose={() => setIsLeaderboardOpen(false)}
      />

      <GoogleAuthModal
        currentUser={user}
        lang={lang}
        isOpen={isGoogleAuthOpen}
        onClose={() => setIsGoogleAuthOpen(false)}
        onLogin={handleGoogleLogin}
      />

      <ProfileModal
        user={user}
        lang={lang}
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        onUpdateName={(name) => setUser((p) => ({ ...p, name }))}
        onOpenStore={() => {
          setIsProfileOpen(false);
          setIsStoreOpen(true);
        }}
        onOpenGoogleAuth={() => {
          setIsProfileOpen(false);
          setIsGoogleAuthOpen(true);
        }}
      />

      {gameState === 'game_over' && (
        <WinCelebrationModal
          winners={winners.length > 0 ? winners : [players[0]?.id || '']}
          players={players}
          myPlayerId={user.id}
          betAmount={currentBet}
          lang={lang}
          onPlayAgain={() => {
            if (gameMode === 'bot') {
              handleStartVsBot(playerMode, botDifficulty);
            } else if (gameMode === 'local') {
              handleStartPassAndPlay(players.length as any);
            } else {
              setGameState('lobby');
            }
          }}
          onReturnToLobby={() => setGameState('lobby')}
        />
      )}
    </div>
  );
}
