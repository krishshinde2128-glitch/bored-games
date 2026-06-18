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
  { id: "mrbeast", name: "MrBeast", folder: "youtubers" },
  { id: "pewdiepie", name: "PewDiePie", folder: "youtubers" },
  { id: "markiplier", name: "Markiplier", folder: "youtubers" },
  { id: "JackSucksAtLife", name: "JackSucksAtLife", folder: "youtubers/uk" },
  { id: "caseyneistat", name: "Casey Neistat", folder: "youtubers" },
  { id: "valkyrae", name: "Valkyrae", folder: "youtubers" },
  { id: "pokimane", name: "Pokimane", folder: "youtubers" },
  { id: "larzerbeam", name: "LazarBeam", folder: "youtubers/uk" },
  { id: "dantdm", name: "DanTDM", folder: "youtubers" },
  { id: "ksi", name: "KSI", folder: "youtubers/uk" },
  { id: "loganpaul", name: "Logan Paul", folder: "youtubers" },
  { id: "jakepaul", name: "Jake Paul", folder: "youtubers" },
  { id: "harry", name: "W2S", folder: "youtubers/uk" },
  { id: "simon", name: "Miniminter", folder: "youtubers/uk" },
  { id: "ethan", name: "Behzinga", folder: "youtubers/uk" },
  { id: "vik", name: "Vikkstar123", folder: "youtubers/uk" },
  { id: "josh", name: "Zerkaa", folder: "youtubers/uk" },
  { id: "tobi", name: "TBJZL", folder: "youtubers/uk" },
  { id: "ishowspeed", name: "IShowSpeed", folder: "youtubers" },
  { id: "kaicenat", name: "Kai Cenat", folder: "youtubers" },
  { id: "mrwhosetheboss", name: "MrWhoseTheBoss", folder: "youtubers/uk" },
  { id: "niko", name: "Niko Omilana", folder: "youtubers/uk" },
  { id: "chunkz", name: "Chunkz", folder: "youtubers/uk" },
  { id: "filly", name: "Yung Filly", folder: "youtubers/uk" },
  { id: "sharky", name: "Sharky", folder: "youtubers/uk" },
  { id: "aj", name: "AJ Shabeel", folder: "youtubers/uk" },
  { id: "dannyaarons", name: "Danny Aarons", folder: "youtubers/uk" },
  { id: "ludwig", name: "Ludwig", folder: "youtubers" },
  { id: "bambinobacky", name: "Bambino", folder: "youtubers/uk" },
  { id: "chrismd", name: "ChrisMD", folder: "youtubers/uk" },
  { id: "authertv", name: "AutherTV", folder: "youtubers/uk" },
  { id: "deji", name: "Deji", folder: "youtubers/uk" },
  { id: "dream", name: "Dream", folder: "youtubers" },
  { id: "freya", name: "Freya Nightingale", folder: "youtubers/uk" },
  { id: "georgeclarky", name: "George Clarky", folder: "youtubers/uk" },
  { id: "moistcritikal", name: "MoistCr1tikal", folder: "youtubers" },
  { id: "noahbeck", name: "Noah Beck", folder: "youtubers" },
  { id: "stephentries", name: "Stephen Tries", folder: "youtubers/uk" },
  { id: "tenz", name: "TenZ", folder: "youtubers" },
  { id: "theobaker", name: "Theo Baker", folder: "youtubers/uk" },
  { id: "lacy", name: "Lacy", folder: "youtubers" },
  { id: "marlon", name: "Marlon", folder: "youtubers" },
  { id: "taliamar", name: "Talia Mar", folder: "youtubers/uk" },
  { id: "faithkelly", name: "Faith Kelly", folder: "youtubers/uk" },
  { id: "xqc", name: "xQc", folder: "youtubers" },
  { id: "randolph", name: "Randolph", folder: "youtubers/uk" }
];

const YOUTUBER_UK_POOL = [
  { id: "josh", name: "Josh" },
  { id: "harry", name: "Harry" },
  { id: "vik", name: "Vik" },
  { id: "theobaker", name: "Theo Baker" },
  { id: "stephentries", name: "Stephen Tries" },
  { id: "taliamar", name: "Talia Mar" },
  { id: "tobi", name: "Tobi" },
  { id: "sharky", name: "Sharky" },
  { id: "randolph", name: "Randolph" },
  { id: "niko", name: "Niko" },
  { id: "mrwhosetheboss", name: "Mrwhosetheboss" },
  { id: "simon", name: "Simon" },
  { id: "larzerbeam", name: "Larzerbeam" },
  { id: "ksi", name: "KSI" },
  { id: "georgeclarky", name: "George Clarky" },
  { id: "faithkelly", name: "Faith Kelly" },
  { id: "deji", name: "Deji" },
  { id: "freya", name: "Freya" },
  { id: "dannyaarons", name: "Danny Aarons" },
  { id: "chunkz", name: "Chunkz" },
  { id: "chrismd", name: "Chris MD" },
  { id: "ethan", name: "Ethan" },
  { id: "bambinobacky", name: "Bambino Backy" },
  { id: "aj", name: "AJ" },
  { id: "authertv", name: "AutherTv" },
  { id: "filly", name: "Filly" },
  { id: "sweetanita", name: "Sweet Anita" },
  { id: "JME", name: "JME" },
  { id: "Lachlan", name: "Lachlan" },
  { id: "Ginge", name: "Ginge" },
  { id: "AB", name: "AB" },
  { id: "Callux", name: "Callux" },
  { id: "Calfreezy", name: "Calfreezy" },
  { id: "maxfosh", name: "Max Fosh" },
  { id: "JackSucksAtLife", name: "JackSucksAtLife" },
  { id: "Chip", name: "Chip" },
  { id: "willne", name: "WillNE" }
];

