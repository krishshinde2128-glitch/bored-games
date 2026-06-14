"use client";

import React, { useEffect, useState } from "react";
import { Room, MonopolyGameState, updateGameState, MonopolyPlayer } from "@/lib/firebase/rooms";
import { MONOPOLY_BOARD, CHANCE_DECK, CHEST_DECK } from "@/lib/monopolyData";
import { Board2D } from "./Board2D";
import { CssDice } from "./CssDice";
import TradeBuilder from "./TradeBuilder";
import TradeReview from "./TradeReview";
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
  const [auctionTimeLeft, setAuctionTimeLeft] = useState(0);
  const [showTradeBuilder, setShowTradeBuilder] = useState(false);

  useEffect(() => {
    if (gameState?.turnPhase === "AUCTION" && gameState.activeAuction) {
       const interval = setInterval(() => {
         setAuctionTimeLeft(Math.max(0, Math.ceil((gameState.activeAuction!.timerEnd - Date.now()) / 1000)));
       }, 200);
       return () => clearInterval(interval);
    }
  }, [gameState?.turnPhase, gameState?.activeAuction]);

  useEffect(() => {
    if (!isHost || !gameState || gameState.turnPhase !== "AUCTION" || !gameState.activeAuction) return;
    
    const interval = setInterval(() => {
       if (Date.now() > gameState.activeAuction!.timerEnd) {
          resolveAuction();
       }
    }, 1000);
    return () => clearInterval(interval);
  }, [isHost, gameState]);

  const resolveAuction = async () => {
    if (!gameState || !gameState.activeAuction) return;
    
    const auction = gameState.activeAuction;
    let nextState = { ...gameState, turnPhase: "MANAGEMENT" as const, activeAuction: null };
    
    if (auction.highestBidder) {
       const winner = nextState.players[auction.highestBidder];
       nextState.players = {
         ...nextState.players,
         [auction.highestBidder]: {
           ...winner,
           cash: winner.cash - auction.currentBid
         }
       };
       nextState.properties = {
         ...nextState.properties,
         [auction.propertyId]: {
           ownerId: auction.highestBidder,
           houses: 0,
           isMortgaged: false
         }
       };
    }
    
    await updateGameState(roomId, nextState);
  };

  const handleProposeTrade = async (trade: any) => {
    if (!gameState) return;
    await updateGameState(roomId, {
      ...gameState,
      activeTrade: { ...trade, status: "pending" }
    });
    setShowTradeBuilder(false);
  };

  const handleCancelTrade = async () => {
    if (!gameState) return;
    await updateGameState(roomId, { ...gameState, activeTrade: null });
  };

  const handleAcceptTrade = async () => {
    if (!gameState || !gameState.activeTrade) return;
    const trade = gameState.activeTrade;

    const offerer = gameState.players[trade.offererId];
    const receiver = gameState.players[trade.receiverId];

    let newProperties = { ...gameState.properties };

    // Transfer properties from offerer to receiver
    trade.offeredProperties.forEach((propId: number) => {
      newProperties[propId] = { ...newProperties[propId], ownerId: trade.receiverId };
    });

    // Transfer properties from receiver to offerer
    trade.requestedProperties.forEach((propId: number) => {
      newProperties[propId] = { ...newProperties[propId], ownerId: trade.offererId };
    });

    const nextState = {
      ...gameState,
      activeTrade: null,
      players: {
        ...gameState.players,
        [trade.offererId]: {
          ...offerer,
          cash: offerer.cash - trade.offeredCash + trade.requestedCash
        },
        [trade.receiverId]: {
          ...receiver,
          cash: receiver.cash + trade.offeredCash - trade.requestedCash
        }
      },
      properties: newProperties
    };

    await updateGameState(roomId, nextState);
  };

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

      let initialTurn = roomData.players[0];
      const firstTurnSetting = roomData.settings?.firstTurn || "random";
      if (firstTurnSetting === "random") {
        initialTurn = roomData.players[Math.floor(Math.random() * roomData.players.length)];
      } else if (firstTurnSetting === "host") {
        initialTurn = roomData.hostId;
      } else {
        initialTurn = roomData.players.find(p => p !== roomData.hostId) || roomData.players[0];
      }

      await updateGameState(roomId, {
        status: "playing",
        currentTurn: initialTurn,
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
           if (space.name === "Income Tax" || space.name === "Luxury Tax") {
             const taxAmt = space.taxAmount || 0;
             nextState.players[currentUserId].cash -= taxAmt;
             nextState.turnPhase = "MANAGEMENT";
           } else if (space.name === "Go To Jail") {
             nextState.players[currentUserId].inJail = true;
             nextState.players[currentUserId].position = 10;
             nextState.turnPhase = "MANAGEMENT";
           } else if (space.type === "chance" || space.type === "chest") {
             const deck = space.type === "chance" ? CHANCE_DECK : CHEST_DECK;
             const randomCard = deck[Math.floor(Math.random() * deck.length)];
             nextState.drawnCard = { type: space.type, id: randomCard.id };
             nextState.turnPhase = "ACTION"; // Waiting for acknowledgment
           } else {
             nextState.turnPhase = "MANAGEMENT";
           }
        } else if (space.type === "property" || space.type === "railroad" || space.type === "utility") {
           const propState = rollState.properties[newPos];
           if (propState && propState.ownerId && propState.ownerId !== currentUserId) {
              if (!propState.isMortgaged) {
                const ownerId = propState.ownerId;
                let rentAmount = 0;
                
                if (space.type === "property" && space.rent) {
                  const sameColorProps = MONOPOLY_BOARD.filter(s => s.colorGroup === space.colorGroup);
                  const isMonopoly = sameColorProps.every(s => rollState.properties[s.id]?.ownerId === ownerId);
                  if (propState.houses === 0 && isMonopoly) {
                    rentAmount = space.rent[0] * 2;
                  } else {
                    rentAmount = space.rent[propState.houses];
                  }
                } else if (space.type === "railroad" && space.rent) {
                  const rrCount = MONOPOLY_BOARD.filter(s => s.type === "railroad" && rollState.properties[s.id]?.ownerId === ownerId).length;
                  rentAmount = space.rent[Math.max(0, rrCount - 1)];
                } else if (space.type === "utility") {
                  const utilCount = MONOPOLY_BOARD.filter(s => s.type === "utility" && rollState.properties[s.id]?.ownerId === ownerId).length;
                  const diceTotal = d1 + d2;
                  rentAmount = utilCount === 2 ? diceTotal * 10 : diceTotal * 4;
                }
                
                nextState.players[currentUserId].cash -= rentAmount;
                if (nextState.players[ownerId]) {
                  nextState.players[ownerId].cash += rentAmount;
                }
              }
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

    const me = gameState.players[currentUserId];
    if (me.cash < 0) return;

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

  const handleStartAuction = async () => {
    if (!gameState || gameState.status !== "playing" || gameState.currentTurn !== currentUserId || gameState.turnPhase !== "ACTION") return;
    const me = gameState.players[currentUserId];
    const space = MONOPOLY_BOARD[me.position];
    if (!space.price) return;

    await updateGameState(roomId, {
      ...gameState,
      turnPhase: "AUCTION",
      activeAuction: {
        propertyId: me.position,
        currentBid: 10,
        highestBidder: null,
        timerEnd: Date.now() + 30000 // 30 seconds
      }
    });
  };

  const handleBid = async (amount: number) => {
    if (!gameState || gameState.status !== "playing" || gameState.turnPhase !== "AUCTION" || !gameState.activeAuction) return;
    
    const me = gameState.players[currentUserId];
    const newBid = gameState.activeAuction.currentBid + amount;
    
    if (me.cash >= newBid && gameState.activeAuction.highestBidder !== currentUserId) {
       await updateGameState(roomId, {
         ...gameState,
         activeAuction: {
           ...gameState.activeAuction,
           currentBid: newBid,
           highestBidder: currentUserId,
           timerEnd: Math.max(gameState.activeAuction.timerEnd, Date.now() + 10000) // add 10 seconds if bid
         }
       });
    }
  };

  const handleAcknowledgeCard = async () => {
    if (!gameState || !gameState.drawnCard || gameState.currentTurn !== currentUserId) return;
    
    const cardInfo = gameState.drawnCard;
    const deck = cardInfo.type === "chance" ? CHANCE_DECK : CHEST_DECK;
    const card = deck.find(c => c.id === cardInfo.id);
    if (!card) return;

    let me = { ...gameState.players[currentUserId] };
    
    if (card.action === "receive") {
      me.cash += (card.value || 0);
    } else if (card.action === "pay") {
      me.cash -= (card.value || 0);
    } else if (card.action === "advance") {
      const oldPos = me.position;
      me.position = card.value || 0;
      if (me.position < oldPos && me.position !== 10) me.cash += 200; // Passed GO (unless going to jail)
    } else if (card.action === "back") {
      me.position = (me.position - (card.value || 0) + 40) % 40;
    } else if (card.action === "jail") {
      me.position = 10;
      me.inJail = true;
    }

    await updateGameState(roomId, {
      ...gameState,
      drawnCard: null,
      turnPhase: "MANAGEMENT",
      players: {
        ...gameState.players,
        [currentUserId]: me
      }
    });
  };

  const handleBuildHouse = async (propertyId: number) => {
    if (!gameState || gameState.status !== "playing" || gameState.currentTurn !== currentUserId) return;
    const propState = gameState.properties[propertyId];
    if (!propState || propState.ownerId !== currentUserId) return;

    const propData = MONOPOLY_BOARD[propertyId];
    if (propData.type !== "property" || !propData.houseCost || propState.houses >= 5 || propState.isMortgaged) return;

    // Check if player owns all properties in the color group
    const sameColorProps = MONOPOLY_BOARD.filter(s => s.colorGroup === propData.colorGroup);
    const isMonopoly = sameColorProps.every(s => gameState.properties[s.id]?.ownerId === currentUserId);
    if (!isMonopoly) return;

    const me = gameState.players[currentUserId];
    if (me.cash >= propData.houseCost) {
      await updateGameState(roomId, {
        ...gameState,
        players: {
          ...gameState.players,
          [currentUserId]: {
            ...me,
            cash: me.cash - propData.houseCost
          }
        },
        properties: {
          ...gameState.properties,
          [propertyId]: {
            ...propState,
            houses: propState.houses + 1
          }
        }
      });
    }
  };

  const handleSellHouse = async (propertyId: number) => {
    if (!gameState || gameState.status !== "playing" || gameState.currentTurn !== currentUserId) return;
    const propState = gameState.properties[propertyId];
    if (!propState || propState.ownerId !== currentUserId) return;

    const propData = MONOPOLY_BOARD[propertyId];
    if (propData.type !== "property" || !propData.houseCost || propState.houses <= 0) return;

    const me = gameState.players[currentUserId];
    await updateGameState(roomId, {
      ...gameState,
      players: {
        ...gameState.players,
        [currentUserId]: {
          ...me,
          cash: me.cash + (propData.houseCost / 2)
        }
      },
      properties: {
        ...gameState.properties,
        [propertyId]: {
          ...propState,
          houses: propState.houses - 1
        }
      }
    });
  };

  const handleToggleMortgage = async (propertyId: number) => {
    if (!gameState || gameState.status !== "playing" || gameState.currentTurn !== currentUserId) return;
    const propState = gameState.properties[propertyId];
    if (!propState || propState.ownerId !== currentUserId) return;

    const propData = MONOPOLY_BOARD[propertyId];
    if (!propData.mortgageValue || propState.houses > 0) return; // Must sell houses first

    const me = gameState.players[currentUserId];
    let newCash = me.cash;
    
    if (propState.isMortgaged) {
       // Unmortgage: Pay mortgage value + 10%
       const unmortgageCost = Math.ceil(propData.mortgageValue * 1.1);
       if (me.cash >= unmortgageCost) {
         newCash -= unmortgageCost;
       } else {
         return; // Can't afford to unmortgage
       }
    } else {
       // Mortgage: Gain mortgage value
       newCash += propData.mortgageValue;
    }

    await updateGameState(roomId, {
      ...gameState,
      players: {
        ...gameState.players,
        [currentUserId]: {
          ...me,
          cash: newCash
        }
      },
      properties: {
        ...gameState.properties,
        [propertyId]: {
          ...propState,
          isMortgaged: !propState.isMortgaged
        }
      }
    });
  };

  const handleDeclareBankruptcy = async () => {
    if (!gameState || gameState.status !== "playing" || gameState.currentTurn !== currentUserId) return;
    const me = gameState.players[currentUserId];
    
    // Transfer all owned properties to bank
    const newProps = { ...gameState.properties };
    Object.keys(newProps).forEach(k => {
      const id = Number(k);
      if (newProps[id].ownerId === currentUserId) {
        newProps[id] = { ownerId: null, houses: 0, isMortgaged: false };
      }
    });

    const newPlayers = { ...gameState.players, [currentUserId]: { ...me, isBankrupt: true, cash: 0, position: -1 } };
    
    // Check if game over (only 1 player not bankrupt)
    const activePlayers = Object.values(newPlayers).filter(p => !p.isBankrupt);
    if (activePlayers.length === 1) {
       await updateGameState(roomId, {
         ...gameState,
         status: "finished",
         winner: activePlayers[0].id,
         players: newPlayers,
         properties: newProps
       });
       return;
    }

    // Pass turn
    const pList = roomData.players;
    let currentIndex = pList.indexOf(currentUserId);
    let nextTurn = currentUserId;
    do {
      currentIndex = (currentIndex + 1) % pList.length;
    } while (newPlayers[pList[currentIndex]]?.isBankrupt && currentIndex !== pList.indexOf(currentUserId));
    nextTurn = pList[currentIndex];

    await updateGameState(roomId, {
      ...gameState,
      currentTurn: nextTurn,
      turnPhase: "ROLL",
      players: newPlayers,
      properties: newProps
    });
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
        {gameState.turnPhase === "AUCTION" && gameState.activeAuction ? (
              <div className="flex flex-col gap-2.5 items-center bg-[#f5f0e8] p-4 rounded-md border-2 border-[#1a3a1a] shadow-lg w-[280px]">
                 <div className="text-center font-black uppercase text-[#1a3a1a]">
                   Auction: {MONOPOLY_BOARD[gameState.activeAuction.propertyId].name}
                 </div>
                 <div className="flex justify-between w-full text-sm font-bold border-b border-[#c8bfa8] pb-2">
                   <span>Current Bid: <span className="text-[#2e7d32]">${gameState.activeAuction.currentBid}</span></span>
                   <span className={`${auctionTimeLeft <= 5 ? 'text-[#c41e3a] animate-pulse' : 'text-[#1a3a1a]'}`}>Time: {auctionTimeLeft}s</span>
                 </div>
                 
                 <div className="flex gap-2 w-full pt-2">
                   <button 
                     onClick={() => handleBid(10)}
                     disabled={me.cash < gameState.activeAuction!.currentBid + 10}
                     className="flex-1 bg-[#2e7d32] hover:bg-[#256a29] disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-2 rounded-md transition-all active:scale-95"
                   >
                     +$10
                   </button>
                   <button 
                     onClick={() => handleBid(50)}
                     disabled={me.cash < gameState.activeAuction!.currentBid + 50}
                     className="flex-1 bg-[#2e7d32] hover:bg-[#256a29] disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-2 rounded-md transition-all active:scale-95"
                   >
                     +$50
                   </button>
                   <button 
                     onClick={() => handleBid(100)}
                     disabled={me.cash < gameState.activeAuction!.currentBid + 100}
                     className="flex-1 bg-[#2e7d32] hover:bg-[#256a29] disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-2 rounded-md transition-all active:scale-95"
                   >
                     +$100
                   </button>
                 </div>
                 
                 {gameState.activeAuction.highestBidder === currentUserId ? (
                   <div className="text-[#2e7d32] text-xs font-bold mt-1 tracking-wider uppercase">You are winning!</div>
                 ) : gameState.activeAuction.highestBidder ? (
                   <div className="text-[#c41e3a] text-xs font-bold mt-1 tracking-wider uppercase">{roomData.playerNames[gameState.activeAuction.highestBidder]} is winning!</div>
                 ) : (
                   <div className="text-[#5c6b5c] text-xs font-bold mt-1 tracking-wider uppercase">No bids yet</div>
                 )}
              </div>
        ) : !isMyTurn ? (
          <div className="flex items-center gap-2 bg-white/80 backdrop-blur-sm px-4 py-2 rounded-lg border border-[#2e7d32]/30">
             <div
                className="w-5 h-5 rounded-full border-[1.5px] border-white"
                style={{
                  backgroundColor: roomData.playerAvatars?.[gameState.currentTurn] || "#475569",
                  boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
                }}
             />
             <span className="text-[#1a3a1a] font-bold text-sm">
               {roomData.playerNames[gameState.currentTurn]} is playing...
             </span>
          </div>
        ) : (
          <>
            {gameState.turnPhase === "ROLL" && (
              <button
                onClick={handleRollDice}
                className="bg-[#c41e3a] hover:bg-[#a91830] px-6 py-2.5 rounded-md text-white font-bold text-base tracking-wide transform transition-all active:scale-95 flex items-center gap-2 border border-[#8b1528]"
              >
                <Dices size={20} />
                Roll Dice
              </button>
            )}

            {gameState.turnPhase === "ACTION" && !gameState.drawnCard && (
              <div className="flex flex-col gap-2.5 items-center">
                 <div className="text-[#1a3a1a] text-sm font-bold bg-white/90 backdrop-blur-sm px-5 py-2 rounded-md border border-[#2e7d32]/30">
                   Landed on {space.name}
                 </div>
                 <div className="flex gap-3">
                    <button onClick={handleBuyProperty} className="bg-[#2e7d32] hover:bg-[#256a29] px-6 py-2.5 rounded-md text-white font-bold border border-[#1a5c1f] transition-all active:scale-95">
                      Buy (${space.price})
                    </button>
                    <button onClick={handleStartAuction} className="bg-[#c41e3a] hover:bg-[#a91830] px-6 py-2.5 rounded-md text-white font-bold border border-[#8b1528] transition-all active:scale-95">
                      Auction
                    </button>
                 </div>
              </div>
            )}

            {gameState.turnPhase === "ACTION" && gameState.drawnCard && (
              <div className="flex flex-col gap-2.5 items-center max-w-[280px]">
                 <div className={`w-full p-4 rounded-md border-2 shadow-lg ${gameState.drawnCard.type === 'chance' ? 'bg-[#ff9800] border-[#e65100]' : 'bg-[#fff176] border-[#fbc02d]'}`}>
                   <div className="font-black uppercase text-center mb-2 text-[#1a3a1a] text-lg tracking-wider">
                     {gameState.drawnCard.type === 'chance' ? 'CHANCE' : 'COMMUNITY CHEST'}
                   </div>
                   <div className="text-center font-bold text-[#1a3a1a] text-sm">
                     {(() => {
                       const deck = gameState.drawnCard.type === "chance" ? CHANCE_DECK : CHEST_DECK;
                       const card = deck.find(c => c.id === gameState.drawnCard!.id);
                       return card ? card.text : "";
                     })()}
                   </div>
                 </div>
                 {me.id === currentUserId && (
                   <button onClick={handleAcknowledgeCard} className="bg-[#2e7d32] hover:bg-[#256a29] px-8 py-2.5 rounded-md text-white font-bold border border-[#1a5c1f] transition-all active:scale-95">
                     OK
                   </button>
                 )}
              </div>
            )}

            {gameState.turnPhase === "MANAGEMENT" && (
              <div className="flex flex-col gap-3">
                <button
                  onClick={handleEndTurn}
                  disabled={me.cash < 0}
                  className="bg-[#1a3a1a] hover:bg-[#0f2d0f] disabled:opacity-50 disabled:cursor-not-allowed px-8 py-3 rounded-md text-white font-bold text-base tracking-wider transform transition-all active:scale-95 border border-[#2e7d32]"
                >
                  {me.cash < 0 ? `Must Raise Cash ($${Math.abs(me.cash)})` : "End Turn"}
                </button>

                {me.cash < 0 && (
                  <button
                    onClick={handleDeclareBankruptcy}
                    className="bg-[#c41e3a] hover:bg-[#a91830] px-8 py-3 rounded-md text-white font-bold text-sm tracking-wider transform transition-all active:scale-95 border border-[#8b1528]"
                  >
                    Declare Bankruptcy
                  </button>
                )}
              </div>
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

    // Positioning logic relative to the 9x9 center area
    let posStyle: React.CSSProperties = { position: 'absolute', zIndex: 100 };
    let arrowStyle: React.CSSProperties = {};
    let arrowClass = "absolute w-0 h-0 border-8 border-transparent pointer-events-none";
    const id = selectedPropertyId;

    if (id > 0 && id < 10) {
      posStyle.bottom = '0px';
      posStyle.marginBottom = '16px';
      arrowClass += " top-full border-t-[#262b40]";
      if (id >= 5) {
        posStyle.left = `calc(${(9 - id) * 100 / 9}%)`;
        arrowStyle.left = '24px';
      } else {
        posStyle.right = `calc(${(id - 1) * 100 / 9}%)`;
        arrowStyle.right = '24px';
      }
    } else if (id > 10 && id < 20) {
      posStyle.left = '0px';
      posStyle.marginLeft = '16px';
      arrowClass += " right-full border-r-[#262b40]";
      if (id >= 15) {
        posStyle.top = `calc(${(19 - id) * 100 / 9}%)`;
        arrowStyle.top = '24px';
      } else {
        posStyle.bottom = `calc(${(id - 11) * 100 / 9}%)`;
        arrowStyle.bottom = '24px';
      }
    } else if (id > 20 && id < 30) {
      posStyle.top = '0px';
      posStyle.marginTop = '16px';
      arrowClass += " bottom-full";
      if (id <= 25) {
        posStyle.left = `calc(${(id - 21) * 100 / 9}%)`;
        arrowStyle.left = '24px';
      } else {
        posStyle.right = `calc(${(29 - id) * 100 / 9}%)`;
        arrowStyle.right = '24px';
      }
    } else if (id > 30 && id < 40) {
      posStyle.right = '0px';
      posStyle.marginRight = '16px';
      arrowClass += " left-full border-l-[#262b40]";
      if (id <= 35) {
        posStyle.top = `calc(${(id - 31) * 100 / 9}%)`;
        arrowStyle.top = '24px';
      } else {
        posStyle.bottom = `calc(${(39 - id) * 100 / 9}%)`;
        arrowStyle.bottom = '24px';
      }
    }

    return (
      <div 
        className="w-[260px] bg-[#262b40] rounded-xl shadow-2xl animate-in fade-in zoom-in-95 duration-200 flex flex-col p-4 font-sans"
        style={{ 
          ...posStyle, 
          borderTop: propData.type === 'property' ? `6px solid ${headerColor}` : '6px solid #3b4261' 
        }}
      >
        <div className={arrowClass} style={{ ...arrowStyle, ...(id > 20 && id < 30 ? { borderBottomColor: propData.type === 'property' ? headerColor : '#3b4261' } : {}) }} />

        <div className="flex flex-col items-center gap-2 mb-4">
           {propData.type === "railroad" && <span className="text-4xl drop-shadow-md">✈️</span>}
           {propData.type === "utility" && <span className="text-4xl drop-shadow-md">💡</span>}
           <h2 className="text-white font-bold text-[22px] text-center leading-tight tracking-tight">
             {propData.name}
           </h2>
        </div>

        {/* Actions */}
        {propState?.ownerId === currentUserId && (
          <div className="flex flex-col gap-2 mb-4">
            <button 
              onClick={() => handleToggleMortgage(selectedPropertyId)}
              disabled={propState.houses > 0 || gameState.currentTurn !== currentUserId}
              className={`w-full py-2.5 rounded-lg font-bold text-sm flex items-center justify-center gap-2 transition-transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed ${
                propState.isMortgaged 
                ? 'bg-[#2e7d32] text-white hover:bg-[#256a29]' 
                : 'bg-[#d49a26] text-white hover:bg-[#b8851f]'
              }`}
            >
               <span>{propState.isMortgaged ? "Unmortgage" : `Mortgage for $${propData.mortgageValue}`}</span>
            </button>
            
            {propData.type === "property" && (
              <div className="flex gap-2 mt-1">
                 <button 
                   onClick={() => handleBuildHouse(selectedPropertyId)}
                   disabled={propState.houses >= 5 || propState.isMortgaged || gameState.currentTurn !== currentUserId}
                   className="flex-1 bg-[#4b5563] text-white py-2 rounded-lg font-bold disabled:opacity-50 transition-colors flex items-center justify-center gap-1 hover:bg-[#374151]"
                 >
                   <span>+</span><span>🏠</span>
                 </button>
                 <button 
                   onClick={() => handleSellHouse(selectedPropertyId)}
                   disabled={propState.houses <= 0 || gameState.currentTurn !== currentUserId}
                   className="flex-none w-12 bg-[#8b5cf6] text-white py-2 rounded-lg font-bold disabled:opacity-50 transition-colors flex items-center justify-center hover:bg-[#7c3aed]"
                 >
                   <Trash2 size={16} />
                 </button>
              </div>
            )}
          </div>
        )}

        {/* Rent Schedule */}
        <div className="flex flex-col gap-2">
           <div className="flex justify-between text-[#8b92b2] text-[13px] border-b border-[#3b4261] pb-1 mb-1">
             <span>when</span>
             <span>get</span>
           </div>
           
           {propData.type === "railroad" ? (
             <>
                <div className="flex justify-between text-slate-200 text-sm"><span>1 railroad is owned</span><span className="font-mono text-[#8b92b2]">$<span className="text-slate-200 ml-1">{propData.rent?.[0]}</span></span></div>
                <div className="flex justify-between text-slate-200 text-sm"><span>2 railroads are owned</span><span className="font-mono text-[#8b92b2]">$<span className="text-slate-200 ml-1">{propData.rent?.[1]}</span></span></div>
                <div className="flex justify-between text-slate-200 text-sm"><span>3 railroads are owned</span><span className="font-mono text-[#8b92b2]">$<span className="text-slate-200 ml-1">{propData.rent?.[2]}</span></span></div>
                <div className="flex justify-between text-slate-200 text-sm"><span>4 railroads are owned</span><span className="font-mono text-[#8b92b2]">$<span className="text-slate-200 ml-1">{propData.rent?.[3]}</span></span></div>
             </>
           ) : propData.type === "utility" ? (
             <>
                <div className="flex justify-between text-slate-200 text-sm"><span>1 utility is owned</span><span className="text-slate-200 ml-1">4x dice</span></div>
                <div className="flex justify-between text-slate-200 text-sm"><span>2 utilities are owned</span><span className="text-slate-200 ml-1">10x dice</span></div>
             </>
           ) : (
             <>
                <div className="flex justify-between text-slate-200 text-sm"><span>Base rent</span><span className="font-mono text-[#8b92b2]">$<span className="text-slate-200 ml-1">{propData.rent?.[0]}</span></span></div>
                <div className="flex justify-between text-slate-200 text-sm"><span>With 1 house</span><span className="font-mono text-[#8b92b2]">$<span className="text-slate-200 ml-1">{propData.rent?.[1]}</span></span></div>
                <div className="flex justify-between text-slate-200 text-sm"><span>With 2 houses</span><span className="font-mono text-[#8b92b2]">$<span className="text-slate-200 ml-1">{propData.rent?.[2]}</span></span></div>
                <div className="flex justify-between text-slate-200 text-sm"><span>With 3 houses</span><span className="font-mono text-[#8b92b2]">$<span className="text-slate-200 ml-1">{propData.rent?.[3]}</span></span></div>
                <div className="flex justify-between text-slate-200 text-sm"><span>With 4 houses</span><span className="font-mono text-[#8b92b2]">$<span className="text-slate-200 ml-1">{propData.rent?.[4]}</span></span></div>
                <div className="flex justify-between text-slate-200 text-sm"><span>With HOTEL</span><span className="font-mono text-[#8b92b2]">$<span className="text-slate-200 ml-1">{propData.rent?.[5]}</span></span></div>
             </>
           )}
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center mt-5 pt-3 relative">
           <div className="absolute top-0 left-[20%] right-[20%] h-[1px] bg-[#3b4261]"></div>
           <div className="flex flex-col items-center flex-1">
             <span className="text-[#8b92b2] text-[13px] mb-1">Owner</span>
             {ownerName ? (
               <div className="flex items-center gap-1.5">
                 {ownerAvatar && <div className="w-4 h-4 rounded-full shadow-sm" style={{ backgroundColor: ownerAvatar }}></div>}
                 <span className="text-white font-bold text-sm">{ownerName}</span>
               </div>
             ) : (
               <span className="text-white font-bold text-sm">None</span>
             )}
           </div>
           
           <div className="flex flex-col items-center flex-1">
             <span className="text-[#8b92b2] text-[13px] mb-1">Price</span>
             <span className="text-white font-bold text-[17px] leading-none mt-1">
               <span className="font-mono font-normal text-[#8b92b2] mr-1">$</span>{propData.price}
             </span>
           </div>
        </div>

        {/* Dismiss backdrop */}
        <div className="fixed inset-0 z-[-1]" onClick={() => setSelectedPropertyId(null)} />
      </div>
    );
  };

  if (!gameState) {
    return <div className="text-[#1a3a1a] text-center py-20 animate-pulse font-bold">Initializing Monopoly...</div>;
  }

  // Owned properties for the current user (derive from properties map)
  const myOwnedPropertyIds = Object.entries(gameState.properties)
    .filter(([_, prop]) => prop.ownerId === currentUserId)
    .map(([id, _]) => Number(id));

  return (
    <div className="w-full h-[calc(100vh-4rem)] p-1 md:p-2 flex gap-2 overflow-hidden" style={{ backgroundColor: '#d4c89e' }}>

      {/* LEFT/CENTER COLUMN: The Board */}
      <div className="flex-1 min-w-0 h-full bg-[#c8e6c9]/50 rounded-lg shadow-inner flex items-center justify-center overflow-hidden">
         {/* Scales to fully fill the container, stretching horizontally to use all PC screen space */}
         <div className="w-full h-full relative shadow-2xl rounded-sm">
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

              {/* Render popover INSIDE the 9x9 center board so it can anchor to cells */}
              {renderPropertyPopover()}
           </Board2D>
         </div>
      </div>

      {/* RIGHT COLUMN: Players, Trades, Properties */}
      <div className="w-[280px] md:w-[320px] lg:w-[360px] h-full flex flex-col gap-4 flex-shrink-0">
        
        {/* Players List */}
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
               <button 
                 onClick={() => {
                   if (gameState.currentTurn !== currentUserId || (gameState.turnPhase !== "ACTION" && gameState.turnPhase !== "MANAGEMENT")) {
                     alert("You can only propose trades during the ACTION or MANAGEMENT phase of your own turn.");
                     return;
                   }
                   if (gameState.activeTrade) {
                     alert("There is already an active trade pending.");
                     return;
                   }
                   setShowTradeBuilder(true);
                 }} 
                 className="bg-[#2e7d32] text-white hover:bg-[#256a29] px-2.5 py-1 rounded text-[10px] font-bold transition-colors uppercase tracking-wider"
               >
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
                       onClick={() => setSelectedPropertyId(propId)}
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

      {/* Trade Modals */}
      {showTradeBuilder && (
        <TradeBuilder
          currentUserId={currentUserId}
          players={gameState.players}
          properties={gameState.properties}
          playerNames={roomData.playerNames}
          onProposeTrade={handleProposeTrade}
          onCancel={() => setShowTradeBuilder(false)}
        />
      )}

      {gameState.activeTrade && (
        <TradeReview
          currentUserId={currentUserId}
          trade={gameState.activeTrade}
          playerNames={roomData.playerNames}
          properties={gameState.properties}
          onAccept={handleAcceptTrade}
          onDecline={handleCancelTrade}
          onCancel={handleCancelTrade}
        />
      )}
    </div>
  );
}
