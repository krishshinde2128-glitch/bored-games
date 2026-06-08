"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Room, GuessWhoGameState, updateGameState } from "@/lib/firebase/rooms";

const NAME_POOL = [
  "Alex", "Jordan", "Taylor", "Casey", "Morgan", "Riley", "Sam", "Jamie", "Quinn", "Avery",
  "Skyler", "Cameron", "Reese", "Blake", "Drew", "Parker", "Jesse", "Kendall", "Harper", "Rowan",
  "Peyton", "Logan", "Dylan", "Dakota", "Micah", "Finley", "Hayden", "Emerson", "Charlie", "Frankie",
  "River", "Ariel", "Sage", "Eden", "Rory", "Kai", "Milan", "Dallas", "Phoenix", "Ellis",
  "Onyx", "Lennon", "Robin", "Shawn", "Armani", "Remy", "Oakley", "Sutton", "Tatum", "Salem"
];

const YOUTUBER_POOL = [
  { id: "mrbeast", name: "MrBeast" },
  { id: "pewdiepie", name: "PewDiePie" },
  { id: "markiplier", name: "Markiplier" },
  { id: "mkbhd", name: "MKBHD" },
  { id: "caseyneistat", name: "Casey Neistat" },
  { id: "valkyrae", name: "Valkyrae" },
  { id: "pokimane", name: "Pokimane" },
  { id: "lazarbeam", name: "LazarBeam" },
  { id: "dantdm", name: "DanTDM" },
  { id: "ksi", name: "KSI" },
  { id: "loganpaul", name: "Logan Paul" },
  { id: "jakepaul", name: "Jake Paul" },
  { id: "w2s", name: "W2S" },
  { id: "miniminter", name: "Miniminter" },
  { id: "behzinga", name: "Behzinga" },
  { id: "vikkstar123", name: "Vikkstar123" },
  { id: "zerkaa", name: "Zerkaa" },
  { id: "tbjzl", name: "TBJZL" },
  { id: "ishowspeed", name: "IShowSpeed" },
  { id: "kaicenat", name: "Kai Cenat" },
  { id: "mrwhosetheboss", name: "MrWhoseTheBoss" },
  { id: "niko", name: "Niko Omilana" },
  { id: "chunkz", name: "Chunkz" },
  { id: "filly", name: "Yung Filly" },
  { id: "sharky", name: "Sharky" },
  { id: "ajshabeel", name: "AJ Shabeel" },
  { id: "dannyaarons", name: "Danny Aarons" },
  { id: "ludwig", name: "Ludwig" },
  { id: "bambino", name: "Bambino" },
  { id: "chrismd", name: "ChrisMD" },
  { id: "authertv", name: "AutherTV" },
  { id: "deji", name: "Deji" },
  { id: "dream", name: "Dream" },
  { id: "freya", name: "Freya Nightingale" },
  { id: "georgenotfound", name: "GeorgeNotFound" },
  { id: "moistcritikal", name: "MoistCr1tikal" },
  { id: "noahbeck", name: "Noah Beck" },
  { id: "stephentries", name: "Stephen Tries" },
  { id: "tenz", name: "TenZ" },
  { id: "theobaker", name: "Theo Baker" },
  { id: "lacy", name: "Lacy" },
  { id: "marlon", name: "Marlon" },
  { id: "taliamar", name: "Talia Mar" },
  { id: "faithkelly", name: "Faith Kelly" },
  { id: "xqc", name: "xQc" },
  { id: "randolph", name: "Randolph" }
];

interface GuessWhoProps {
  roomId: string;
  currentUserId: string;
  roomData: Room;
}

