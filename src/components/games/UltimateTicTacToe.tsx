"use client";

import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Room, UltimateTicTacToeGameState, updateGameState } from "@/lib/firebase/rooms";

interface UltimateTicTacToeProps {
  roomId: string;
  currentUserId: string;
  roomData: Room;
}

export function UltimateTicTacToe({ roomId, currentUserId, roomData }: UltimateTicTacToeProps) {
  // Initialize game state if not present. Only player 1 does this.
  useEffect(() => {
    if (!roomData.gameState && roomData.players[0] === currentUserId) {
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
        board: Array(81).fill(0),
        globalBoard: Array(9).fill(0),
        activeLocalBoardIndex: null, // Start with free turn anywhere
        currentTurn: initialTurn,
        winner: null,
        winningCells: { globalIndices: [], localIndices: [] }
      });
    }
  }, [roomData.gameState, roomId, currentUserId, roomData.players, roomData.settings, roomData.hostId]);

  const gameState = roomData.gameState as UltimateTicTacToeGameState;
  if (!gameState || !gameState.globalBoard) {
    return <div className="text-center p-8 text-zinc-400 animate-pulse">Constructing Ultimate Board...</div>;
  }

  const isPlayer1 = roomData.players[0] === currentUserId;
  const isPlayer2 = roomData.players[1] === currentUserId;
  const isSpectator = !isPlayer1 && !isPlayer2;
  const isMyTurn = gameState.currentTurn === currentUserId;
  const playerNumber = isPlayer1 ? 1 : 2;

  // Helper to check standard 3x3 win conditions
  const check3x3Win = (board: number[]): { winner: number | 'draw' | null, line: number[] } => {
    const lines = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
      [0, 3, 6], [1, 4, 7], [2, 5, 8], // Cols
      [0, 4, 8], [2, 4, 6]             // Diagonals
    ];
    for (const line of lines) {
      const [a, b, c] = line;
      if (board[a] && board[a] !== 3 && board[a] === board[b] && board[a] === board[c]) {
        return { winner: board[a], line };
      }
    }
    // Check draw (3 means drawn local board if this is the global check, but drawn local boards shouldn't count as empty)
    if (board.every(cell => cell !== 0)) return { winner: 'draw', line: [] };
    return { winner: null, line: [] };
  };

  const handleCellClick = async (globalIndex: number, localIndex: number) => {
    if (isSpectator || !isMyTurn || gameState.winner) return;

    // Constraint 1: Must play in active local board (unless free turn)
    if (gameState.activeLocalBoardIndex !== null && gameState.activeLocalBoardIndex !== globalIndex) return;
    
    // Constraint 2: Cannot play in a local board that is already won/drawn
    if (gameState.globalBoard[globalIndex] !== 0) return; 

    // Constraint 3: Cannot play in an already taken cell
    if (gameState.board[globalIndex * 9 + localIndex] !== 0) return;

    // Execute Move
    const newBoard = [...gameState.board];
    newBoard[globalIndex * 9 + localIndex] = playerNumber;

    const newGlobalBoard = [...gameState.globalBoard];
    let newWinner = gameState.winner;
    const newWinningCells = { ...gameState.winningCells };
    
    // Check if this move won the local board
    const localBoardSlice = newBoard.slice(globalIndex * 9, globalIndex * 9 + 9);
    const { winner: localWinner } = check3x3Win(localBoardSlice);
    
    if (localWinner) {
      // 3 means draw
      newGlobalBoard[globalIndex] = localWinner === 'draw' ? 3 : localWinner;
      
      // Check if global board is now won
      const { winner: globalWinner, line: globalLine } = check3x3Win(newGlobalBoard);
      
      if (globalWinner && globalWinner !== 'draw') {
        newWinner = globalWinner === 1 ? roomData.players[0] : roomData.players[1];
        newWinningCells.globalIndices = globalLine;
      } else if (globalWinner === 'draw') {
        newWinner = 'draw';
      }
    }

    // Determine the next forced board (Constraint Logic)
    let nextActiveBoard: number | null = localIndex;
    // Free Turn Rule: If the board we are sending them to is already won/drawn, they get a free turn
    if (newGlobalBoard[localIndex] !== 0) {
      nextActiveBoard = null;
    }

    // Toggle Turn
    let nextTurn = gameState.currentTurn;
    if (!newWinner) {
      nextTurn = roomData.players.find(p => p !== currentUserId) || currentUserId;
    }

    // Save state to Firebase
    await updateGameState(roomId, {
      board: newBoard,
      globalBoard: newGlobalBoard,
      activeLocalBoardIndex: nextActiveBoard,
      currentTurn: nextTurn,
      winner: newWinner,
      winningCells: newWinningCells
    });
  };

  const renderCell = (globalIndex: number, localIndex: number) => {
    const value = gameState.board[globalIndex * 9 + localIndex];
    const isClickable = value === 0 && isMyTurn && !gameState.winner && 
                        (gameState.activeLocalBoardIndex === null || gameState.activeLocalBoardIndex === globalIndex) && 
                        gameState.globalBoard[globalIndex] === 0;

    const getCellBorders = (index: number) => {
      let borders = "";
      if (index >= 3) borders += " border-t-2 border-fiery-terracotta/20";
      if (index % 3 !== 0) borders += " border-l-2 border-fiery-terracotta/20";
      return borders;
    };

    return (
      <button
        key={`cell-${globalIndex}-${localIndex}`}
        onClick={() => handleCellClick(globalIndex, localIndex)}
        disabled={!isClickable}
        className={`w-full h-full flex items-center justify-center text-3xl md:text-5xl font-black transition-all duration-200 ${getCellBorders(localIndex)}
          ${isClickable ? 'hover:bg-fiery-terracotta/10 cursor-pointer active:scale-95' : 'cursor-default'}
          ${value === 1 ? 'text-espresso' : value === 2 ? 'text-stormy-teal' : ''}
        `}
      >
        {value === 1 && <motion.span initial={{ scale: 0, rotate: -45 }} animate={{ scale: 1, rotate: 0 }}>X</motion.span>}
        {value === 2 && <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }}>O</motion.span>}
        {/* Subtle dot to hint at where you can play */}
        {isClickable && <span className="absolute w-2 h-2 rounded-full bg-black/10 opacity-0 group-hover:opacity-100" />}
      </button>
    );
  };

  const renderLocalBoard = (globalIndex: number) => {
    const isActive = gameState.activeLocalBoardIndex === globalIndex || gameState.activeLocalBoardIndex === null;
    const isCompleted = gameState.globalBoard[globalIndex] !== 0;
    const winnerValue = gameState.globalBoard[globalIndex];

    return (
      <div 
        key={`board-${globalIndex}`}
        className={`relative aspect-square grid grid-cols-3 grid-rows-3 rounded-2xl transition-all duration-300 overflow-hidden
          ${!isActive && !gameState.winner && !isCompleted ? 'opacity-30 grayscale blur-[1px]' : 'opacity-100'}
          ${isActive && !gameState.winner && !isCompleted ? 'ring-4 ring-fiery-terracotta shadow-[0_0_30px_rgba(177,74,54,0.4)] bg-fiery-terracotta/10' : 'bg-dark-cyan/40 border border-fiery-terracotta/30'}
          ${isCompleted ? 'border-none' : ''}
        `}
      >
        {Array.from({ length: 9 }).map((_, localIndex) => renderCell(globalIndex, localIndex))}

        {/* Won Board Overlay */}
        <AnimatePresence>
          {isCompleted && (
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className={`absolute inset-0 z-10 flex items-center justify-center rounded-2xl backdrop-blur-md shadow-2xl
                ${winnerValue === 1 ? 'bg-espresso/10 border-2 border-espresso/50' : winnerValue === 2 ? 'bg-stormy-teal/10 border-2 border-stormy-teal/50' : 'bg-fiery-terracotta/10 border-2 border-fiery-terracotta/50'}
              `}
            >
              {winnerValue === 1 && <span className="text-[120px] md:text-[180px] font-black text-espresso drop-shadow-[0_0_30px_rgba(33,1,0,0.6)] leading-none">X</span>}
              {winnerValue === 2 && <span className="text-[120px] md:text-[180px] font-black text-stormy-teal drop-shadow-[0_0_30px_rgba(140,9,2,0.6)] leading-none">O</span>}
              {winnerValue === 3 && <span className="text-8xl md:text-[120px] font-black text-fiery-terracotta leading-none">-</span>}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  const isWaitingForOpponent = roomData.players.length < 2;

  return (
    <div className="flex flex-col items-center justify-center w-full p-4 md:p-8 relative">
      {/* Turn Indicator */}
      <div className="mb-8 text-center min-h-[5rem] flex flex-col justify-center relative z-10">
        {isWaitingForOpponent ? (
          <h2 className="text-2xl font-bold text-fiery-terracotta animate-pulse bg-dark-cyan/20 px-6 py-2 rounded-full border border-fiery-terracotta/30 shadow-md">Waiting for opponent to join...</h2>
        ) : gameState.winner ? (
          <motion.h2 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-4xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-br from-espresso to-stormy-teal tracking-tighter drop-shadow-sm"
          >
            {gameState.winner === 'draw' 
              ? "Stalemate!" 
              : `${gameState.winner === roomData.players[0] ? (roomData.playerNames?.[roomData.players[0]] || "Player 1") : (roomData.playerNames?.[roomData.players[1]] || "Player 2")} Dominates!`}
          </motion.h2>
        ) : (
          <div className="flex items-center justify-center gap-6 bg-dark-cyan/20 px-8 py-4 rounded-3xl border border-fiery-terracotta/30 backdrop-blur-md shadow-xl shadow-fiery-terracotta/10">
            <h2 className="text-2xl md:text-3xl font-bold text-espresso flex items-center gap-2">
              <span className={isMyTurn ? 'text-stormy-teal' : 'text-fiery-terracotta'}>
                {gameState.currentTurn === roomData.players[0] 
                  ? (roomData.playerNames?.[roomData.players[0]] || "Player 1") 
                  : (roomData.playerNames?.[roomData.players[1]] || "Player 2")}
              </span>
              <span className="text-fiery-terracotta/80 font-normal">'s Turn</span>
            </h2>
            <div className={`text-4xl md:text-5xl font-black ${gameState.currentTurn === roomData.players[0] ? 'text-espresso drop-shadow-[0_0_20px_rgba(33,1,0,0.6)]' : 'text-stormy-teal drop-shadow-[0_0_20px_rgba(140,9,2,0.6)]'}`}>
              {gameState.currentTurn === roomData.players[0] ? 'X' : 'O'}
            </div>
            {gameState.activeLocalBoardIndex === null && (
              <motion.span 
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="ml-2 px-4 py-1.5 bg-gradient-to-r from-dark-cyan to-fiery-terracotta text-espresso rounded-full text-sm md:text-base font-black shadow-[0_0_20px_rgba(230,163,65,0.5)] uppercase tracking-widest"
              >
                Free Turn
              </motion.span>
            )}
          </div>
        )}
      </div>

      {/* Global Board */}
      <div className="relative w-full max-w-[800px]">
        {/* The Grid */}
        <div className="grid grid-cols-3 grid-rows-3 gap-3 md:gap-5 p-3 md:p-5 bg-wheat rounded-[2.5rem] border-4 border-fiery-terracotta/30 shadow-xl shadow-fiery-terracotta/10 relative z-10 aspect-square">
          {Array.from({ length: 9 }).map((_, globalIndex) => renderLocalBoard(globalIndex))}
        </div>

        {/* Global Win Overlay */}
        <AnimatePresence>
          {gameState.winner && gameState.winner !== 'draw' && (
             <motion.div 
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               className="absolute inset-0 z-50 pointer-events-none flex flex-col items-center justify-center bg-wheat/80 backdrop-blur-md rounded-[2.5rem]"
             >
               <motion.span 
                 initial={{ scale: 0, rotate: -10 }}
                 animate={{ scale: 1, rotate: 0 }}
                 transition={{ type: "spring", stiffness: 200, damping: 15 }}
                 className={`text-[150px] md:text-[250px] font-black leading-none ${gameState.winner === roomData.players[0] ? 'text-espresso drop-shadow-md' : 'text-stormy-teal drop-shadow-md'}`}
               >
                 {gameState.winner === roomData.players[0] ? 'X' : 'O'}
               </motion.span>
               <motion.span 
                 initial={{ y: 20, opacity: 0 }}
                 animate={{ y: 0, opacity: 1 }}
                 transition={{ delay: 0.2 }}
                 className="text-4xl font-bold text-espresso uppercase tracking-[0.5em] mt-4 ml-[0.5em]"
               >
                 Winner
               </motion.span>
             </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