const YOUTUBER_USA_POOL = [
  // Add USA YouTubers here. (Make sure you put their PNG in public/assets/guesswho/youtubers/usa)
  { id: "mrbeast", name: "MrBeast" },
  { id: "loganpaul", name: "Logan Paul" },
];

const YOUTUBER_INDIA_POOL = [
  { id: "samay", name: "Samay" },
  { id: "tanmaybhat", name: "Tanmay Bhat" },
  { id: "carryminati", name: "CarryMinati" },
  { id: "beerbiceps", name: "BeerBiceps" },
  { id: "rebelkid", name: "Rebel Kid" },
  { id: "mostlysane", name: "MostlySane" },
  { id: "bbkivines", name: "BB Ki Vines" },
  { id: "ashishchanchlani", name: "Ashish Chanchlani" },
  { id: "triggeredinsaan", name: "Triggered Insaan" },
  { id: "harshbeniwal", name: "Harsh Beniwal" },
  { id: "abhyudaya", name: "Abhyudaya" },
  { id: "gautami", name: "Gautami" },
  { id: "mythpat", name: "Mythpat" },
  { id: "souravjoshi", name: "Sourav Joshi" },
  { id: "zakirkhan", name: "Zakir Khan" },
  { id: "rohanjoshi", name: "Rohan Joshi" },
  { id: "scout", name: "Scout" },
  { id: "pranitmore", name: "Pranit More" },
  { id: "gamerfleet", name: "GamerFleet" },
  { id: "fukrainsaan", name: "Fukra Insaan" },
  { id: "mortal", name: "Mortal" },
  { id: "elvishyadav", name: "Elvish Yadav" },
  { id: "thugesh", name: "Thugesh" },
  { id: "beyounick", name: "Be YouNick" }
];

