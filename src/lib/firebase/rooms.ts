import { db } from "./config";
import {
  doc,
  setDoc,
  updateDoc,
  arrayUnion,
  getDoc,
} from "firebase/firestore";

export type GameType = "Connect4" | "UltimateTicTacToe" | "GuessWho" | "Chess" | "Checkers" | "Othello" | "Battleship" | "Minesweeper" | "Go" | "Backgammon" | "Ludo" | "SnakesAndLadders" | "Mancala" | "DotsAndBoxes" | "Monopoly";

export interface Connect4GameState {
  board: number[]; // 42 elements (6 rows * 7 cols) (0: empty, 1: P1, 2: P2)
  currentTurn: string; // userId
  winner: string | 'draw' | null;
  winningCells: { row: number; col: number }[];
}

export interface UltimateTicTacToeGameState {
  board: number[]; // 81 elements (9 local boards of 9 cells). 0: empty, 1: P1, 2: P2
  globalBoard: number[]; // 9 elements. 0: in progress, 1: P1 won, 2: P2 won, 3: draw
  activeLocalBoardIndex: number | null; // 0-8, or null for "free turn"
  currentTurn: string; // userId
  winner: string | 'draw' | null;
  winningCells: { globalIndices: number[]; localIndices: number[] };
}

export interface MancalaGameState {
  board: number[]; // 14 elements. 0-5: P1, 6: P1 Store. 7-12: P2, 13: P2 Store
  currentTurn: string; // userId
  winner: string | 'draw' | null;
  lastMovePitIndex: number | null;
}

export interface GuessWhoCharacter {
  id: string;
  name: string;
  seed: string;
}

export interface GuessWhoGameState {
  mysteryCharacters: Record<string, string>; // Maps userId -> their assigned character ID
  currentTurn: string; // userId whose turn it is to ask/pass
  winner: string | null;
  boardCharacters: GuessWhoCharacter[];
}

export interface BattleshipShot {
  id: string;
  x: number;
  y: number;
  status: "pending" | "hit" | "miss";
  type?: "normal" | "uv";
  hitCount?: number;
}

export interface BattleshipGameState {
  status: "placement" | "playing" | "finished";
  readyPlayers: string[]; // Player IDs who locked in their fleet
  currentTurn: string | null;
  winner: string | null;
  // Key = Player ID being shot AT. Value = Array of shots directed at them.
  shotsTargetingPlayer: Record<string, BattleshipShot[]>;
  // Key = Player ID. Value = Array of their ship IDs that have been sunk.
  sunkShips?: Record<string, string[]>;
  // Key = Player ID. Value = Array of collected powerup string IDs.
  inventories?: Record<string, string[]>;
  // Key = Player ID of the jammed player whose shots are randomized.
  jammerTarget?: string | null;
}

export interface MonopolyPlayer {
  id: string;
  cash: number;
  position: number;
  inJail: boolean;
  jailTurns: number;
  isBankrupt: boolean;
}

export interface MonopolyPropertyState {
  ownerId: string | null;
  houses: number; // 0-5 (5 = hotel)
  isMortgaged: boolean;
}

export interface MonopolyTrade {
  offererId: string;
  receiverId: string;
  offeredCash: number;
  offeredProperties: number[]; // Array of property IDs
  requestedCash: number;
  requestedProperties: number[]; // Array of property IDs
  status: "pending" | "accepted" | "declined";
}

export interface MonopolyAuction {
  propertyId: number;
  highestBidder: string | null;
  currentBid: number;
  timerEnd: number; // timestamp
}

export interface MonopolyGameState {
  status: "playing" | "finished";
  currentTurn: string;
  turnPhase: "ROLL" | "ACTION" | "MANAGEMENT" | "AUCTION";
  players: Record<string, MonopolyPlayer>;
  properties: Record<number, MonopolyPropertyState>; // 0 to 39
  dice: [number, number];
  isRolling?: boolean;
  doublesCount: number;
  activeTrade: MonopolyTrade | null;
  activeAuction: MonopolyAuction | null;
  winner: string | null;
}