export function GuessWho({ roomId, currentUserId, roomData }: GuessWhoProps) {
  const [flippedCards, setFlippedCards] = useState<Set<string>>(new Set());
  const [isAccusationMode, setIsAccusationMode] = useState(false);

  useEffect(() => {
    if (!roomData.gameState && roomData.players[0] === currentUserId && roomData.players.length === 2) {
      const isYoutuber = roomData.settings?.deckEdition === "youtuber";
      
      let generatedCharacters = [];
      if (isYoutuber) {
        const shuffledYoutubers = [...YOUTUBER_POOL].sort(() => 0.5 - Math.random()).slice(0, 24);
        generatedCharacters = shuffledYoutubers.map((yt, index) => ({
          id: String(index + 1),
          name: yt.name,
          seed: yt.id
        }));
      } else {
        const shuffledNames = [...NAME_POOL].sort(() => 0.5 - Math.random()).slice(0, 24);
        generatedCharacters = shuffledNames.map((name, index) => ({
          id: String(index + 1),
          name: name,
          seed: name + "_" + Math.random().toString(36).substring(2, 8)
        }));
      }

      // Pick random distinct characters for P1 and P2
      const shuffled = [...generatedCharacters].sort(() => 0.5 - Math.random());
      const p1Char = shuffled[0].id;
      const p2Char = shuffled[1].id;
      
      updateGameState(roomId, {
        mysteryCharacters: {
          [roomData.players[0]]: p1Char,
          [roomData.players[1]]: p2Char
        },
        currentTurn: roomData.players[0], // P1 starts
        winner: null,
        boardCharacters: generatedCharacters
      });
    }
  }, [roomData.gameState, roomId, currentUserId, roomData.players, roomData.settings]);

  const gameState = roomData.gameState as GuessWhoGameState;
  
  if (!gameState || !gameState.mysteryCharacters || roomData.players.length < 2) {
    return <div className="text-center p-8 text-fiery-terracotta animate-pulse font-bold">Setting up suspects... (Waiting for 2 players)</div>;
  }

  const isPlayer1 = roomData.players[0] === currentUserId;
  const isPlayer2 = roomData.players[1] === currentUserId;
  const isSpectator = !isPlayer1 && !isPlayer2;
  const isMyTurn = gameState.currentTurn === currentUserId;
  
  const activeCharacters = gameState.boardCharacters || [];
  const isYoutuberEdition = roomData.settings?.deckEdition === "youtuber";
  
  const myCharacterId = gameState.mysteryCharacters[currentUserId];
  const opponentId = roomData.players.find(p => p !== currentUserId) || "";
  const myCharacter = activeCharacters.find(c => c.id === myCharacterId);

  const toggleFlip = (id: string) => {
    if (isSpectator || gameState.winner) return;

    if (isAccusationMode) {
      // Execute final guess
      if (!isMyTurn) return;
      
      const opponentCharId = gameState.mysteryCharacters[opponentId];
      let newWinner = null;
      if (id === opponentCharId) {
        newWinner = currentUserId; // Guessed right!
      } else {
        newWinner = opponentId; // Guessed wrong, opponent wins!
      }
      
      updateGameState(roomId, {
        ...gameState,
        winner: newWinner
      });
      setIsAccusationMode(false);
      return;
    }

    // Normal flip
    const newFlipped = new Set(flippedCards);
    if (newFlipped.has(id)) {
      newFlipped.delete(id);
    } else {
      newFlipped.add(id);
    }
    setFlippedCards(newFlipped);
  };

  const passTurn = async () => {
    if (!isMyTurn || isSpectator || gameState.winner) return;
    setIsAccusationMode(false);
    await updateGameState(roomId, {
      ...gameState,
      currentTurn: opponentId
    });
  };

  return (
    <div className={`flex flex-col items-center w-full max-w-5xl mx-auto ${isAccusationMode ? 'cursor-crosshair' : ''}`}>
      
      {/* Game Status Header */}
      <div className="mb-6 w-full flex flex-col md:flex-row items-center justify-between bg-dark-cyan/20 p-4 md:p-6 rounded-3xl border border-fiery-terracotta/30 backdrop-blur-md shadow-md gap-4">
        {gameState.winner ? (
          <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-espresso to-stormy-teal">
            {gameState.winner === currentUserId ? "You Cracked the Case!" : `${roomData.playerNames[gameState.winner] || 'Opponent'} Wins!`}
          </h2>
        ) : (
          <div className="flex items-center gap-4">
            <h2 className="text-xl md:text-2xl font-bold text-espresso">
              <span className={isMyTurn ? 'text-stormy-teal' : 'text-fiery-terracotta'}>
                {gameState.currentTurn === currentUserId ? "Your Turn" : `${roomData.playerNames[gameState.currentTurn] || 'Opponent'}'s Turn`}
              </span>
            </h2>
            {isMyTurn && !isSpectator && (
              <button 
                onClick={passTurn}
                className="px-6 py-2 bg-espresso text-wheat font-bold rounded-xl hover:bg-stormy-teal transition-colors shadow-sm"
              >
                Pass Turn
              </button>
            )}
          </div>
        )}

        {/* Accusation Mode Toggle */}
        {!isSpectator && !gameState.winner && isMyTurn && (
          <button
            onClick={() => setIsAccusationMode(!isAccusationMode)}
            className={`px-6 py-2 font-bold rounded-xl border-2 transition-all shadow-md ${
              isAccusationMode 
                ? 'bg-fiery-terracotta text-wheat border-fiery-terracotta animate-pulse' 
                : 'bg-wheat text-fiery-terracotta border-fiery-terracotta/30 hover:border-fiery-terracotta'
            }`}
          >
            {isAccusationMode ? 'Cancel Accusation' : 'Make Accusation!'}
          </button>
        )}
      </div>

      <div className="flex flex-col lg:flex-row gap-8 w-full items-start">
        {/* Main Board */}
        <div className={`flex-1 grid grid-cols-4 md:grid-cols-6 gap-3 md:gap-4 p-6 bg-wheat rounded-[2.5rem] border-4 transition-colors duration-500 shadow-xl ${
          isAccusationMode ? 'border-fiery-terracotta shadow-fiery-terracotta/20 bg-fiery-terracotta/5' : 'border-dark-cyan/30 shadow-dark-cyan/10'
        }`} style={{ perspective: "1000px" }}>
          
          {activeCharacters.map((char) => {
            const isFlipped = flippedCards.has(char.id);
            return (
              <motion.button
                key={char.id}
                onClick={() => toggleFlip(char.id)}
                disabled={isSpectator || !!gameState.winner}
                className="relative aspect-[3/4] w-full cursor-pointer"
                style={{ transformStyle: "preserve-3d", transformOrigin: "bottom center" }}
                animate={{
                  rotateX: isFlipped ? -85 : 0,
                  y: isFlipped ? 10 : 0,
                  filter: isFlipped ? 'brightness(0.4)' : 'brightness(1)'
                }}
                transition={{ type: "spring", stiffness: 200, damping: 20 }}
              >
                {/* The Card */}
                <div className="absolute inset-0 bg-white rounded-xl border-2 border-dark-cyan/30 shadow-md flex flex-col overflow-hidden backface-hidden">
                  <div className="bg-dark-cyan/10 p-0.5 border-b border-dark-cyan/20 h-[78%] flex items-center justify-center overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img 
                      src={
                        isYoutuberEdition
                          ? `/assets/guesswho/youtubers/${char.seed}.png`
                          : `https://api.dicebear.com/7.x/avataaars/svg?seed=${char.seed}&backgroundColor=transparent`
                      } 
                      alt={char.name} 
                      className="w-full h-full object-contain drop-shadow-sm" 
                      onError={(e) => {
                        if (isYoutuberEdition) {
                          e.currentTarget.src = `https://api.dicebear.com/7.x/initials/svg?seed=${char.name}&backgroundColor=transparent`;
                        }
                      }}
                    />
                  </div>
                  <div className="h-[22%] flex items-center justify-center bg-wheat text-espresso font-black tracking-tight text-[10px] xs:text-xs md:text-sm border-t-2 border-espresso/5 text-center px-1 leading-tight overflow-hidden">
                    {char.name}
                  </div>
                </div>
                
                {/* Back of Card (visible when flipped) */}
                <div 
                  className="absolute inset-0 bg-stormy-teal rounded-xl border-2 border-dark-cyan/50 shadow-inner flex items-center justify-center text-dark-cyan/20 text-4xl font-black"
                  style={{ transform: "rotateX(180deg) translateZ(1px)", backfaceVisibility: "hidden" }}
                >
                  ?
                </div>
              </motion.button>
            )
          })}
        </div>

        {/* My Character Card */}
        {!isSpectator && myCharacter && (
          <div className="w-full lg:w-64 bg-dark-cyan/20 border-2 border-dark-cyan/40 p-6 rounded-[2rem] shadow-lg sticky top-6 flex flex-col items-center">
            <h3 className="text-fiery-terracotta font-black text-xl mb-4 uppercase tracking-widest">You Are</h3>
            <div className="w-full aspect-[3/4] bg-white rounded-2xl border-4 border-espresso shadow-xl overflow-hidden flex flex-col">
              <div className="flex-1 bg-gradient-to-br from-wheat to-dark-cyan/20 p-1 flex items-center justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img 
                  src={
                    isYoutuberEdition
                      ? `/assets/guesswho/youtubers/${myCharacter.seed}.png`
                      : `https://api.dicebear.com/7.x/avataaars/svg?seed=${myCharacter.seed}&backgroundColor=transparent`
                  } 
                  alt={myCharacter.name} 
                  className="w-full h-full object-contain drop-shadow-lg" 
                  onError={(e) => {
                    if (isYoutuberEdition) {
                      e.currentTarget.src = `https://api.dicebear.com/7.x/initials/svg?seed=${myCharacter.name}&backgroundColor=transparent`;
                    }
                  }}
                />
              </div>
              <div className="h-16 flex items-center justify-center bg-espresso text-wheat font-black text-2xl tracking-tighter">
                {myCharacter.name}
              </div>
            </div>
            <p className="text-espresso font-semibold mt-6 text-center text-sm opacity-80">
              Answer Yes/No questions in the chat!
            </p>
          </div>
        )}
      </div>

    </div>
  );
}
