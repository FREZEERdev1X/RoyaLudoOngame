import Peer, { DataConnection } from 'peerjs';
import { GameRoom, RoomPlayer, Spectator, PlayerColor, ChatMessage, RoomMode } from '../types/game';

export type NetworkEventType =
  | 'ROOM_CREATED'
  | 'ROOM_UPDATED'
  | 'GAME_STARTED'
  | 'STATE_SYNCED'
  | 'DICE_ROLLED'
  | 'PAWN_MOVED'
  | 'TURN_PASSED'
  | 'NEW_CHAT'
  | 'EMOJI_THROWN'
  | 'ERROR'
  | 'CONNECTIVITY_CHANGED';

export type NetworkEventListener = (type: NetworkEventType, data: any) => void;

class HybridNetworkManager {
  private ws: WebSocket | null = null;
  private peer: Peer | null = null;
  private connections: Map<string, DataConnection> = new Map();
  private hostConnection: DataConnection | null = null;
  private currentRoom: GameRoom | null = null;
  private myPlayerId: string = '';
  private isHost: boolean = false;
  private isConnectedWs: boolean = false;
  private isConnectedPeer: boolean = false;
  private listeners: Set<NetworkEventListener> = new Set();
  private localRoomCode: string = '';

  constructor() {
    this.initWebSocket();
  }

  public subscribe(listener: NetworkEventListener) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private emit(type: NetworkEventType, data: any) {
    this.listeners.forEach((listener) => {
      try {
        listener(type, data);
      } catch (err) {
        console.error('Error in network listener:', err);
      }
    });
  }

  // Initialize WebSocket with auto-reconnect and fallback
  private reconnectTimer: any = null;
  private pingTimer: any = null;
  private roomPollTimer: any = null;

  private initWebSocket() {
    try {
      if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
        return;
      }

      const protocol = typeof window !== 'undefined' && window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const host = typeof window !== 'undefined' ? window.location.host : 'localhost:3000';
      const wsUrl = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_WS_URL) || `${protocol}//${host}`;

      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        this.isConnectedWs = true;
        this.emit('CONNECTIVITY_CHANGED', { mode: 'websocket', online: true });
        