export interface RoomSettings {
  allowSpectators: boolean;
  firstTurn: "host" | "random" | "opponent";
  deckEdition?: "standard" | "youtuber";
  battleshipMode?: "classic" | "powerups";
}

export interface Room {
  roomId: string;
  hostId: string;
  gameType: GameType;
  status: "waiting" | "in-progress" | "finished";
  players: string[];
  playerNames: Record<string, string>;
  playerAvatars?: Record<string, string>;
  spectators: string[];
  maxPlayers: number;
  createdAt: number;
  settings?: RoomSettings;
  gameState?: Connect4GameState | UltimateTicTacToeGameState | MancalaGameState | GuessWhoGameState | BattleshipGameState | MonopolyGameState;
}

export const GAME_LIMITS: Record<GameType, number> = {
  Connect4: 2,
  UltimateTicTacToe: 2,
  GuessWho: 2,
  Battleship: 2,
  Chess: 2,
  Checkers: 2,
  Othello: 2,
  Minesweeper: 1,
  Go: 2,
  Backgammon: 2,
  Ludo: 4,
  SnakesAndLadders: 4,
  Mancala: 2,
  DotsAndBoxes: 2,
  Monopoly: 4,
};

export const createRoom = async (hostId: string, hostName: string, gameType: GameType): Promise<string> => {
  const roomId = Math.random().toString(36).substring(2, 8).toUpperCase();
  const roomRef = doc(db, "rooms", roomId);

  const newRoom: Room = {
    roomId,
    hostId,
    gameType,
    status: "waiting",
    players: [hostId],
    playerNames: { [hostId]: hostName },
    spectators: [],
    maxPlayers: GAME_LIMITS[gameType],
    createdAt: Date.now(),
    settings: {
      allowSpectators: true,
      firstTurn: "random",
      deckEdition: "standard"
    }
  };

  await setDoc(roomRef, newRoom);
  return roomId;
};

export const joinRoom = async (roomId: string, userId: string, userName: string, avatarUrl?: string | null): Promise<boolean> => {
  const roomRef = doc(db, "rooms", roomId);
  const roomSnap = await getDoc(roomRef);

  if (!roomSnap.exists()) {
    throw new Error("Room not found");
  }

  const roomData = roomSnap.data() as Room;

  if (roomData.players.includes(userId) || roomData.spectators.includes(userId)) {
    // If they already joined, let's update their name/avatar just in case it changed
    await updateDoc(roomRef, {
      [`playerNames.${userId}`]: userName,
      ...(avatarUrl && { [`playerAvatars.${userId}`]: avatarUrl })
    });
    return true; // Already in room
  }

  if (roomData.players.length < roomData.maxPlayers && roomData.status === "waiting") {
    // Join as player
    await updateDoc(roomRef, {
      players: arrayUnion(userId),
      [`playerNames.${userId}`]: userName,
      ...(avatarUrl && { [`playerAvatars.${userId}`]: avatarUrl })
    });
  } else {
    // Join as spectator
    await updateDoc(roomRef, {
      spectators: arrayUnion(userId),
      [`playerNames.${userId}`]: userName,
      ...(avatarUrl && { [`playerAvatars.${userId}`]: avatarUrl })
    });
  }

  return true;
};

export const updateGameState = async (roomId: string, gameState: Connect4GameState | UltimateTicTacToeGameState | MancalaGameState | GuessWhoGameState | BattleshipGameState | MonopolyGameState) => {
  const roomRef = doc(db, "rooms", roomId);
  await updateDoc(roomRef, {
    gameState
  });
};

export const updateRoomStatus = async (roomId: string, status: "waiting" | "in-progress" | "finished") => {
  const roomRef = doc(db, "rooms", roomId);
  await updateDoc(roomRef, { status });
};

export const updateRoomSettings = async (roomId: string, settings: RoomSettings, maxPlayers: number) => {
  const roomRef = doc(db, "rooms", roomId);
  await updateDoc(roomRef, { settings, maxPlayers });
};

export const updatePlayerAvatar = async (roomId: string, userId: string, colorHex: string) => {
  const roomRef = doc(db, "rooms", roomId);
  await updateDoc(roomRef, {
    [`playerAvatars.${userId}`]: colorHex
  });
};