const YOUTUBER_GAMING_POOL = [
  // Add Gaming YouTubers here. (Make sure you put their PNG in public/assets/guesswho/youtubers/gaming)
  { id: "pewdiepie", name: "PewDiePie" },
  { id: "ninja", name: "Ninja" },
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
      const deckEdition = roomData.settings?.deckEdition || "standard";
      const isYoutuber = deckEdition.startsWith("youtuber");
      
      let generatedCharacters: any[] = [];
      if (isYoutuber) {
        let pool: { id: string; name: string; folder?: string }[] = YOUTUBER_POOL;
        let folder = "youtubers";
        
        if (deckEdition === "youtuber_uk") { pool = YOUTUBER_UK_POOL; folder = "youtubers/uk"; }
        if (deckEdition === "youtuber_usa") { pool = YOUTUBER_USA_POOL; folder = "youtubers/usa"; }
        if (deckEdition === "youtuber_india") { pool = YOUTUBER_INDIA_POOL; folder = "youtubers/india"; }
        if (deckEdition === "youtuber_gaming") { pool = YOUTUBER_GAMING_POOL; folder = "youtubers/gaming"; }

        // If the pool is too small, fallback to the main list to prevent game crash
        if (pool.length < 2) pool = YOUTUBER_POOL;

        const shuffledYoutubers = [...pool].sort(() => 0.5 - Math.random()).slice(0, 24);
        generatedCharacters = shuffledYoutubers.map((yt: any, index) => ({
          id: String(index + 1),
          name: yt.name,
          seed: yt.id,
          folder: yt.folder || folder
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
      updateGameState(roomId, {
        status: "selecting",
        mysteryCharacters: {},
        currentTurn: roomData.players[0], // P1 starts conceptually, but updated upon playing
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
  const deckEdition = roomData.settings?.deckEdition || "standard";
  const isYoutuberEdition = deckEdition.startsWith("youtuber");
  
  const myCharacterId = gameState.mysteryCharacters[currentUserId];
  const opponentId = roomData.players.find(p => p !== currentUserId) || "";
  const myCharacter = activeCharacters.find(c => c.id === myCharacterId);

  const toggleFlip = async (id: string) => {
    if (isSpectator || gameState.winner) return;

    // Character Selection Logic
    if (gameState.status === "selecting") {
      const newMystery = { ...gameState.mysteryCharacters, [currentUserId]: id };
      
      let nextStatus: "selecting" | "playing" | "finished" = gameState.status as "selecting" | "playing" | "finished";
      let nextTurn: string = gameState.currentTurn;
      
      // If both have selected, transition to playing
      if (Object.keys(newMystery).length === 2) {
        nextStatus = "playing";
        // Decide first turn based on settings
        const firstTurnSetting = roomData.settings?.firstTurn || "random";
        if (firstTurnSetting === "random") {
          nextTurn = Math.random() > 0.5 ? roomData.players[0] : roomData.players[1];
        } else if (firstTurnSetting === "host") {
          nextTurn = roomData.hostId;
        } else {
          nextTurn = roomData.players.find(p => p !== roomData.hostId) || roomData.players[0];
        }
      }
      
      await updateGameState(roomId, {
        ...gameState,
        status: nextStatus,
        mysteryCharacters: newMystery,
        currentTurn: nextTurn
      });
      return;
    }

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
        {gameState.status === "selecting" ? (
          <div className="flex w-full items-center justify-center">
            <h2 className="text-2xl font-black text-espresso animate-pulse text-center">
              {gameState.mysteryCharacters[currentUserId] 
                ? "Waiting for opponent to pick..." 
                : "Select the character your opponent has to guess!"}
            </h2>
          </div>
        ) : gameState.winner ? (
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
        {gameState.status === "playing" && !isSpectator && !gameState.winner && isMyTurn && (
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
        <div className={`flex-1 grid grid-cols-4 md:grid-cols-6 gap-x-3 gap-y-8 md:gap-x-4 md:gap-y-10 p-6 bg-wheat rounded-[2.5rem] border-4 transition-colors duration-500 shadow-xl ${
          isAccusationMode ? 'border-fiery-terracotta shadow-fiery-terracotta/20 bg-fiery-terracotta/5' : 'border-dark-cyan/30 shadow-dark-cyan/10'
        }`} style={{ perspective: "1200px" }}>
          
          {activeCharacters.map((char) => {
            const isFlipped = flippedCards.has(char.id);
            const isMySelection = gameState.status === "selecting" && gameState.mysteryCharacters[currentUserId] === char.id;
            
            return (
              <div key={char.id} className="relative aspect-[3/4] w-full">
                {/* The Invisible Click Wrapper */}
                <button
                  onClick={() => toggleFlip(char.id)}
                  disabled={isSpectator || !!gameState.winner || (gameState.status === "selecting" && !!gameState.mysteryCharacters[currentUserId])}
                  className={`absolute inset-0 w-full h-full z-10 ${gameState.status === "selecting" && !gameState.mysteryCharacters[currentUserId] ? "cursor-pointer hover:scale-105 transition-transform" : "cursor-pointer"}`}
                  aria-label={`Toggle ${char.name}`}
                >
                  <span className="sr-only">Toggle card</span>
                </button>

                {/* The Animated Card */}
                <motion.div
                  className="w-full h-full pointer-events-none"
                  style={{ transformStyle: "preserve-3d", transformOrigin: "bottom center" }}
                  animate={{
                    rotateX: isFlipped && gameState.status === "playing" ? -80 : 0,
                    y: isFlipped && gameState.status === "playing" ? 25 : 0,
                    scale: isFlipped && gameState.status === "playing" ? 0.85 : 1,
                    filter: isFlipped && gameState.status === "playing" ? 'brightness(0.3)' : 'brightness(1)'
                  }}
                  transition={{ type: "spring", stiffness: 200, damping: 20 }}
                >
                  {/* Front of Card */}
                  <div className={`absolute inset-0 bg-white rounded-xl border-2 shadow-md flex flex-col overflow-hidden backface-hidden ${isMySelection ? 'border-stormy-teal shadow-[0_0_15px_#3d8b80]' : 'border-dark-cyan/30'}`}>
                    <div className="bg-dark-cyan/10 p-0.5 border-b border-dark-cyan/20 h-[78%] flex items-center justify-center overflow-hidden">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img 
                        src={
                          isYoutuberEdition
                            ? `/assets/guesswho/${char.folder || 'youtubers'}/${char.seed}.png`
                            : `https://api.dicebear.com/7.x/avataaars/svg?seed=${char.seed}&backgroundColor=transparent`
                        } 
                        alt={char.name} 
                        className="w-full h-full object-cover object-top drop-shadow-sm"
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
                </motion.div>
              </div>
            );
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
                      ? `/assets/guesswho/${myCharacter.folder || 'youtubers'}/${myCharacter.seed}.png`
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