        // Start ping interval
        clearInterval(this.pingTimer);
        this.pingTimer = setInterval(() => {
          if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            try {
              this.ws.send(JSON.stringify({ type: 'PING' }));
            } catch (e) {}
          }
        }, 15000);

        // If in a room, re-join/re-sync
        if (this.localRoomCode && this.myPlayerId) {
          this.ws?.send(
            JSON.stringify({
              type: 'JOIN_ROOM',
              payload: {
                roomCode: this.localRoomCode,
                player: { id: this.myPlayerId },
                asSpectator: false,
              },
            })
          );
        }
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type) {
            if (data.room) {
              this.currentRoom = data.room;
            }
            this.emit(data.type as NetworkEventType, data);
          }
        } catch (e) {}
      };

      this.ws.onerror = () => {
        this.isConnectedWs = false;
      };

      this.ws.onclose = () => {
        this.isConnectedWs = false;
        clearInterval(this.pingTimer);
        // Schedule auto-reconnect after 2.5 seconds
        clearTimeout(this.reconnectTimer);
        this.reconnectTimer = setTimeout(() => {
          this.initWebSocket();
        }, 2500);
      };
    } catch (e) {
      this.isConnectedWs = false;
    }
  }

  // Start background room sync poller (fallback for cross-network and mobile connection drops)
  private startRoomPoller(roomCode: string) {
    clearInterval(this.roomPollTimer);
    this.roomPollTimer = setInterval(async () => {
      if (!this.localRoomCode || this.localRoomCode !== roomCode) {
        clearInterval(this.roomPollTimer);
        return;
      }
      try {
        const res = await fetch(`/api/rooms/${roomCode}`);
        if (res.ok) {
          const data = await res.json();
          if (data && data.room) {
            const serverRoom: GameRoom = data.room;
            // Only update if server has newer action or state differs
            if (!this.currentRoom || serverRoom.lastActionTime > (this.currentRoom.lastActionTime || 0)) {
              this.currentRoom = serverRoom;
              this.emit(
                serverRoom.status === 'playing' ? 'GAME_STARTED' : 'ROOM_UPDATED',
                { room: serverRoom }
              );
            }
          }
        }
      } catch (err) {}
    }, 2000);
  }

  private stopRoomPoller() {
    clearInterval(this.roomPollTimer);
  }

  // Initialize PeerJS for Serverless WebRTC P2P
  private async initPeerHost(roomCode: string): Promise<Peer> {
    if (this.peer && !this.peer.destroyed) {
      this.peer.destroy();
    }

    const peerId = `ludo-v2-${roomCode.toUpperCase()}`;

    return new Promise((resolve) => {
      const peer = new Peer(peerId, {
        config: {
          iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' },
            { urls: 'stun:stun2.l.google.com:19302' },
          ],
        },
      });

      peer.on('open', () => {
        this.isConnectedPeer = true;
        this.peer = peer;
        this.setupHostListeners(peer);
        resolve(peer);
      });

      peer.on('error', (err) => {
        console.warn('Peer host warning:', err);
        resolve(peer);
      });
    });
  }

  private setupHostListeners(peer: Peer) {
    peer.on('connection', (conn) => {
      conn.on('open', () => {
        this.connections.set(conn.peer, conn);
        // Send current room state to new peer
        if (this.currentRoom) {
          conn.send({
            type: this.currentRoom.status === 'playing' ? 'GAME_STARTED' : 'ROOM_UPDATED',
            room: this.currentRoom,
          });
        }
      });

      conn.on('data', (raw: any) => {
        this.handleHostReceivedData(conn, raw);
      });

      conn.on('close', () => {
        this.connections.delete(conn.peer);
      });

      conn.on('error', () => {
        this.connections.delete(conn.peer);
      });
    });
  }

  // Host handles incoming P2P requests from clients
  private handleHostReceivedData(conn: DataConnection, data: any) {
    if (!data || !this.currentRoom) return;

    const { type, payload } = data;

    switch (type) {
      case 'JOIN_ROOM': {
        const { player, isSpectator } = payload;
        const room = this.currentRoom;
        if (!room.spectators) room.spectators = [];

        const maxPlayers = room.mode === '2p' ? 2 : room.mode === '3p' ? 3 : 4;
        const shouldSpectate = Boolean(isSpectator || room.status !== 'waiting' || room.players.length >= maxPlayers);

        if (shouldSpectate) {
          if (!room.spectators.some((s) => s.id === player.id)) {
            room.spectators.push({
              id: player.id,
              name: player.name,
              avatar: player.avatar,
              country: player.country || 'SA',
              joinedAt: Date.now(),
            });
          }
          this.currentRoom = { ...room };
          this.broadcastP2P({
            type: room.status === 'playing' ? 'GAME_STARTED' : 'ROOM_UPDATED',
            room: this.currentRoom,
          });
          return;
        }

        const existingIdx = room.players.findIndex((p) => p.id === player.id);
        if (existingIdx === -1) {
          const availableColors: PlayerColor[] =
            room.mode === '2p'
              ? ['red', 'yellow']
              : room.mode === '3p'
              ? ['red', 'green', 'yellow']
              : ['red', 'green', 'yellow', 'blue'];
          const usedColors = room.players.map((p) => p.color);
          const assignedColor = availableColors.find((c) => !usedColors.includes(c)) || 'blue';

          room.players.push({
            ...player,
            color: assignedColor,
            isReady: true,
          });
        }

        this.currentRoom = { ...room };
        this.broadcastP2P({ type: 'ROOM_UPDATED', room: this.currentRoom });
        break;
      }

      case 'ROLL_DICE': {
        if (this.currentRoom && payload) {
          this.currentRoom = {
            ...this.currentRoom,
            diceValue: payload.roll,
            hasRolled: true,
            currentTurnColor: payload.color,
            consecutiveSixes: payload.consecutiveSixes || 0,
            lastActionTime: Date.now(),
          };
          this.broadcastP2P({
            type: 'DICE_ROLLED',
            color: payload.color,
            roll: payload.roll,
            consecutiveSixes: payload.consecutiveSixes || 0,
            room: this.currentRoom,
          });
        }
        break;
      }

      case 'MOVE_PAWN': {
        if (this.currentRoom && payload) {
          const winners = [...(this.currentRoom.winners || [])];
          if (payload.isWinner && payload.winnerId && !winners.includes(payload.winnerId)) {
            winners.push(payload.winnerId);
          }
          this.currentRoom = {
            ...this.currentRoom,
            pawns: payload.newPawns || this.currentRoom.pawns,
            currentTurnColor: payload.nextTurnColor,
            hasRolled: false,
            diceValue: null,
            winners,
            lastActionTime: Date.now(),
          };
          this.broadcastP2P({
            type: 'PAWN_MOVED',
            color: payload.color,
            pawnIndex: payload.pawnIndex,
            roll: payload.roll,
            newPawns: this.currentRoom.pawns,
            nextTurnColor: payload.nextTurnColor,
            gotExtraTurn: payload.gotExtraTurn,
            didCapture: payload.didCapture,
            didReachHome: payload.didReachHome,
            isWinner: payload.isWinner,
            winnerId: payload.winnerId,
            room: this.currentRoom,
          });
        }
        break;
      }

      case 'PASS_TURN': {
        if (this.currentRoom && payload) {
          this.currentRoom = {
            ...this.currentRoom,
            currentTurnColor: payload.nextTurnColor,
            hasRolled: false,
            diceValue: null,
            lastActionTime: Date.now(),
          };
          this.broadcastP2P({
            type: 'TURN_PASSED',
            nextTurnColor: payload.nextTurnColor,
            reason: payload.reason,
            room: this.currentRoom,
          });
        }
        break;
      }

      case 'SYNC_STATE': {
        if (payload?.roomState) {
          this.currentRoom = { ...payload.roomState, lastActionTime: Date.now() };
          this.broadcastP2P({ type: 'STATE_SYNCED', room: this.currentRoom });
        }
        break;
      }

      case 'CHAT_MESSAGE': {
        this.broadcastP2P({ type: 'NEW_CHAT', message: payload?.message });
        break;
      }

      case 'EMOJI_INTERACTION': {
        this.broadcastP2P({
          type: 'EMOJI_THROWN',
          emoji: payload?.emoji,
          fromPlayerId: payload?.fromPlayerId,
          toPlayerId: payload?.toPlayerId,
          fromPlayerColor: payload?.fromPlayerColor,
          toPlayerColor: payload?.toPlayerColor,
        });
        break;
      }

      case 'LEAVE_ROOM': {
        const { playerId, isSpectator: wasSpec } = payload || {};
        if (!playerId) return;

        if (wasSpec && this.currentRoom.spectators) {
          this.currentRoom.spectators = this.currentRoom.spectators.filter((s) => s.id !== playerId);
        } else {
          this.currentRoom.players = this.currentRoom.players.filter((p) => p.id !== playerId);
        }

        this.broadcastP2P({ type: 'ROOM_UPDATED', room: this.currentRoom });
        break;
      }
    }
  }

  // Broadcast to all connected WebRTC Peers
  private broadcastP2P(data: any) {
    this.emit(data.type as NetworkEventType, data);
    this.connections.forEach((conn) => {
      if (conn.open) {
        try {
          conn.send(data);
        } catch (e) {}
      }
    });
  }

  // Helper to send action via REST if needed
  private async postAction(roomCode: string, type: string, payload: any) {
    try {
      await fetch('/api/rooms/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomCode, type, payload }),
      });
    } catch (e) {}
  }

  // Create a new room (Hybrid WebSocket + Centralized Server DB + WebRTC)
  public async createRoom(params: {
    name: string;
    mode: RoomMode;
    bet: number;
    hostPlayer: Omit<RoomPlayer, 'color'>;
    boardTheme: string;
  }): Promise<GameRoom> {
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    this.localRoomCode = code;
    this.isHost = true;
    this.myPlayerId = params.hostPlayer.id;

    const initialRoom: GameRoom = {
      code,
      name: params.name || `غرفة ${params.hostPlayer.name}`,
      mode: params.mode,
      bet: params.bet,
      status: 'waiting',
      hostId: params.hostPlayer.id,
      players: [
        {
          ...params.hostPlayer,
          color: 'red',
          isReady: true,
        },
      ],
      spectators: [],
      turnIndex: 0,
      currentTurnColor: 'red',
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
      boardTheme: params.boardTheme || 'classic',
      createdAt: Date.now(),
      lastActionTime: Date.now(),
    };

    this.currentRoom = initialRoom;

    // 1. Immediately register on Central Server DB via REST
    try {
      await fetch('/api/rooms/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code,
          name: initialRoom.name,
          mode: initialRoom.mode,
          bet: initialRoom.bet,
          hostPlayer: params.hostPlayer,
          boardTheme: initialRoom.boardTheme,
        }),
      });
    } catch (err) {
      console.warn('REST create room warning:', err);
    }

    // 2. Register over WebSocket
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(
        JSON.stringify({
          type: 'CREATE_ROOM',
          payload: {
            code,
            name: initialRoom.name,
            mode: initialRoom.mode,
            bet: initialRoom.bet,
            hostPlayer: params.hostPlayer,
            boardTheme: initialRoom.boardTheme,
          },
        })
      );
    } else {
      this.initWebSocket();
    }

    // 3. Start background sync poller
    this.startRoomPoller(code);

    // 4. Initialize PeerJS host for direct P2P connections
    try {
      await this.initPeerHost(code);
    } catch (err) {
      console.warn('P2P Host init exception:', err);
    }

    this.emit('ROOM_CREATED', { room: initialRoom, isSpectator: false });
    return initialRoom;
  }

  // Join an existing room (Dual-Stack Centralized Server + WebSocket + WebRTC)
  public async joinRoom(
    roomCode: string,
    player: Omit<RoomPlayer, 'color'>,
    asSpectator: boolean = false
  ): Promise<boolean> {
    const formattedCode = roomCode.trim().toUpperCase();
    this.localRoomCode = formattedCode;
    this.isHost = false;
    this.myPlayerId = player.id;

    // 1. Try Central Server DB via REST first for instantaneous verification
    try {
      const res = await fetch('/api/rooms/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomCode: formattedCode,
          player,
          isSpectator: asSpectator,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data && data.room) {
          this.currentRoom = data.room;
          this.startRoomPoller(formattedCode);
          this.emit(
            data.room.status === 'playing' ? 'GAME_STARTED' : 'ROOM_UPDATED',
            { room: data.room, isSpectator: data.isSpectator }
          );
        }
      }
    } catch (err) {
      console.warn('REST join warning:', err);
    }

    // 2. Connect & register over WebSocket
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(
        JSON.stringify({
          type: 'JOIN_ROOM',
          payload: {
            roomCode: formattedCode,
            asSpectator,
            isSpectator: asSpectator,
            player,
          },
        })
      );
    } else {
      this.initWebSocket();
    }

    this.startRoomPoller(formattedCode);

    // 3. Connect via WebRTC P2P (PeerJS) as secondary channel
    try {
      const clientPeer = new Peer({
        config: {
          iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' },
            { urls: 'stun:stun2.l.google.com:19302' },
          ],
        },
      });

      this.peer = clientPeer;

      clientPeer.on('open', () => {
        const hostPeerId = `ludo-v2-${formattedCode}`;
        const conn = clientPeer.connect(hostPeerId, { reliable: true });

        conn.on('open', () => {
          this.hostConnection = conn;
          conn.send({
            type: 'JOIN_ROOM',
            payload: {
              roomCode: formattedCode,
              player,
              isSpectator: asSpectator,
            },
          });
        });

        conn.on('data', (data: any) => {
          if (data?.type) {
            if (data.room) {
              this.currentRoom = data.room;
            }
            this.emit(data.type as NetworkEventType, data);
          }
        });
      });
    } catch (e) {}

    return true;
  }

  // Start game (Host only)
  public startGame(roomCode: string) {
    if (!this.currentRoom) return;

    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(
        JSON.stringify({
          type: 'START_GAME',
          payload: { roomCode },
        })
      );
    } else {
      this.postAction(roomCode, 'START_GAME', {});
    }

    if (this.isHost) {
      const room = { ...this.currentRoom };
      const maxPlayers = room.mode === '2p' ? 2 : room.mode === '3p' ? 3 : 4;
      const colorsNeeded: PlayerColor[] =
        room.mode === '2p'
          ? ['red', 'yellow']
          : room.mode === '3p'
          ? ['red', 'green', 'yellow']
          : ['red', 'green', 'yellow', 'blue'];

      const botNames = ['الروبوت الذكي 🤖', 'Falcon_AI 🦅', 'الأسطورة 🌟', 'Tiger_Bot 🐯'];
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

      room.status = 'playing';
      room.turnIndex = 0;
      room.currentTurnColor = room.players[0].color;
      room.hasRolled = false;
      room.diceValue = null;
      room.lastActionTime = Date.now();

      this.currentRoom = room;
      this.broadcastP2P({ type: 'GAME_STARTED', room });
    }
  }

  // Broadcast roll dice event across peers
  public rollDice(roomCode: string, color: PlayerColor, roll: number, consecutiveSixes: number = 0) {
    const payload = { roomCode, color, roll, consecutiveSixes };

    if (this.currentRoom) {
      this.currentRoom.diceValue = roll;
      this.currentRoom.hasRolled = true;
      this.currentRoom.currentTurnColor = color;
      this.currentRoom.consecutiveSixes = consecutiveSixes;
      this.currentRoom.lastActionTime = Date.now();
    }

    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(
        JSON.stringify({
          type: 'ROLL_DICE',
          payload,
        })
      );
    } else {
      this.postAction(roomCode, 'ROLL_DICE', payload);
    }

    if (this.isHost) {
      this.broadcastP2P({
        type: 'DICE_ROLLED',
        color,
        roll,
        consecutiveSixes,
        room: this.currentRoom,
      });
    } else if (this.hostConnection && this.hostConnection.open) {
      this.hostConnection.send({
        type: 'ROLL_DICE',
        payload,
      });
    }
  }

  // Broadcast pawn move event across peers
  public movePawn(
    roomCode: string,
    params: {
      color: PlayerColor;
      pawnIndex: number;
      roll: number;
      newPawns: Record<string, number[]>;
      nextTurnColor: PlayerColor;
      gotExtraTurn: boolean;
      didCapture: boolean;
      didReachHome: boolean;
      isWinner?: boolean;
      winnerId?: string;
    }
  ) {
    const payload = { roomCode, ...params };

    if (this.currentRoom) {
      this.currentRoom.pawns = params.newPawns;
      this.currentRoom.currentTurnColor = params.nextTurnColor;
      this.currentRoom.hasRolled = false;
      this.currentRoom.diceValue = null;
      if (params.isWinner && params.winnerId && !this.currentRoom.winners.includes(params.winnerId)) {
        this.currentRoom.winners.push(params.winnerId);
      }
      this.currentRoom.lastActionTime = Date.now();
    }

    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(
        JSON.stringify({
          type: 'MOVE_PAWN',
          payload,
        })
      );
    } else {
      this.postAction(roomCode, 'MOVE_PAWN', payload);
    }

    if (this.isHost) {
      this.broadcastP2P({
        type: 'PAWN_MOVED',
        ...params,
        room: this.currentRoom,
      });
    } else if (this.hostConnection && this.hostConnection.open) {
      this.hostConnection.send({
        type: 'MOVE_PAWN',
        payload,
      });
    }
  }

  // Broadcast pass turn event across peers
  public passTurn(roomCode: string, nextTurnColor: PlayerColor, reason?: string) {
    const payload = { roomCode, nextTurnColor, reason };

    if (this.currentRoom) {
      this.currentRoom.currentTurnColor = nextTurnColor;
      this.currentRoom.hasRolled = false;
      this.currentRoom.diceValue = null;
      this.currentRoom.lastActionTime = Date.now();
    }

    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(
        JSON.stringify({
          type: 'PASS_TURN',
          payload,
        })
      );
    } else {
      this.postAction(roomCode, 'PASS_TURN', payload);
    }

    if (this.isHost) {
      this.broadcastP2P({
        type: 'TURN_PASSED',
        nextTurnColor,
        reason,
        room: this.currentRoom,
      });
    } else if (this.hostConnection && this.hostConnection.open) {
      this.hostConnection.send({
        type: 'PASS_TURN',
        payload,
      });
    }
  }

  // Synchronize state across peers
  public syncState(roomCode: string, roomState: GameRoom) {
    this.currentRoom = roomState;

    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(
        JSON.stringify({
          type: 'SYNC_STATE',
          payload: { roomCode, roomState },
        })
      );
    }

    if (this.isHost) {
      this.broadcastP2P({ type: 'STATE_SYNCED', room: roomState });
    } else if (this.hostConnection && this.hostConnection.open) {
      this.hostConnection.send({
        type: 'SYNC_STATE',
        payload: { roomCode, roomState },
      });
    }
  }

  // Send Chat Message
  public sendChat(roomCode: string, message: ChatMessage) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(
        JSON.stringify({
          type: 'CHAT_MESSAGE',
          payload: { roomCode, message },
        })
      );
    } else {
      this.postAction(roomCode, 'CHAT_MESSAGE', { message });
    }

    if (this.isHost) {
      this.broadcastP2P({ type: 'NEW_CHAT', message });
    } else if (this.hostConnection && this.hostConnection.open) {
      this.hostConnection.send({
        type: 'CHAT_MESSAGE',
        payload: { roomCode, message },
      });
    }
  }

  // Throw Emoji
  public throwEmoji(
    roomCode: string,
    emoji: string,
    fromPlayerColor: PlayerColor,
    toPlayerColor: PlayerColor
  ) {
    const payload = {
      roomCode,
      emoji,
      fromPlayerColor,
      toPlayerColor,
    };

    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(
        JSON.stringify({
          type: 'EMOJI_INTERACTION',
          payload,
        })
      );
    } else {
      this.postAction(roomCode, 'EMOJI_INTERACTION', payload);
    }

    if (this.isHost) {
      this.broadcastP2P({
        type: 'EMOJI_THROWN',
        ...payload,
      });
    } else if (this.hostConnection && this.hostConnection.open) {
      this.hostConnection.send({
        type: 'EMOJI_INTERACTION',
        payload,
      });
    }
  }

  // Add bot to room (Host only)
  public addBot(color?: PlayerColor) {
    if (!this.currentRoom || !this.isHost) return;
    const room = { ...this.currentRoom };
    const maxPlayers = room.mode === '2p' ? 2 : 4;
    if (room.players.length >= maxPlayers) return;

    const availableColors: PlayerColor[] =
      room.mode === '2p' ? ['red', 'yellow'] : ['red', 'green', 'yellow', 'blue'];
    const usedColors = room.players.map((p) => p.color);
    const assignedColor = color || availableColors.find((c) => !usedColors.includes(c)) || 'blue';

    const botNames = ['الروبوت الذكي 🤖', 'Falcon_AI 🦅', 'الأسطورة 🌟', 'Tiger_Bot 🐯'];
    room.players.push({
      id: `bot-${assignedColor}-${Date.now()}`,
      name: botNames[room.players.length % botNames.length],
      avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${assignedColor}`,
      color: assignedColor,
      isBot: true,
      isReady: true,
    });

    this.currentRoom = room;
    this.broadcastP2P({ type: 'ROOM_UPDATED', room });
  }

  // Kick player (Host only)
  public kickPlayer(playerId: string) {
    if (!this.currentRoom || !this.isHost) return;
    const room = { ...this.currentRoom };
    room.players = room.players.filter((p) => p.id !== playerId);
    if (room.spectators) {
      room.spectators = room.spectators.filter((s) => s.id !== playerId);
    }

    this.currentRoom = room;
    this.broadcastP2P({ type: 'ROOM_UPDATED', room });
  }

  // Toggle ready status
  public toggleReady(playerId: string) {
    if (!this.currentRoom) return;
    const room = { ...this.currentRoom };
    const player = room.players.find((p) => p.id === playerId);
    if (player) {
      player.isReady = !player.isReady;
      this.currentRoom = room;
      if (this.isHost) {
        this.broadcastP2P({ type: 'ROOM_UPDATED', room });
      } else if (this.hostConnection?.open) {
        this.hostConnection.send({
          type: 'SYNC_STATE',
          payload: { roomCode: room.code, roomState: room },
        });
      }
    }
  }

  // Leave room cleanly
  public leaveRoom(roomCode: string, playerId: string, isSpectator: boolean = false) {
    this.stopRoomPoller();
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(
        JSON.stringify({
          type: 'LEAVE_ROOM',
          payload: { roomCode, playerId, isSpectator },
        })
      );
    }

    if (this.hostConnection?.open) {
      this.hostConnection.send({
        type: 'LEAVE_ROOM',
        payload: { roomCode, playerId, isSpectator },
      });
      this.hostConnection.close();
      this.hostConnection = null;
    }

    if (this.isHost) {
      this.connections.forEach((conn) => conn.close());
      this.connections.clear();
      if (this.peer && !this.peer.destroyed) {
        this.peer.destroy();
      }
    }

    this.currentRoom = null;
    this.localRoomCode = '';
    this.isHost = false;
  }
}

export const networkManager = new HybridNetworkManager();
