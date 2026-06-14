"use client";

import { useEffect } from "react";
import { motion } from "framer-motion";
import { Room, Connect4GameState, updateGameState } from "@/lib/firebase/rooms";

interface Connect4Props {
  roomId: string;
  currentUserId: string;
  roomData: Room;
}

const ROWS = 6;
const COLS = 7;
const CELL_SIZE = 64;
const BOARD_WIDTH = COLS * CELL_SIZE; // 448
const BOARD_HEIGHT = ROWS * CELL_SIZE; // 384

export function Connect4({ roomId, currentUserId, roomData }: Connect4Props) {
  // Initialize game state if not present. Only player 1 does this to prevent race conditions.
  useEffect(() => {
    if (!roomData.gameState && roomData.players[0] === currentUserId) {
      const initialBoard = Array(ROWS * COLS).fill(0);
      
      let initialTurn = roomData.players[0];
      const firstTurnSetting = roomData.settings?.firstTurn || "random";
      if (firstTurnSetting === "random") {
        initialTurn = Math.random() > 0.5 ? roomData.players[0] : roomData.players[1];
      } else if (firstTurnSetting === "host") {
        initialTurn = roomData.hostId;
      } else {
        initialTurn = roomData.players.find(p => p !== roomData.hostId) || roomData.players[0];
      }

      updateGameState(roomId, {
        board: initialBoard,
        currentTurn: initialTurn,
        winner: null,
        winningCells: []
      });
    }
  }, [roomData.gameState, roomId, currentUserId, roomData.players, roomData.settings, roomData.hostId]);

  const gameState = roomData.gameState as Connect4GameState;
  if (!gameState) return <div className="text-center p-8 text-zinc-400 animate-pulse">Constructing Board...</div>;

  const isPlayer1 = roomData.players[0] === currentUserId;
  const isPlayer2 = roomData.players[1] === currentUserId;
  const isSpectator = !isPlayer1 && !isPlayer2;
  const isMyTurn = gameState.currentTurn === currentUserId;
  const playerNumber = isPlayer1 ? 1 : 2;

  const checkWin = (board: number[], row: number, col: number, player: number) => {
    const directions = [
      [[0, 1], [0, -1]], // Horizontal
      [[1, 0], [-1, 0]], // Vertical
      [[1, 1], [-1, -1]], // Diagonal /
      [[1, -1], [-1, 1]] // Diagonal \
    ];

    for (let dir of directions) {
      let count = 1;
      let winningCells = [{ row, col }];

      for (let [dRow, dCol] of dir) {
        let r = row + dRow;
        let c = col + dCol;
        while (r >= 0 && r < ROWS && c >= 0 && c < COLS && board[r * COLS + c] === player) {
          count++;
          winningCells.push({ row: r, col: c });
          r += dRow;
          c += dCol;
        }
      }

      if (count >= 4) {
        return winningCells;
      }
    }
    return null;
  };

  const handleColumnClick = async (col: number) => {
    if (isSpectator || !isMyTurn || gameState.winner) return;

    // Find lowest empty row in the selected column
    let targetRow = -1;
    for (let r = ROWS - 1; r >= 0; r--) {
      if (gameState.board[r * COLS + col] === 0) {
        targetRow = r;
        break;
      }
    }

    if (targetRow === -1) return; // Column is full

    const newBoard = [...gameState.board];
    newBoard[targetRow * COLS + col] = playerNumber;

    const winningCells = checkWin(newBoard, targetRow, col, playerNumber);
    let newWinner: string | 'draw' | null = null;
    let nextTurn = gameState.currentTurn;

    if (winningCells) {
      newWinner = currentUserId;
    } else {
      // Check for a draw (if top row is completely full)
      const isDraw = newBoard.slice(0, COLS).every(cell => cell !== 0);
      if (isDraw) newWinner = 'draw';
      else {
        // Toggle turn
        nextTurn = roomData.players.find(p => p !== currentUserId) || currentUserId;
      }
    }

    await updateGameState(roomId, {
      board: newBoard,
      currentTurn: nextTurn,
      winner: newWinner,
      winningCells: winningCells || []
    });
  };

  // Determine opponent name/status
  const opponentId = roomData.players.find(p => p !== currentUserId);
  const isWaitingForOpponent = roomData.players.length < 2;

  return (
    <div className="flex flex-col items-center justify-center p-8 bg-dark-cyan/20 rounded-3xl border border-fiery-terracotta/30 backdrop-blur-md shadow-xl shadow-fiery-terracotta/10">
      {/* Turn & Status Indicator */}
      <div className="mb-8 text-center h-16 flex flex-col justify-center">
        {isWaitingForOpponent ? (
          <h2 className="text-2xl font-bold text-fiery-terracotta animate-pulse">Waiting for opponent to join...</h2>
        ) : gameState.winner ? (
          <h2 className="text-3xl font-black text-espresso tracking-tight drop-shadow-sm">
            {gameState.winner === 'draw' 
              ? "It's a Draw!" 
              : `${gameState.winner === roomData.players[0] ? (roomData.playerNames?.[roomData.players[0]] || "Player 1") : (roomData.playerNames?.[roomData.players[1]] || "Player 2")} Wins!`}
          </h2>
        ) : (
          <div className="flex items-center justify-center gap-4">
            <h2 className="text-2xl font-bold text-espresso flex items-center gap-2">
              <span className={`text-xl font-bold ${isMyTurn ? 'text-stormy-teal' : 'text-fiery-terracotta'}`}>
                {gameState.currentTurn === roomData.players[0] 
                  ? (roomData.playerNames?.[roomData.players[0]] || "Player 1") 
                  : (roomData.playerNames?.[roomData.players[1]] || "Player 2")}
              </span>
              <span className="text-fiery-terracotta/80 font-normal">'s Turn</span>
            </h2>
            <div 
              className={`w-6 h-6 rounded-full border-2 border-black/20 shadow-[inset_0_-2px_4px_rgba(0,0,0,0.3)] shadow-[0_0_15px_currentColor]`} 
              style={{
                backgroundColor: gameState.currentTurn === roomData.players[0] ? 'var(--color-fiery-terracotta)' : 'var(--color-dark-cyan)',
                color: gameState.currentTurn === roomData.players[0] ? 'var(--color-fiery-terracotta)' : 'var(--color-dark-cyan)'
              }}
            />
          </div>
        )}
      </div>

      {/* Game Board */}
      <div 
        className="relative shadow-[0_20px_60px_rgba(33,1,0,0.2)] rounded-2xl" 
        style={{ width: BOARD_WIDTH, height: BOARD_HEIGHT }}
      >
        {/* Background / Empty Slots Layer */}
        <div className="absolute inset-0 bg-wheat rounded-2xl border border-fiery-terracotta/30 shadow-inner" />

        {/* Chips Layer (z-0) */}
        <div className="absolute inset-0 z-0 overflow-hidden rounded-2xl">
          {Array.from({ length: ROWS }).map((_, rIndex) => 
            Array.from({ length: COLS }).map((_, cIndex) => {
              const cell = gameState.board[rIndex * COLS + cIndex];
              if (cell === 0) return null;
              const isWinning = gameState.winningCells.some(w => w.row === rIndex && w.col === cIndex);
              return (
                <motion.div
                  key={`${rIndex}-${cIndex}`}
                  initial={{ y: -BOARD_HEIGHT }}
                  animate={{ y: rIndex * CELL_SIZE }}
                  // Arcade physics: fast drop with a heavy thud (higher damping = less bounce)
                  transition={{ type: "spring", stiffness: 200, damping: 22, mass: 1 }}
                  className="absolute"
                  style={{ left: cIndex * CELL_SIZE, width: CELL_SIZE, height: CELL_SIZE, padding: '8px' }}
                >
                  <div 
                    className={`w-full h-full rounded-full border-[3px] border-black/20 shadow-[inset_0_-8px_10px_rgba(0,0,0,0.3)] ${
                      isWinning ? 'ring-4 ring-white shadow-[0_0_30px_rgba(255,255,255,1)] z-20 relative animate-pulse' : ''
                    }`}
                    style={{
                      backgroundColor: cell === 1 ? 'var(--color-fiery-terracotta)' : 'var(--color-dark-cyan)'
                    }}
                  />
                </motion.div>
              )
            })
          )}
        </div>

        {/* SVG Mask Layer (z-10) - The Blue Board */}
        <svg viewBox={`0 0 ${BOARD_WIDTH} ${BOARD_HEIGHT}`} className="absolute inset-0 z-10 pointer-events-none drop-shadow-2xl">
          <defs>
            <mask id="board-mask">
              <rect width="100%" height="100%" fill="white" />
              {Array.from({ length: ROWS }).map((_, r) => 
                Array.from({ length: COLS }).map((_, c) => (
                  <circle key={`hole-${r}-${c}`} cx={c * CELL_SIZE + CELL_SIZE/2} cy={r * CELL_SIZE + CELL_SIZE/2} r={CELL_SIZE/2 - 8} fill="black" />
                ))
              )}
            </mask>
          </defs>
          <rect width="100%" height="100%" fill="#f2542d" mask="url(#board-mask)" rx="16" />
        </svg>

        {/* Interaction Layer (z-20) */}
        <div className="absolute inset-0 z-20 flex rounded-2xl overflow-hidden">
          {Array.from({ length: COLS }).map((_, cIndex) => (
            <div 
              key={`col-${cIndex}`} 
              className={`flex-1 h-full transition-colors ${isMyTurn && !gameState.winner ? 'cursor-pointer hover:bg-black/10' : 'cursor-default'}`}
              onClick={() => handleColumnClick(cIndex)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
