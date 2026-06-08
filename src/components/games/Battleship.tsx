"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Room, BattleshipGameState, updateGameState, BattleshipShot } from "@/lib/firebase/rooms";

interface BattleshipProps {
  roomId: string;
  roomData: Room;
  currentUserId: string;
}

interface Ship {
  id: string;
  name: string;
  size: number;
  x: number;
  y: number;
  orientation: "horizontal" | "vertical";
  placed: boolean;
  color: string;
}

const INITIAL_SHIPS: Ship[] = [
  { id: "carrier", name: "Carrier", size: 5, x: 0, y: 0, orientation: "horizontal", placed: false, color: "bg-transparent" },
  { id: "battleship", name: "Battleship", size: 4, x: 0, y: 0, orientation: "horizontal", placed: false, color: "bg-transparent" },
  { id: "destroyer", name: "Destroyer", size: 3, x: 0, y: 0, orientation: "horizontal", placed: false, color: "bg-transparent" },
  { id: "submarine", name: "Submarine", size: 3, x: 0, y: 0, orientation: "horizontal", placed: false, color: "bg-transparent" },
  { id: "patrol", name: "Patrol Boat", size: 2, x: 0, y: 0, orientation: "horizontal", placed: false, color: "bg-transparent" },
];

const SmallExplosion = () => {
  return (
    <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-50">
      {Array.from({ length: 12 }).map((_, i) => (
        <motion.div
          key={i}
          initial={{ x: 0, y: 0, scale: 0.5, opacity: 1 }}
          animate={{
            x: Math.cos((i * 30 * Math.PI) / 180) * 60,
            y: Math.sin((i * 30 * Math.PI) / 180) * 60,
            scale: 2.5,
            opacity: 0,
          }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="absolute w-3 h-3 rounded-full bg-orange-500 shadow-[0_0_12px_orange]"
        />
      ))}
    </div>
  );
};

const BigExplosion = () => {
  return (
    <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-50">
      {Array.from({ length: 48 }).map((_, i) => {
        const angle = (i * 7.5 * Math.PI) / 180;
        const dist = 150 + Math.random() * 250;
        return (
          <motion.div
            key={i}
            initial={{ x: 0, y: 0, scale: 1, opacity: 1 }}
            animate={{
              x: Math.cos(angle) * dist,
              y: Math.sin(angle) * dist,
              scale: 0,
              opacity: 0,
            }}
            transition={{ duration: 1.2, ease: "easeOut" }}
            className={`absolute w-5 h-5 rounded-full ${
              i % 3 === 0 ? "bg-red-600 shadow-[0_0_20px_red]" : i % 3 === 1 ? "bg-orange-500 shadow-[0_0_20px_orange]" : "bg-yellow-400 shadow-[0_0_20px_yellow]"
            }`}
          />
        );
      })}
    </div>
  );
};

export function Battleship({ roomId, roomData, currentUserId }: BattleshipProps) {
  const gameState = roomData.gameState as BattleshipGameState | undefined;
  const isHost = roomData.hostId === currentUserId;
  const opponentId = roomData.players.find((p) => p !== currentUserId) || "";

  const isPowerupsMode = roomData.settings?.battleshipMode === "powerups";
  const gridSize = isPowerupsMode ? 15 : 10;

  // Local Hidden State
  const [ships, setShips] = useState<Ship[]>(INITIAL_SHIPS);
  const [hitsReceived, setHitsReceived] = useState(0);
  const [draggedShipId, setDraggedShipId] = useState<string | null>(null);
  const [unplacedOrientations, setUnplacedOrientations] = useState<Record<string, "horizontal" | "vertical">>({});
  const [dragTarget, setDragTarget] = useState<{ x: number, y: number } | null>(null);

  const [recentlySunkShip, setRecentlySunkShip] = useState<Ship | null>(null);
  const prevSunkShipsRef = React.useRef<string[]>([]);
  const [activePowerUp, setActivePowerUp] = useState<string | null>(null);
  const [powerupToast, setPowerupToast] = useState<string | null>(null);

  // Watch for newly sunk ships from opponent
  useEffect(() => {
    const oppSunk = gameState?.sunkShips?.[opponentId] || [];
    if (oppSunk.length > prevSunkShipsRef.current.length) {
      const newlySunkId = oppSunk[oppSunk.length - 1];
      const sunkShip = INITIAL_SHIPS.find(s => s.id === newlySunkId);
      if (sunkShip) {
        setRecentlySunkShip(sunkShip);
        setTimeout(() => setRecentlySunkShip(null), 3000);
      }
    }
    prevSunkShipsRef.current = oppSunk;
  }, [gameState?.sunkShips, opponentId]);

  const LOCAL_STORAGE_KEY = `battleship_fleet_${roomId}_${currentUserId}`;

  // Restore Hidden State from Cache to survive page refreshes!
  useEffect(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (saved) {
      setShips(JSON.parse(saved));
    }
  }, [LOCAL_STORAGE_KEY]);

  // Save Hidden State changes to Cache
  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(ships));
  }, [ships, LOCAL_STORAGE_KEY]);

  // Game Initialization
  const handleStartGame = useCallback(async () => {
    const initialShots: Record<string, BattleshipShot[]> = {};
    const initialInventories: Record<string, string[]> = {};
    roomData.players.forEach(p => {
      initialShots[p] = [];
      initialInventories[p] = [];
    });

    await updateGameState(roomId, {
      status: "placement",
      readyPlayers: [],
      currentTurn: roomData.players[0],
      winner: null,
      shotsTargetingPlayer: initialShots,
      sunkShips: {},
      inventories: initialInventories,
      jammerTarget: null
    });
  }, [roomId, roomData.players]);

  // Auto-initialize game state on mount (only host) to seamlessly transition from lobby
  useEffect(() => {
    if (!gameState && isHost) {
      handleStartGame();
    }
  }, [gameState, isHost, handleStartGame]);

  // --------------------------------------------------------------------------
  // THE FIRING LOOP & EVALUATION PROTOCOL (HIDDEN STATE SYNC)
  // --------------------------------------------------------------------------
  useEffect(() => {
    if (gameState?.status !== "playing") return;

    // Check shots that were fired AT US by the opponent
    const myShots = gameState.shotsTargetingPlayer[currentUserId] || [];
    const pendingShots = myShots.filter((s) => s.status === "pending");

    if (pendingShots.length > 0) {
      let updatedShots = [...myShots];
      let stateChanged = false;
      let newHits = hitsReceived;
      let anyHit = false;

      pendingShots.forEach((shot) => {
        // Evaluate the shot locally against our secret fleet coordinates
        let isHit = false;
        let hitCount = 0;

        if (shot.type === "uv") {
          ships.forEach((ship) => {
            if (!ship.placed) return;
            for (let i = 0; i < ship.size; i++) {
              const sx = ship.orientation === "horizontal" ? ship.x + i : ship.x;
              const sy = ship.orientation === "vertical" ? ship.y + i : ship.y;
              if (Math.abs(sx - shot.x) <= 1 && Math.abs(sy - shot.y) <= 1) {
                isHit = true;
                hitCount += 1;
              }
            }
          });
        } else {
          ships.forEach((ship) => {
            if (!ship.placed) return;
            for (let i = 0; i < ship.size; i++) {
              const sx = ship.orientation === "horizontal" ? ship.x + i : ship.x;
              const sy = ship.orientation === "vertical" ? ship.y + i : ship.y;
              if (sx === shot.x && sy === shot.y) {
                isHit = true;
              }
            }
          });

          if (isHit) {
            newHits += 1;
            anyHit = true;
          }
        }

        // Update the shot object with the truthful result
        const shotIndex = updatedShots.findIndex((s) => s.id === shot.id);
        if (shotIndex !== -1) {
          if (shot.type === "uv") {
            updatedShots[shotIndex] = { ...updatedShots[shotIndex], status: isHit ? "hit" : "miss", hitCount: hitCount };
          } else {
            updatedShots[shotIndex] = { ...updatedShots[shotIndex], status: isHit ? "hit" : "miss" };
          }
          stateChanged = true;
        }
      });

      if (stateChanged) {
        setHitsReceived(newHits);

        // Check for newly sunk ships
        const newSunkShips = [...(gameState.sunkShips?.[currentUserId] || [])];
        ships.forEach((ship) => {
          if (!ship.placed || newSunkShips.includes(ship.id)) return;
          
          let allHit = true;
          for (let i = 0; i < ship.size; i++) {
            const sx = ship.orientation === "horizontal" ? ship.x + i : ship.x;
            const sy = ship.orientation === "vertical" ? ship.y + i : ship.y;
            if (!updatedShots.some(s => s.x === sx && s.y === sy && s.status === "hit")) {
              allHit = false;
            }
          }
          if (allHit) {
            newSunkShips.push(ship.id);
          }
        });

        let finalWinner = gameState.winner;
        if (newHits >= 17) {
          finalWinner = opponentId; // We lost, they won
        }

        // Determine next turn
        let nextTurn = gameState.currentTurn;

        if (!anyHit && finalWinner === null) {
          nextTurn = currentUserId;
        }

        // Upload the evaluated shots back to Firebase so the opponent can render the results!
        const newShotsTargetingPlayer = { ...gameState.shotsTargetingPlayer, [currentUserId]: updatedShots };
        const newSunkShipsState = { ...(gameState.sunkShips || {}), [currentUserId]: newSunkShips };

        updateGameState(roomId, {
          ...gameState,
          winner: finalWinner,
          status: finalWinner ? "finished" : "playing",
          shotsTargetingPlayer: newShotsTargetingPlayer,
          sunkShips: newSunkShipsState,
          currentTurn: nextTurn
        });
      }
    }
  }, [gameState?.shotsTargetingPlayer, currentUserId, ships, hitsReceived, opponentId, roomId]);

  // --------------------------------------------------------------------------
  // ACTIONS
  // --------------------------------------------------------------------------

  const handleUseJammer = async () => {
    if (!gameState || gameState.status !== "playing" || gameState.currentTurn !== currentUserId) return;
    let newInventories = gameState.inventories || {};
    let myNewInventory = [...(newInventories[currentUserId] || [])];
    const idx = myNewInventory.indexOf("jammer");
    if (idx > -1) {
       myNewInventory.splice(idx, 1);
       await updateGameState(roomId, {
         ...gameState,
         inventories: { ...newInventories, [currentUserId]: myNewInventory },
         jammerTarget: opponentId
       });
       setActivePowerUp(null);
    }
  };

  const handleFire = async (x: number, y: number) => {
    if (!gameState || gameState.status !== "playing" || gameState.currentTurn !== currentUserId) return;

    const opponentShots = gameState.shotsTargetingPlayer[opponentId] || [];

    // Prevent firing if there's a pending shot waiting to be evaluated
    if (opponentShots.some(s => s.status === "pending")) return;

    let newShots: BattleshipShot[] = [];
    let newInventories = gameState.inventories || {};
    let myNewInventory = [...(newInventories[currentUserId] || [])];
    let usedPowerup = false;

    if (activePowerUp === "bomber") {
      for (let i = 0; i < 5; i++) {
        let rx: number, ry: number;
        do {
          rx = Math.floor(Math.random() * gridSize);
          ry = Math.floor(Math.random() * gridSize);
        } while (opponentShots.some(s => s.x === rx && s.y === ry) || newShots.some(s => s.x === rx && s.y === ry));
        newShots.push({ id: `shot_${Date.now()}_${Math.random()}`, x: rx, y: ry, status: "pending" });
      }
      usedPowerup = true;
    } else if (activePowerUp === "missiles") {
      const targets = [[x, y], [x+1, y], [x-1, y], [x, y+1], [x, y-1]];
      targets.forEach(([tx, ty]) => {
        if (tx >= 0 && tx < gridSize && ty >= 0 && ty < gridSize) {
          if (!opponentShots.some(s => s.x === tx && s.y === ty && s.type !== "uv") && !newShots.some(s => s.x === tx && s.y === ty)) {
            newShots.push({ id: `shot_${Date.now()}_${Math.random()}`, x: tx, y: ty, status: "pending" });
          }
        }
      });
      usedPowerup = true;
    } else if (activePowerUp === "nuke") {
      for (let tx = x - 2; tx <= x + 2; tx++) {
        for (let ty = y - 2; ty <= y + 2; ty++) {
          if (Math.abs(tx - x) + Math.abs(ty - y) <= 2) {
            if (tx >= 0 && tx < gridSize && ty >= 0 && ty < gridSize) {
               if (!opponentShots.some(s => s.x === tx && s.y === ty && s.type !== "uv") && !newShots.some(s => s.x === tx && s.y === ty)) {
                 newShots.push({ id: `shot_${Date.now()}_${Math.random()}`, x: tx, y: ty, status: "pending" });
               }
            }
          }
        }
      }
      usedPowerup = true;
    } else if (activePowerUp === "uv") {
       newShots.push({ id: `shot_${Date.now()}_${Math.random()}`, x, y, status: "pending", type: "uv" });
       usedPowerup = true;
    } else {
       if (opponentShots.some(s => s.x === x && s.y === y && s.type !== "uv")) return;
       newShots.push({ id: `shot_${Date.now()}_${Math.random()}`, x, y, status: "pending" });
    }

    if (newShots.length === 0) return;

    if (!usedPowerup && isPowerupsMode) {
       if (Math.random() <= 0.40) {
         const roll = Math.random();
         let drop = "bomber";
         if (roll > 0.4) drop = "missiles";
         if (roll > 0.7) drop = "uv";
         if (roll > 0.85) drop = "jammer";
         if (roll > 0.95) drop = "nuke";
         
         myNewInventory.push(drop);
         setPowerupToast(`FOUND: ${drop.toUpperCase()}!`);
         setTimeout(() => setPowerupToast(null), 3000);
       }
    }

    if (usedPowerup && activePowerUp) {
      const idx = myNewInventory.indexOf(activePowerUp);
      if (idx > -1) myNewInventory.splice(idx, 1);
      setActivePowerUp(null);
    }

    const newTargetShots = [...opponentShots, ...newShots];

    const stateUpdates: any = {
      ...gameState,
      shotsTargetingPlayer: {
        ...gameState.shotsTargetingPlayer,
        [opponentId]: newTargetShots
      },
      inventories: {
        ...newInventories,
        [currentUserId]: myNewInventory
      }
    };

    if (gameState.jammerTarget === currentUserId) {
      stateUpdates.jammerTarget = null;
    }

    // Push the shot to Firebase. DO NOT pass turn yet! Wait for evaluation.
    await updateGameState(roomId, stateUpdates);
  };

  const checkCollision = (targetShip: Ship, testX: number, testY: number, testOrient: string) => {
    // Check bounds
    if (testOrient === "horizontal" && testX + targetShip.size > gridSize) return true;
    if (testOrient === "vertical" && testY + targetShip.size > gridSize) return true;

    // Check overlaps against other placed ships
    let overlap = false;
    ships.forEach(otherShip => {
      if (otherShip.id === targetShip.id || !otherShip.placed) return;
      for (let i = 0; i < targetShip.size; i++) {
        const tx = testOrient === "horizontal" ? testX + i : testX;
        const ty = testOrient === "vertical" ? testY + i : testY;
        for (let j = 0; j < otherShip.size; j++) {
          const ox = otherShip.orientation === "horizontal" ? otherShip.x + j : otherShip.x;
          const oy = otherShip.orientation === "vertical" ? otherShip.y + j : otherShip.y;
          if (tx === ox && ty === oy) overlap = true;
        }
      }
    });
    return overlap;
  };

  const handleCellDrop = (x: number, y: number) => {
    if (!draggedShipId) return;
    const ship = ships.find(s => s.id === draggedShipId);
    if (!ship) return;

    const isUnplaced = !ship.placed;
    const orient = isUnplaced ? (unplacedOrientations[ship.id] || "horizontal") : ship.orientation;

    if (!checkCollision(ship, x, y, orient)) {
      setShips(prev => prev.map(s => s.id === draggedShipId ? { ...s, placed: true, x, y, orientation: orient } : s));
    }
    setDraggedShipId(null);
    setDragTarget(null);
  };

  const handleShipRotate = (shipId: string) => {
    const ship = ships.find(s => s.id === shipId);
    if (!ship || !ship.placed) return;

    const newOrient = ship.orientation === "horizontal" ? "vertical" : "horizontal";
    if (!checkCollision(ship, ship.x, ship.y, newOrient)) {
      setShips(prev => prev.map(s => s.id === shipId ? { ...s, orientation: newOrient } : s));
    }
  };

  const handleLockIn = async () => {
    if (!gameState) return;
    const newReady = [...gameState.readyPlayers, currentUserId];
    const bothReady = newReady.length === 2;
    await updateGameState(roomId, {
      ...gameState,
      readyPlayers: newReady,
      status: bothReady ? "playing" : "placement"
    });
  };

  // --------------------------------------------------------------------------
  // RENDERERS
  // --------------------------------------------------------------------------

  const renderGridCell = (x: number, y: number, isTargetRadar: boolean) => {
    // If it's the target radar, render the shots WE fired at the opponent
    if (isTargetRadar) {
      const ourShots = gameState?.shotsTargetingPlayer[opponentId] || [];
      const shot = ourShots.find(s => s.x === x && s.y === y);
      const isJammed = gameState?.jammerTarget === currentUserId;

      return (
        <div
          key={`target-${x}-${y}`}
          onClick={() => handleFire(x, y)}
          className="w-full h-full border border-cyan-800/50 bg-slate-900 hover:bg-cyan-900/40 cursor-pointer flex items-center justify-center relative transition-colors"
        >
          <AnimatePresence>
            {!isJammed && shot && shot.status !== "pending" && shot.type !== "uv" && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className={`w-4 h-4 rounded-full shadow-[0_0_8px_currentColor] relative flex items-center justify-center ${shot.status === "hit" ? "bg-red-500 text-red-500" : "bg-white text-white"}`}
              >
                {shot.status === "hit" && <SmallExplosion />}
              </motion.div>
            )}
            {!isJammed && shot && shot.status !== "pending" && shot.type === "uv" && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className={`absolute inset-0 scale-[3] border-[1.5px] z-10 pointer-events-none flex items-center justify-center ${shot.status === "hit" ? "bg-green-500/20 border-green-500/80" : "bg-red-500/20 border-red-500/80"}`}
              >
                 {shot.status === "hit" && (
                   <span className="font-bold text-white text-[8px] drop-shadow-[0_0_2px_black] scale-[0.33]">
                     {shot.hitCount}
                   </span>
                 )}
              </motion.div>
            )}
            {!isJammed && shot && shot.status === "pending" && (
              <motion.div animate={{ opacity: [0.2, 1, 0.2] }} transition={{ repeat: Infinity }} className="w-3 h-3 rounded-full bg-cyan-400" />
            )}
          </AnimatePresence>
        </div>
      );
    }

    // If it's MY FLEET, render my ships and the shots fired AT ME
    const myShots = gameState?.shotsTargetingPlayer[currentUserId] || [];
    const shot = myShots.find(s => s.x === x && s.y === y);

    let isFootprint = false;
    let isValidFootprint = false;

    if (draggedShipId && dragTarget && gameState?.status === "placement") {
      const ship = ships.find(s => s.id === draggedShipId);
      if (ship) {
        const orient = !ship.placed ? (unplacedOrientations[ship.id] || "horizontal") : ship.orientation;
        for (let i = 0; i < ship.size; i++) {
          const fx = orient === "horizontal" ? dragTarget.x + i : dragTarget.x;
          const fy = orient === "vertical" ? dragTarget.y + i : dragTarget.y;
          if (x === fx && y === fy) {
            isFootprint = true;
            isValidFootprint = !checkCollision(ship, dragTarget.x, dragTarget.y, orient);
          }
        }
      }
    }

    const bgClass = isFootprint
      ? (isValidFootprint ? 'bg-green-500/40' : 'bg-red-500/40')
      : 'bg-slate-800/80';

    return (
      <div
        key={`fleet-${x}-${y}`}
        className={`w-full h-full border border-blue-900/50 flex items-center justify-center relative transition-colors ${bgClass}`}
        onDragOver={(e) => { e.preventDefault(); if (dragTarget?.x !== x || dragTarget?.y !== y) setDragTarget({ x, y }); }}
        onDrop={(e) => { e.preventDefault(); handleCellDrop(x, y); }}
      >
        <AnimatePresence>
          {shot && shot.status !== "pending" && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className={`w-3 h-3 rounded-full z-20 ${shot.status === "hit" ? "bg-red-500 shadow-[0_0_10px_red]" : "bg-gray-400"}`}
            />
          )}
        </AnimatePresence>
      </div>
    );
  };

  const renderMyFleetGrid = () => {
    return (
      <div 
        className="relative w-full aspect-square max-w-2xl mx-auto grid border-2 border-blue-900 rounded-sm bg-slate-900/50 bg-[url('/assets/battleship/water.jpg')] bg-cover bg-center"
        style={{ gridTemplateColumns: `repeat(${gridSize}, minmax(0, 1fr))`, gridTemplateRows: `repeat(${gridSize}, minmax(0, 1fr))` }}
      >
        {Array.from({ length: gridSize * gridSize }).map((_, i) => renderGridCell(i % gridSize, Math.floor(i / gridSize), false))}

        {/* Render Placed Ships */}
        {ships.filter(s => s.placed).map(ship => {
          const w = ship.orientation === "horizontal" ? `${(ship.size / gridSize) * 100}%` : `${(1 / gridSize) * 100}%`;
          const h = ship.orientation === "vertical" ? `${(ship.size / gridSize) * 100}%` : `${(1 / gridSize) * 100}%`;
          const left = `${(ship.x / gridSize) * 100}%`;
          const top = `${(ship.y / gridSize) * 100}%`;

          const isVertical = ship.orientation === "vertical";
          const imgStyle = isVertical ? {
            width: `${ship.size * 100}%`,
            height: `${100 / ship.size}%`,
            transform: "translate(-50%, -50%) rotate(90deg)",
            left: "50%",
            top: "50%",
            position: "absolute" as const,
            maxWidth: "none",
            maxHeight: "none",
          } : {
            width: "100%",
            height: "100%",
            position: "absolute" as const,
          };

          return (
            <div
              key={ship.id}
              draggable={gameState?.status === "placement"}
              onDragStart={(e) => {
                if (gameState?.status !== "placement") return;
                setDraggedShipId(ship.id);
                e.dataTransfer.setData("text/plain", "");
              }}
              onDragEnd={() => setDragTarget(null)}
              onClick={() => { if (gameState?.status === "placement") handleShipRotate(ship.id); }}
              className={`absolute border border-slate-900 shadow-lg cursor-pointer ${ship.color} transition-all duration-300 z-10 overflow-hidden hover:brightness-110 ${draggedShipId === ship.id ? 'opacity-50' : ''}`}
              style={{ width: w, height: h, left, top }}
            >
              {/* Ship Image — fills the cell slot precisely */}
              <img
                src={`/assets/battleship/${ship.id}.png`}
                alt={ship.name}
                style={imgStyle}
                className="object-contain drop-shadow-lg pointer-events-none"
              />
            </div>
          );
        })}
      </div>
    );
  };

  if (!gameState) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-slate-900 rounded-3xl border border-slate-700 shadow-2xl">
        <p className="text-cyan-400 animate-pulse font-mono tracking-widest">INITIALIZING TACTICAL RADAR...</p>
      </div>
    );
  }

  if (gameState.status === "finished") {
    const isWinner = gameState.winner === currentUserId;
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-slate-900 rounded-3xl border border-slate-700 shadow-2xl w-full max-w-lg mx-auto">
        <h2 className={`text-5xl font-black mb-4 ${isWinner ? "text-green-500" : "text-red-500"}`}>
          {isWinner ? "VICTORY" : "DEFEAT"}
        </h2>
        <p className="text-slate-400 mb-8 font-mono">
          {isWinner ? "Enemy fleet obliterated." : "Your fleet was destroyed."}
        </p>
        {isHost && (
          <button onClick={handleStartGame} className="px-8 py-4 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-xl">
            Play Again
          </button>
        )}
      </div>
    );
  }

  if (gameState.status === "placement") {
    const isReady = gameState.readyPlayers.includes(currentUserId);
    const allPlaced = ships.every(s => s.placed);

    return (
      <div className="flex flex-col lg:flex-row gap-8 w-full max-w-7xl mx-auto items-start font-mono">
        {/* Left: Fleet Roster */}
        <div className="w-full lg:w-1/3 bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-xl">
          <h3 className="text-cyan-400 text-xl font-bold mb-6 tracking-widest">DEPLOY FLEET</h3>
          <div className="space-y-4">
            {ships.filter(s => !s.placed).map(ship => {
              const orient = unplacedOrientations[ship.id] || "horizontal";
              return (
                <div key={ship.id} className="flex items-center gap-2">
                  <div
                    draggable
                    onDragStart={(e) => { setDraggedShipId(ship.id); e.dataTransfer.setData("text/plain", ""); }}
                    onDragEnd={() => setDragTarget(null)}
                    className={`flex-1 h-12 ${ship.color} rounded-md cursor-grab active:cursor-grabbing flex items-center justify-center border-2 border-transparent hover:border-cyan-400 transition-colors relative overflow-hidden`}
                  >
                    <img
                      src={`/assets/battleship/${ship.id}.png`}
                      alt={ship.name}
                      className={`absolute inset-0 w-full h-full object-contain pointer-events-none ${orient === "vertical" ? "rotate-90" : ""}`}
                      onError={(e) => (e.currentTarget.style.display = 'none')}
                    />
                    <span className="relative z-10 text-white font-bold text-sm tracking-widest drop-shadow">{ship.name} ({ship.size})</span>
                  </div>
                  <button
                    onClick={() => setUnplacedOrientations(prev => ({ ...prev, [ship.id]: orient === "horizontal" ? "vertical" : "horizontal" }))}
                    className="p-3 bg-slate-800 hover:bg-slate-700 rounded-md border border-slate-700 text-cyan-400 font-bold"
                    title="Rotate"
                  >
                    ↻
                  </button>
                </div>
              );
            })}
            {allPlaced && !isReady && (
              <button
                onClick={handleLockIn}
                className="w-full mt-8 py-4 bg-green-600 hover:bg-green-500 text-white font-black tracking-widest rounded-xl shadow-[0_0_15px_rgba(22,163,74,0.4)] animate-pulse"
              >
                LOCK IN FLEET
              </button>
            )}
            {isReady && (
              <div className="w-full mt-8 py-4 bg-slate-800 text-cyan-500 text-center font-bold tracking-widest rounded-xl">
                WAITING FOR OPPONENT...
              </div>
            )}
          </div>
          <p className="text-slate-500 text-xs mt-8">Drag ships onto the grid. Click placed ships to rotate.</p>
        </div>

        {/* Right: Grid */}
        <div className="w-full lg:w-2/3 bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-xl flex justify-center">
          {renderMyFleetGrid()}
        </div>
      </div>
    );
  }

  // PLAYING STATE
  const isMyTurn = gameState.currentTurn === currentUserId;

  return (
    <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto font-mono">
      {/* Header Info */}
      <div className="flex justify-between items-center bg-slate-900 px-6 py-4 rounded-xl border border-slate-800">
        <div className="flex flex-col">
          <span className="text-slate-500 text-xs tracking-widest">STATUS</span>
          <span className={`text-lg font-bold tracking-widest ${isMyTurn ? "text-green-400" : "text-yellow-500"}`}>
            {isMyTurn ? "YOUR TURN TO FIRE" : "AWAITING ENEMY FIRE"}
          </span>
        </div>
        <div className="flex flex-col items-end">
          <span className="text-slate-500 text-xs tracking-widest">FLEET INTEGRITY</span>
          <span className="text-red-400 text-lg font-bold tracking-widest">HITS TAKEN: {hitsReceived}/17</span>
        </div>
      </div>

      {/* Grids Side by Side */}
      <div className="flex flex-col lg:flex-row gap-6 justify-center">
        {/* Target Radar (Left/Top) */}
        <div className="flex flex-col flex-1 gap-4">
          <div className="bg-slate-900 p-6 rounded-2xl border border-cyan-900/50 shadow-[0_0_30px_rgba(8,145,178,0.1)] relative">
            <h3 className="absolute -top-3 left-6 bg-slate-900 px-2 text-cyan-500 font-bold tracking-widest text-sm">TARGET RADAR</h3>
            <div 
              className={`relative w-full aspect-square max-w-2xl mx-auto grid border-2 border-cyan-800 rounded-sm bg-slate-950 bg-[url('/assets/battleship/water.jpg')] bg-cover bg-center transition-opacity ${isMyTurn && !gameState.shotsTargetingPlayer[opponentId]?.some(s => s.status === "pending") ? "opacity-100" : "opacity-50 pointer-events-none"}`}
              style={{ gridTemplateColumns: `repeat(${gridSize}, minmax(0, 1fr))`, gridTemplateRows: `repeat(${gridSize}, minmax(0, 1fr))` }}
            >
              {/* Radar Sweep Effect */}
              <div className="absolute inset-0 rounded-full border border-cyan-500/10 animate-[ping_4s_cubic-bezier(0,0,0.2,1)_infinite] pointer-events-none m-4" />
              {Array.from({ length: gridSize * gridSize }).map((_, i) => renderGridCell(i % gridSize, Math.floor(i / gridSize), true))}

              {gameState?.jammerTarget === currentUserId && (
                 <div className="absolute inset-0 z-50 pointer-events-none flex flex-col items-center justify-center bg-purple-950/60 backdrop-blur-[2px] border border-purple-500 overflow-hidden">
                   <div className="text-purple-400 font-black text-2xl md:text-4xl tracking-widest text-center animate-pulse z-10 drop-shadow-[0_0_10px_purple]">
                     RADAR SCRAMBLED
                   </div>
                   <div className="text-purple-300/80 font-mono text-sm mt-2 font-bold animate-pulse">
                     FIRE BLINDLY
                   </div>
                 </div>
              )}
            </div>
            {powerupToast && (
               <motion.div 
                 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                 className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-purple-600 text-white font-bold py-1 px-3 rounded shadow-lg z-50 whitespace-nowrap tracking-widest"
               >
                 {powerupToast}
               </motion.div>
            )}
          </div>
          
          {isPowerupsMode && (
             <div className="bg-slate-900 p-4 rounded-xl border border-purple-900/50 flex flex-col items-center">
                <h4 className="text-purple-400 text-xs font-bold tracking-widest mb-3">POWER UPS</h4>
                <div className="flex flex-wrap gap-2 justify-center">
                   {(gameState.inventories?.[currentUserId] || []).map((item, i) => (
                      <button 
                        key={i} 
                        onClick={() => {
                          if (item === "jammer") {
                             handleUseJammer();
                          } else {
                             setActivePowerUp(activePowerUp === item ? null : item);
                          }
                        }}
                        className={`px-3 py-1.5 rounded text-xs font-bold font-mono transition-colors border ${activePowerUp === item ? 'bg-purple-600 text-white border-purple-400 shadow-[0_0_10px_purple]' : 'bg-slate-800 text-purple-300 border-slate-700 hover:bg-slate-700'}`}
                      >
                         {item.toUpperCase()}
                      </button>
                   ))}
                   {(gameState.inventories?.[currentUserId] || []).length === 0 && (
                      <span className="text-slate-600 text-xs font-mono">NO ITEMS</span>
                   )}
                </div>
             </div>
          )}
        </div>

        {/* My Fleet (Right/Bottom) */}
        <div className="bg-slate-900 p-6 rounded-2xl border border-blue-900/50 shadow-xl relative flex-1">
          <h3 className="absolute -top-3 left-6 bg-slate-900 px-2 text-blue-500 font-bold tracking-widest text-sm">MY FLEET</h3>
          {renderMyFleetGrid()}
        </div>
      </div>

      <AnimatePresence>
        {recentlySunkShip && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 pointer-events-none backdrop-blur-sm"
          >
            <div className="bg-slate-950 border border-red-500/50 p-12 rounded-3xl shadow-[0_0_80px_rgba(239,68,68,0.3)] flex flex-col items-center relative">
              <h2 className="text-4xl md:text-6xl text-red-500 font-black tracking-widest mb-8 drop-shadow-[0_0_10px_red]">SHIP DESTROYED!</h2>
              <div className="relative w-64 h-32 flex items-center justify-center">
                <img src={`/assets/battleship/${recentlySunkShip.id}.png`} alt={recentlySunkShip.name} className="absolute inset-0 w-full h-full object-contain filter drop-shadow-[0_0_15px_rgba(239,68,68,0.8)]" />
                <BigExplosion />
              </div>
              <p className="text-white text-2xl font-bold mt-8 font-mono">{recentlySunkShip.name.toUpperCase()} SUNK</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
