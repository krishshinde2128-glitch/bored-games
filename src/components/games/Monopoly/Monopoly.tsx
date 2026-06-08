"use client";

import React, { useEffect, useState } from "react";
import { Room, MonopolyGameState, updateGameState, MonopolyPlayer } from "@/lib/firebase/rooms";
import { MONOPOLY_BOARD } from "@/lib/monopolyData";
import { Board2D } from "./Board2D";
import { CssDice } from "./CssDice";
import { Dices, Trash2, ArrowUp, ArrowDown, Send, Copy } from "lucide-react";

interface MonopolyProps {
  roomId: string;
  roomData: Room;
  currentUserId: string;
}

export function Monopoly({ roomId, roomData, currentUserId }: MonopolyProps) {
  const gameState = roomData.gameState as MonopolyGameState | undefined;
  const isHost = roomData.hostId === currentUserId;

  const [selectedPropertyId, setSelectedPropertyId] = useState<number | null>(null);

  const handleStartGame = async () => {
    if (!gameState && isHost) {
      const initialPlayers: Record<string, MonopolyPlayer> = {};
      roomData.players.forEach((p) => {
        initialPlayers[p] = {
          id: p,
          cash: 1500,
          position: 0,
          inJail: false,
          jailTurns: 0,
          isBankrupt: false
        };
      });

      await updateGameState(roomId, {
        status: "playing",
        currentTurn: roomData.players[Math.floor(Math.random() * roomData.players.length)],
        turnPhase: "ROLL",
        players: initialPlayers,
        properties: {},
        dice: [1, 1],
        isRolling: false,
        doublesCount: 0,
        activeTrade: null,
        activeAuction: null,
        winner: null
      } as MonopolyGameState);
    }
  };

  useEffect(() => {
    if (!gameState && isHost) {
      handleStartGame();
    }
  }, [gameState, isHost]);

  if (!gameState) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 bg-wheat rounded-3xl border border-fiery-terracotta/30 shadow-xl m-4">
        <div className="text-6xl animate-bounce mb-4">🎲</div>
        <h2 className="text-2xl font-black text-espresso tracking-tight">Setting up the board...</h2>
      </div>
    );
  }

  // --------------------------------------------------------------------------
  // ACTIONS
  // --------------------------------------------------------------------------

  const handleRollDice = async () => {
    if (!gameState || gameState.status !== "playing" || gameState.currentTurn !== currentUserId || gameState.turnPhase !== "ROLL") return;
    
    const d1 = Math.floor(Math.random() * 6) + 1;
    const d2 = Math.floor(Math.random() * 6) + 1;
    
    // Push the initial dice roll to Firebase to sync animation
    const rollState = {
      ...gameState,
      dice: [d1, d2] as [number, number],
      isRolling: true
    };
    
    await updateGameState(roomId, rollState);

    // Wait for the animation to play
    setTimeout(async () => {
      const me = rollState.players[currentUserId];
      const isDouble = d1 === d2;

      let newDoublesCount = isDouble ? rollState.doublesCount + 1 : 0;
      let newPos = me.position;
      let newInJail = me.inJail;
      let newCash = me.cash;
      let nextPhase: MonopolyGameState["turnPhase"] = "ACTION";

      if (newInJail) {
         if (isDouble) {
           newInJail = false;
           newPos = (newPos + d1 + d2) % 40;
         } else {
           nextPhase = "MANAGEMENT"; 
         }
      } else {
        if (newDoublesCount === 3) {
          newInJail = true;
          newPos = 10;
          newDoublesCount = 0;
          nextPhase = "MANAGEMENT";
        } else {
          newPos = (newPos + d1 + d2) % 40;
          if (newPos < me.position && newPos !== 10) {
            newCash += 200;
          }
        }
      }

      const nextState = {
        ...rollState,
        isRolling: false,
        doublesCount: newDoublesCount,
        turnPhase: nextPhase,
        players: {
          ...rollState.players,
          [currentUserId]: {
            ...me,
            position: newPos,
            inJail: newInJail,
            cash: newCash
          }
        }
      };

      if (nextPhase === "ACTION") {
        const space = MONOPOLY_BOARD[newPos];
        if (space.type === "corner" || space.type === "chest" || space.type === "chance" || space.type === "tax") {
           nextState.turnPhase = "MANAGEMENT";
        } else if (space.type === "property" || space.type === "railroad" || space.type === "utility") {
           const propState = rollState.properties[newPos];
           if (propState && propState.ownerId && propState.ownerId !== currentUserId) {
              nextState.turnPhase = "MANAGEMENT";
           } else if (!propState || !propState.ownerId) {
              nextState.turnPhase = "ACTION";
           } else {
              nextState.turnPhase = "MANAGEMENT";
           }
        }
      }

      await updateGameState(roomId, nextState);
    }, 1200);
  };



  const handleEndTurn = async () => {
    if (!gameState || gameState.status !== "playing" || gameState.currentTurn !== currentUserId || gameState.turnPhase !== "MANAGEMENT") return;

    let nextTurn = currentUserId;
    if (gameState.doublesCount === 0 || gameState.players[currentUserId].inJail) {
      const pList = roomData.players;
      let currentIndex = pList.indexOf(currentUserId);
      do {
        currentIndex = (currentIndex + 1) % pList.length;
      } while (gameState.players[pList[currentIndex]]?.isBankrupt && currentIndex !== pList.indexOf(currentUserId));
      nextTurn = pList[currentIndex];
    }

    await updateGameState(roomId, {
      ...gameState,
      currentTurn: nextTurn,
      turnPhase: "ROLL"
    });
  };

  const handleBuyProperty = async () => {
    if (!gameState || gameState.status !== "playing" || gameState.currentTurn !== currentUserId || gameState.turnPhase !== "ACTION") return;
    const me = gameState.players[currentUserId];
    const space = MONOPOLY_BOARD[me.position];
    if (!space.price) return;

    if (me.cash >= space.price) {
      await updateGameState(roomId, {
        ...gameState,
        turnPhase: "MANAGEMENT",
        players: {
          ...gameState.players,
          [currentUserId]: {
            ...me,
            cash: me.cash - space.price
          }
        },
        properties: {
          ...gameState.properties,
          [me.position]: {
            ownerId: currentUserId,
            houses: 0,
            isMortgaged: false
          }
        }
      });
    }
  };

  // --------------------------------------------------------------------------
  // Color helpers
  // --------------------------------------------------------------------------
  const colorHexes: Record<string, string> = {
    brown: "#8B4513",
    lightBlue: "#AAD8E6",
    pink: "#D93A96",
    orange: "#F7941D",
    red: "#ED1B24",
    yellow: "#FEF200",
    green: "#1FB25A",
    darkBlue: "#0072BB",
  };

  // --------------------------------------------------------------------------
  // RENDER PANELS
  // --------------------------------------------------------------------------

  const renderActionPanel = () => {
    const isMyTurn = gameState.currentTurn === currentUserId;
    const me = gameState.players[currentUserId];
    const space = MONOPOLY_BOARD[me.position];

    return (
      <div className="flex flex-col gap-4 items-center">
        {!isMyTurn ? (
          <div className="flex items-center gap-2 bg-white/80 backdrop-blur-sm px-4 py-2 rounded-lg border border-[#2e7d32]/30">
             <div
                className="w-5 h-5 rounded-full border-[1.5px] border-white"
                style={{
                  backgroundColor: roomData.playerAvatars?.[gameState.currentTurn] || "#475569",
                  boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
                }}
             />
             <span className="text-[#1a3a1a] font-bold text-sm" style={{ fontFamily: "'Georgia', serif" }}>
               {roomData.playerNames[gameState.currentTurn]} is playing...
             </span>
          </div>
        ) : (
          <>
            {gameState.turnPhase === "ROLL" && (
              <button
                onClick={handleRollDice}
                className="bg-[#c41e3a] hover:bg-[#a91830] px-6 py-2.5 rounded-md text-white font-bold text-base tracking-wide transform transition-all active:scale-95 flex items-center gap-2 border border-[#8b1528]"
                style={{ fontFamily: "'Georgia', serif" }}
              >
                <Dices size={20} />
                Roll Dice
              </button>
            )}

            {gameState.turnPhase === "ACTION" && (
              <div className="flex flex-col gap-2.5 items-center">
                 <div className="text-[#1a3a1a] text-sm font-bold bg-white/90 backdrop-blur-sm px-5 py-2 rounded-md border border-[#2e7d32]/30" style={{ fontFamily: "'Georgia', serif" }}>
                   Landed on {space.name}
                 </div>
                 <div className="flex gap-3">
                    <button onClick={handleBuyProperty} className="bg-[#2e7d32] hover:bg-[#256a29] px-6 py-2.5 rounded-md text-white font-bold border border-[#1a5c1f] transition-all active:scale-95" style={{ fontFamily: "'Georgia', serif" }}>
                      Buy (${space.price})
                    </button>
                    <button className="bg-[#c41e3a] hover:bg-[#a91830] px-6 py-2.5 rounded-md text-white font-bold border border-[#8b1528] transition-all active:scale-95" style={{ fontFamily: "'Georgia', serif" }}>
                      Auction
                    </button>
                 </div>
              </div>
            )}

            {gameState.turnPhase === "MANAGEMENT" && (
              <button
                onClick={handleEndTurn}
                className="bg-[#1a3a1a] hover:bg-[#0f2d0f] px-8 py-3 rounded-md text-white font-bold text-base tracking-wider transform transition-all active:scale-95 border border-[#2e7d32]"
                style={{ fontFamily: "'Georgia', serif" }}
              >
                End Turn
              </button>
            )}
          </>
        )}
      </div>
    );
  };

  const renderPropertyPopover = () => {
    if (selectedPropertyId === null) return null;
    const propData = MONOPOLY_BOARD[selectedPropertyId];
    if (propData.type !== "property" && propData.type !== "railroad" && propData.type !== "utility") return null;

    const propState = gameState.properties[selectedPropertyId];
    const ownerName = propState?.ownerId ? roomData.playerNames[propState.ownerId] : null;
    const ownerAvatar = propState?.ownerId ? roomData.playerAvatars?.[propState.ownerId] : null;
    const headerColor = propData.colorGroup ? colorHexes[propData.colorGroup] : "#5c6b5c";

    return (
      <div className="absolute top-10 left-10 w-72 bg-[#f5f0e8] rounded-lg overflow-hidden border-2 border-[#1a3a1a] z-50 animate-in fade-in zoom-in-95 duration-200"
           style={{ fontFamily: "'Georgia', serif" }}>
        {/* Header */}
        {propData.type === "property" && (
          <div className="w-full h-12 flex items-center justify-center" style={{ backgroundColor: headerColor }}>
            <span className="text-white font-black uppercase text-lg tracking-wider drop-shadow-md">{propData.name}</span>
          </div>
        )}
        {(propData.type === "railroad" || propData.type === "utility") && (
          <div className="w-full p-4 bg-[#e8e0d4] flex items-center justify-center border-b-2 border-[#1a3a1a]">
            <span className="text-[#1a3a1a] font-black uppercase tracking-wider">{propData.name}</span>
          </div>
        )}

        <div className="p-4 space-y-3">
          <div className="flex justify-between text-[10px] font-bold text-[#5c6b5c] uppercase tracking-widest border-b border-[#c8bfa8] pb-1">
            <span>rent schedule</span>
            <span>amount</span>
          </div>

          <div className="space-y-1.5 text-xs text-[#3a4a3a]">
            <div className="flex justify-between bg-[#e8e0d4] p-1.5 rounded">
               <span>Base rent</span>
               <span className="font-bold text-[#1a3a1a]">${propData.rent?.[0] || 0}</span>
            </div>
            {propData.type === "property" && (
              <>
                <div className="flex justify-between px-1.5">
                   <span>🏠 × 1</span>
                   <span className="font-bold text-[#1a3a1a]">${propData.rent?.[1] || 0}</span>
                </div>
                <div className="flex justify-between px-1.5">
                   <span>🏠 × 2</span>
                   <span className="font-bold text-[#1a3a1a]">${propData.rent?.[2] || 0}</span>
                </div>
                <div className="flex justify-between px-1.5">
                   <span>🏠 × 3</span>
                   <span className="font-bold text-[#1a3a1a]">${propData.rent?.[3] || 0}</span>
                </div>
                <div className="flex justify-between px-1.5">
                   <span>🏠 × 4</span>
                   <span className="font-bold text-[#1a3a1a]">${propData.rent?.[4] || 0}</span>
                </div>
                <div className="flex justify-between bg-[#e8e0d4] p-1.5 rounded">
                   <span>🏨 Hotel</span>
                   <span className="font-bold text-[#1a3a1a]">${propData.rent?.[5] || 0}</span>
                </div>
              </>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-2">
             <button className="flex-1 bg-[#e8e0d4] text-[#3a4a3a] hover:bg-[#d8d0c4] py-2 rounded flex items-center justify-center transition-colors border border-[#c8bfa8]">
               <ArrowUp size={14} />
             </button>
             <button className="flex-1 bg-[#e8e0d4] text-[#3a4a3a] hover:bg-[#d8d0c4] py-2 rounded flex items-center justify-center transition-colors border border-[#c8bfa8]">
               <ArrowDown size={14} />
             </button>
             <button className="flex-1 bg-[#c41e3a]/10 text-[#c41e3a] hover:bg-[#c41e3a]/20 py-2 rounded flex items-center justify-center transition-colors border border-[#c41e3a]/20">
               <Trash2 size={14} />
             </button>
          </div>

          <div className="border-t border-[#c8bfa8] pt-3">
            {ownerName ? (
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-[#5c6b5c] uppercase font-bold">Owner</span>
                <div className="flex items-center gap-2">
                   {ownerAvatar && (
                     <div className="w-4 h-4 rounded-full border border-white" style={{ backgroundColor: ownerAvatar, boxShadow: '0 1px 2px rgba(0,0,0,0.2)' }} />
                   )}
                   <span className="font-bold text-[#1a3a1a] text-sm">{ownerName}</span>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                 <span className="text-[10px] text-[#5c6b5c] uppercase font-bold">Owner</span>
                 <span className="text-[#5c6b5c] font-bold text-sm">Bank</span>
              </div>
            )}
          </div>

          <div className="flex justify-between items-center pt-2 text-xs border-t border-[#c8bfa8]">
            <div className="flex flex-col items-center">
              <span className="text-[10px] text-[#5c6b5c] uppercase font-bold">Price</span>
              <span className="font-bold text-[#1a3a1a]">${propData.price}</span>
            </div>
            {propData.type === "property" && (
              <>
                <div className="flex flex-col items-center">
                  <span className="text-[10px] text-[#5c6b5c]">🏠</span>
                  <span className="font-bold text-[#1a3a1a]">${propData.houseCost}</span>
                </div>
                <div className="flex flex-col items-center">
                  <span className="text-[10px] text-[#5c6b5c]">🏨</span>
                  <span className="font-bold text-[#1a3a1a]">${propData.houseCost}</span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Dismiss backdrop */}
        <div
          className="fixed inset-0 z-[-1]"
          onClick={() => setSelectedPropertyId(null)}
        />
      </div>
    );
  };

  if (!gameState) {
    return <div className="text-[#1a3a1a] text-center py-20 animate-pulse font-bold" style={{ fontFamily: "'Georgia', serif" }}>Initializing Monopoly...</div>;
  }

  // Owned properties for the current user (derive from properties map)
  const myOwnedPropertyIds = Object.entries(gameState.properties)
    .filter(([_, prop]) => prop.ownerId === currentUserId)
    .map(([id, _]) => Number(id));

  return (
    <div className="w-full h-[calc(100vh-4rem)] p-6 flex gap-8 overflow-hidden" style={{ backgroundColor: '#d4c89e', fontFamily: "'Georgia', serif" }}>

      {/* LEFT/CENTER COLUMN: The Board */}
      <div className="flex-1 min-w-0 h-full flex items-center justify-center relative">
         <Board2D gameState={gameState} currentUserId={currentUserId} roomData={roomData} onPropertyClick={setSelectedPropertyId}>
            {/* 
              Everything here renders INSIDE the board's center 9×9 cell.
            */}

            {/* Premium CSS Dice synchronized from gameState */}
            <div className="flex items-center gap-6 relative z-50">
              <CssDice value={gameState.dice[0]} isRolling={!!gameState.isRolling} />
              <CssDice value={gameState.dice[1]} isRolling={!!gameState.isRolling} />
            </div>

            {/* Action Panel — sits below the dice */}
            <div className="mt-8 relative z-50">
               {renderActionPanel()}
            </div>
         </Board2D>

         {/* Popover Layer — floats above the board */}
         {renderPropertyPopover()}
      </div>

      {/* RIGHT COLUMN: Players, Trades, Properties */}
      <div className="w-[280px] flex flex-col gap-3 flex-shrink-0">
         {/* Players */}
         <div className="bg-[#f5f0e8] rounded-lg border-2 border-[#c8bfa8] overflow-hidden">
            <div className="p-2.5 border-b-2 border-[#c8bfa8] text-center font-bold text-[#1a3a1a] text-sm uppercase tracking-wider bg-[#e8e0d4]">
              Players
            </div>
            <div className="p-3 flex flex-col gap-2">
              {Object.values(gameState.players).map(p => {
                const isCurrentTurn = gameState.currentTurn === p.id;
                const avatarColor = roomData.playerAvatars?.[p.id] || "#475569";
                return (
                  <div
                    key={p.id}
                    className={`flex justify-between items-center p-2.5 rounded-md border transition-all ${
                      isCurrentTurn
                        ? 'bg-[#2e7d32]/10 border-[#2e7d32] ring-1 ring-[#2e7d32]/30'
                        : 'bg-white/60 border-[#c8bfa8]'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                       <div
                         className={`w-7 h-7 rounded-full flex items-center justify-center border-2 border-white ${isCurrentTurn ? 'animate-pulse' : ''}`}
                         style={{ backgroundColor: avatarColor, boxShadow: '0 1px 3px rgba(0,0,0,0.25)' }}
                       >
                         <div className="flex gap-[1px] mt-[3px]">
                           <div className="w-[3px] h-[3px] bg-white rounded-full" />
                           <div className="w-[3px] h-[3px] bg-white rounded-full" />
                         </div>
                       </div>
                       <div className="flex flex-col">
                         <span className="font-bold text-[#1a3a1a] text-xs truncate max-w-[100px]">
                           {roomData.playerNames[p.id] || "Player"}
                         </span>
                         {isCurrentTurn && (
                           <span className="text-[9px] text-[#2e7d32] font-bold uppercase">Playing</span>
                         )}
                       </div>
                    </div>
                    <span className="text-[#2e7d32] font-mono font-bold text-sm">${p.cash}</span>
                  </div>
                );
              })}
            </div>
         </div>

         {/* Trades */}
         <div className="bg-[#f5f0e8] rounded-lg border-2 border-[#c8bfa8] overflow-hidden">
            <div className="p-2.5 border-b-2 border-[#c8bfa8] flex justify-between items-center bg-[#e8e0d4]">
               <span className="font-bold text-[#1a3a1a] text-sm uppercase tracking-wider">Trades</span>
               <button className="bg-[#2e7d32] text-white hover:bg-[#256a29] px-2.5 py-1 rounded text-[10px] font-bold transition-colors uppercase tracking-wider">
                 + New
               </button>
            </div>
            <div className="text-[#5c6b5c] text-[10px] text-center p-4 italic">
               Trade properties and money with other players.
            </div>
         </div>

         {/* My Properties - stacked deed cards */}
         <div className="flex-1 bg-[#f5f0e8] rounded-lg border-2 border-[#c8bfa8] flex flex-col overflow-hidden">
            <div className="p-2.5 border-b-2 border-[#c8bfa8] text-center font-bold text-[#1a3a1a] text-sm uppercase tracking-wider bg-[#e8e0d4]">
               My Deeds ({myOwnedPropertyIds.length})
            </div>
            <div className="flex-1 p-2 flex flex-col gap-1 overflow-y-auto">
               {myOwnedPropertyIds.map(propId => {
                  const space = MONOPOLY_BOARD[propId];
                  const colorHex = space.colorGroup ? colorHexes[space.colorGroup] : "#5c6b5c";
                  return (
                     <div
                       key={propId}
                       className="flex items-center gap-2 bg-white/70 hover:bg-white p-2 rounded border border-[#c8bfa8] cursor-pointer transition-all group hover:translate-x-1"
                     >
                        <div
                          className="w-3 h-8 rounded-[2px] flex-shrink-0"
                          style={{ backgroundColor: colorHex }}
                        />
                        <div className="flex flex-col min-w-0">
                          <span className="font-bold text-[10px] text-[#1a3a1a] uppercase tracking-tight truncate">{space.name}</span>
                          <span className="text-[9px] text-[#5c6b5c] font-bold">${space.price}</span>
                        </div>
                     </div>
                  );
               })}
               {myOwnedPropertyIds.length === 0 && (
                  <div className="text-center text-[#5c6b5c] text-[11px] mt-4 italic">No deeds acquired yet</div>
               )}
            </div>
         </div>
      </div>
    </div>
  );
}
