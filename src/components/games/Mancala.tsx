"use client";

import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Room, MancalaGameState, updateGameState } from "@/lib/firebase/rooms";

interface MancalaProps {
  roomId: string;
  currentUserId: string;
  roomData: Room;
}

const DELAY_FLY = 200;
const DELAY_SETTLE = 150;

// Deterministic random for stable pebble styling
const pseudoRandom = (seed: number) => {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
};

const PEBBLE_COLORS = [
  "from-espresso to-stormy-teal",
  "from-stormy-teal to-fiery-terracotta",
  "from-fiery-terracotta to-dark-cyan",
  "from-dark-cyan to-wheat",
  "from-espresso to-fiery-terracotta"
];

const getPebbleStyle = (pitIndex: number, stoneIndex: number) => {
  const seed = pitIndex * 100 + stoneIndex + 1;
  const x = pseudoRandom(seed) * 50 - 25; // -25% to 25%
  const y = pseudoRandom(seed + 1) * 50 - 25;
  const colorIndex = Math.floor(pseudoRandom(seed + 2) * PEBBLE_COLORS.length);
  return { x, y, colorClass: PEBBLE_COLORS[colorIndex] };
};

export function Mancala({ roomId, currentUserId, roomData }: MancalaProps) {
  const [localBoard, setLocalBoard] = useState<number[]>(Array(14).fill(0));
  const [isAnimating, setIsAnimating] = useState(false);
  const [flyingPebble, setFlyingPebble] = useState<{ startX: number, startY: number, targetX: number, targetY: number, key: string } | null>(null);
  const [impactPit, setImpactPit] = useState<number | null>(null);
  const boardRef = useRef<HTMLDivElement>(null);
  const pitRefs = useRef<(HTMLButtonElement | HTMLDivElement | null)[]>([]);

  // Initialize game state if not present
  useEffect(() => {
    if (!roomData.gameState && roomData.players[0] === currentUserId) {
      const initialBoard = [4, 4, 4, 4, 4, 4, 0, 4, 4, 4, 4, 4, 4, 0];
      updateGameState(roomId, {
        board: initialBoard,
        currentTurn: roomData.players[0],
        winner: null,
        lastMovePitIndex: null
      });
    }
  }, [roomData.gameState, roomId, currentUserId, roomData.players]);

  const gameState = roomData.gameState as MancalaGameState;

  const lastProcessedBoard = useRef<string>("");

  // Handle Firebase Sync and Opponent Animations
  useEffect(() => {
    if (!gameState || !gameState.board || isAnimating) return;
    
    const boardStr = JSON.stringify(gameState.board);
    
    // Have we already fully processed this exact Firebase state?
    if (lastProcessedBoard.current === boardStr) {
      // Fallback snap in case localBoard somehow drifted
      const isDifferent = localBoard.some((v, i) => v !== gameState.board[i]);
      if (isDifferent) setLocalBoard(gameState.board);
      return;
    }

    // Prevent animating the initial load
    const isInitialEmpty = localBoard.every(v => v === 0);
    if (isInitialEmpty) {
      setLocalBoard(gameState.board);
      lastProcessedBoard.current = boardStr;
      return;
    }

    // Does our local board already match the incoming state? (e.g. we initiated the move)
    const isAlreadyMatches = localBoard.every((v, i) => v === gameState.board[i]);
    if (isAlreadyMatches) {
      lastProcessedBoard.current = boardStr;
      return;
    }

    // It's a new board state from the opponent! Animate it.
    lastProcessedBoard.current = boardStr;

    if (gameState.lastMovePitIndex !== null) {
      runSowingSequence(gameState.lastMovePitIndex, false).then(() => {
        // Ensure perfect sync after animation finishes
        setLocalBoard(gameState.board);
      });
    } else {
      setLocalBoard(gameState.board);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameState?.board, isAnimating]);

  if (!gameState || !gameState.board) return <div className="text-center p-8 text-fiery-terracotta animate-pulse">Carving Wooden Board...</div>;

  const isPlayer1 = roomData.players[0] === currentUserId;
  const isPlayer2 = roomData.players[1] === currentUserId;
  const isSpectator = !isPlayer1 && !isPlayer2;
  const isMyTurn = gameState.currentTurn === currentUserId;
  const playerNumber = isPlayer1 ? 1 : 2;

  const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

  const runSowingSequence = async (startIndex: number, isInitiator: boolean) => {
    setIsAnimating(true);
    
    let currentBoard = [...localBoard];
    let stones = currentBoard[startIndex];
    
    if (stones === 0) {
      setIsAnimating(false);
      return;
    }

    currentBoard[startIndex] = 0;
    setLocalBoard([...currentBoard]);
    
    let currentIndex = startIndex;
    let currentPlayer = startIndex < 7 ? 1 : 2;
    
    while (stones > 0) {
      let nextIndex = (currentIndex + 1) % 14;
      
      // Skip opponent's store
      if (currentPlayer === 1 && nextIndex === 13) {
        nextIndex = 0;
      } else if (currentPlayer === 2 && nextIndex === 6) {
        nextIndex = 7;
      }

      // Calculate flying coordinates
      if (boardRef.current && pitRefs.current[currentIndex] && pitRefs.current[nextIndex]) {
        const boardR = boardRef.current.getBoundingClientRect();
        const startR = pitRefs.current[currentIndex]!.getBoundingClientRect();
        const targetR = pitRefs.current[nextIndex]!.getBoundingClientRect();
        
        setFlyingPebble({ 
          startX: startR.left - boardR.left + startR.width / 2,
          startY: startR.top - boardR.top + startR.height / 2,
          targetX: targetR.left - boardR.left + targetR.width / 2,
          targetY: targetR.top - boardR.top + targetR.height / 2,
          key: `${currentIndex}-${nextIndex}-${Date.now()}`
        });
      }

      await delay(DELAY_FLY);
      setFlyingPebble(null);

      currentIndex = nextIndex;
      stones--;
      currentBoard[currentIndex]++;
      
      setLocalBoard([...currentBoard]);
      setImpactPit(currentIndex);
      await delay(DELAY_SETTLE);
      setImpactPit(null);
    }

    let finalBoard = [...currentBoard];
    let nextTurn = gameState.currentTurn;

    // Rule 1: Free Turn
    const landedInOwnStore = (currentPlayer === 1 && currentIndex === 6) || (currentPlayer === 2 && currentIndex === 13);
    if (!landedInOwnStore) {
      nextTurn = roomData.players.find(p => p !== currentUserId) || currentUserId;
    }

    // Rule 2: Capture
    const isOwnSide = (currentPlayer === 1 && currentIndex >= 0 && currentIndex <= 5) || 
                      (currentPlayer === 2 && currentIndex >= 7 && currentIndex <= 12);
    const landedInEmpty = finalBoard[currentIndex] === 1; // It was 0 before we just added 1
    const oppositeIndex = 12 - currentIndex;
    
    if (isOwnSide && landedInEmpty && finalBoard[oppositeIndex] > 0) {
      const capturedStones = finalBoard[oppositeIndex] + 1;
      finalBoard[currentIndex] = 0;
      finalBoard[oppositeIndex] = 0;
      
      const storeIndex = currentPlayer === 1 ? 6 : 13;
      finalBoard[storeIndex] += capturedStones;

      // Visual capture delay
      setLocalBoard([...finalBoard]);
      setImpactPit(storeIndex);
      await delay(500);
      setImpactPit(null);
    }

    // End Game Check
    const p1Stones = finalBoard.slice(0, 6).reduce((a, b) => a + b, 0);
    const p2Stones = finalBoard.slice(7, 13).reduce((a, b) => a + b, 0);
    let newWinner = gameState.winner;

    if (p1Stones === 0 || p2Stones === 0) {
      // Move remaining to stores
      finalBoard[6] += p1Stones;
      finalBoard[13] += p2Stones;
      for(let i=0; i<6; i++) finalBoard[i] = 0;
      for(let i=7; i<13; i++) finalBoard[i] = 0;

      if (finalBoard[6] > finalBoard[13]) newWinner = roomData.players[0];
      else if (finalBoard[13] > finalBoard[6]) newWinner = roomData.players[1];
      else newWinner = 'draw';
    }

    // Only the initiator calculates the final math and pushes to Firebase
    if (isInitiator) {
      await updateGameState(roomId, {
        board: finalBoard,
        currentTurn: nextTurn,
        winner: newWinner,
        lastMovePitIndex: startIndex
      });
    }

    setLocalBoard([...finalBoard]); // Ensure local matches final before releasing lock
    setIsAnimating(false);
  };

  const handlePitClick = (index: number) => {
    if (isSpectator || !isMyTurn || isAnimating || gameState.winner) return;
    
    // Check ownership
    if (playerNumber === 1 && (index < 0 || index > 5)) return;
    if (playerNumber === 2 && (index < 7 || index > 12)) return;

    // Check empty
    if (localBoard[index] === 0) return;

    runSowingSequence(index, true);
  };

  const renderStones = (pitIndex: number, count: number) => {
    return Array.from({ length: count }).map((_, i) => {
      const { x, y, colorClass } = getPebbleStyle(pitIndex, i);
      return (
        <motion.div
          key={`stone-${pitIndex}-${i}`}
          initial={{ scale: 0, rotate: -45, x: "-50%", y: "-50%" }}
          animate={{ scale: 1, rotate: 0, x: "-50%", y: "-50%" }}
          className={`absolute w-4 h-4 md:w-5 md:h-5 rounded-full shadow-[0_0_15px_rgba(255,255,255,0.1),inset_0_-2px_6px_rgba(0,0,0,0.5)] overflow-hidden bg-gradient-to-br ${colorClass}`}
          style={{
            left: `calc(50% + ${x}%)`,
            top: `calc(50% + ${y}%)`,
          }}
        >
          {/* Glassy specular highlight */}
          <div className="absolute top-[10%] left-[15%] w-[40%] h-[30%] bg-white/40 rounded-full blur-[0.5px] rotate-[-20deg]" />
        </motion.div>
      );
    });
  };

  const renderPit = (index: number, isStore: boolean = false) => {
    const count = localBoard[index];
    const isClickable = !isStore && !isSpectator && isMyTurn && !isAnimating && !gameState.winner && 
                        ((playerNumber === 1 && index >= 0 && index <= 5) || 
                         (playerNumber === 2 && index >= 7 && index <= 12)) && count > 0;
    
    const isImpacted = impactPit === index;

    return (
      <motion.button
        ref={(el) => { pitRefs.current[index] = el; }}
        key={`pit-${index}`}
        onClick={() => !isStore && handlePitClick(index)}
        disabled={!isClickable}
        animate={isImpacted ? { scale: [1, 1.05, 1] } : {}}
        transition={{ duration: 0.2 }}
        className={`relative rounded-[2.5rem] shadow-[inset_0_10px_20px_rgba(177,74,54,0.15),0_1px_2px_rgba(254,206,121,0.5)] bg-dark-cyan/30 border border-fiery-terracotta/30
          ${isStore ? 'w-24 h-[300px]' : 'w-20 h-20 md:w-24 md:h-24'} 
          ${isClickable ? 'hover:ring-2 ring-fiery-terracotta hover:bg-dark-cyan/50 cursor-pointer' : 'cursor-default'}
        `}
      >
        {renderStones(index, count)}
        {/* Count Badge */}
        <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-stormy-teal font-bold text-sm">
          {count}
        </div>
      </motion.button>
    );
  };

  const isWaitingForOpponent = roomData.players.length < 2;
  const boardRect = boardRef.current?.getBoundingClientRect();

  return (
    <div className="flex flex-col items-center justify-center w-full p-4 md:p-8 relative">
      
      {/* Header */}
      <div className="mb-12 text-center min-h-[5rem] flex flex-col justify-center relative z-10">
        {isWaitingForOpponent ? (
          <h2 className="text-2xl font-bold text-fiery-terracotta animate-pulse bg-dark-cyan/20 px-6 py-2 rounded-full border border-fiery-terracotta/30 shadow-md">Waiting for opponent to join...</h2>
        ) : gameState.winner ? (
          <motion.h2 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-espresso to-stormy-teal tracking-tight drop-shadow-sm"
          >
            {gameState.winner === 'draw' 
              ? "It's a Tie!" 
              : `${gameState.winner === roomData.players[0] ? (roomData.playerNames?.[roomData.players[0]] || "Player 1") : (roomData.playerNames?.[roomData.players[1]] || "Player 2")} Wins!`}
          </motion.h2>
        ) : (
          <div className="flex items-center justify-center gap-6 bg-dark-cyan/20 px-8 py-4 rounded-3xl border border-fiery-terracotta/30 backdrop-blur-md shadow-xl shadow-fiery-terracotta/10">
            <h2 className="text-2xl md:text-3xl font-bold text-espresso flex items-center gap-2">
              <span className={`text-2xl md:text-3xl font-bold ${isMyTurn ? 'text-transparent bg-clip-text bg-gradient-to-r from-stormy-teal to-fiery-terracotta drop-shadow-sm' : 'text-fiery-terracotta/80'}`}>
                {gameState.currentTurn === roomData.players[0] 
                  ? (roomData.playerNames?.[roomData.players[0]] || "Player 1") 
                  : (roomData.playerNames?.[roomData.players[1]] || "Player 2")}
              </span>
              <span className="text-fiery-terracotta font-normal">'s Turn</span>
            </h2>
            {isAnimating && <span className="text-fiery-terracotta/80 animate-pulse font-bold text-sm uppercase tracking-widest">Sowing...</span>}
          </div>
        )}
      </div>

      {/* Mancala Board */}
      <div 
        ref={boardRef}
        className="relative bg-wheat backdrop-blur-3xl p-8 md:p-12 rounded-[4rem] shadow-2xl shadow-fiery-terracotta/10 border border-fiery-terracotta/30 flex items-center gap-8 md:gap-10"
      >
        {/* P2 Store (Left) */}
        {renderPit(13, true)}

        {/* Small Pits Grid */}
        <div className="flex flex-col gap-6">
          {/* P2 Pits (Top row, goes right to left from P2's perspective, so indices 12 down to 7) */}
          <div className="flex gap-4">
            {[12, 11, 10, 9, 8, 7].map(i => renderPit(i))}
          </div>
          {/* P1 Pits (Bottom row, indices 0 to 5) */}
          <div className="flex gap-4">
            {[0, 1, 2, 3, 4, 5].map(i => renderPit(i))}
          </div>
        </div>

        {/* P1 Store (Right) */}
        {renderPit(6, true)}

        {/* Flying Pebble Overlay */}
        <AnimatePresence>
          {flyingPebble && (
            <motion.div
              key={flyingPebble.key}
              initial={{ 
                left: flyingPebble.startX, 
                top: flyingPebble.startY,
                x: "-50%",
                y: "-50%",
                scale: 1,
                opacity: 1
              }}
              animate={{ 
                left: flyingPebble.targetX, 
                top: flyingPebble.targetY,
                x: "-50%",
                y: "-50%",
                scale: 1.5,
              }}
              exit={{ scale: 0, opacity: 0, x: "-50%", y: "-50%" }}
              transition={{ duration: DELAY_FLY / 1000, ease: "easeInOut" }}
              className="absolute w-4 h-4 md:w-5 md:h-5 rounded-full shadow-[0_15px_30px_rgba(0,0,0,0.7),inset_0_-2px_6px_rgba(0,0,0,0.4)] z-50 overflow-hidden pointer-events-none bg-gradient-to-br from-espresso to-stormy-teal"
            >
               <div className="absolute top-[10%] left-[15%] w-[40%] h-[30%] bg-white/60 rounded-full blur-[0.5px] rotate-[-20deg]" />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

    </div>
  );
}
