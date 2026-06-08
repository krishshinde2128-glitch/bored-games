import React from 'react';
import { MonopolyGameState, Room } from "@/lib/firebase/rooms";
import { MONOPOLY_BOARD } from "@/lib/monopolyData";

interface Board2DProps {
  gameState: MonopolyGameState;
  currentUserId: string;
  roomData: Room;
  onPropertyClick: (propertyId: number) => void;
  children?: React.ReactNode;
}

export function Board2D({ gameState, currentUserId, roomData, onPropertyClick, children }: Board2DProps) {
  const getGridArea = (id: number) => {
    if (id === 0) return { gridColumn: '11 / 12', gridRow: '11 / 12' };
    if (id > 0 && id < 10) return { gridColumn: `${11 - id} / ${12 - id}`, gridRow: '11 / 12' };
    if (id === 10) return { gridColumn: '1 / 2', gridRow: '11 / 12' };
    if (id > 10 && id < 20) return { gridColumn: '1 / 2', gridRow: `${21 - id} / ${22 - id}` };
    if (id === 20) return { gridColumn: '1 / 2', gridRow: '1 / 2' };
    if (id > 20 && id < 30) return { gridColumn: `${id - 19} / ${id - 18}`, gridRow: '1 / 2' };
    if (id === 30) return { gridColumn: '11 / 12', gridRow: '1 / 2' };
    if (id > 30 && id < 40) return { gridColumn: '11 / 12', gridRow: `${id - 29} / ${id - 28}` };
    return {};
  };

  // Color band logic removed as it's now handled inline via flexbox

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

  const getCornerContent = (id: number) => {
    switch (id) {
      case 0:
        return (
          <div className="flex flex-col items-center justify-center h-full w-full">
            <span className="text-[10px] md:text-xs font-black text-red-700 uppercase tracking-tight leading-none">Collect</span>
            <span className="text-sm md:text-base font-black text-red-700 leading-none">$200</span>
            <span className="text-[8px] md:text-[10px] font-extrabold text-slate-800 uppercase tracking-widest mt-0.5">← GO</span>
            <span className="text-lg md:text-xl mt-0.5">🏠</span>
          </div>
        );
      case 10:
        return (
          <div className="flex flex-col items-center justify-center h-full w-full p-1">
            <span className="text-lg md:text-xl mb-0.5">👮</span>
            <span className="text-[9px] md:text-[11px] font-black text-slate-800 uppercase tracking-tight leading-tight text-center">Jail /<br/>Just Visiting</span>
          </div>
        );
      case 20:
        return (
          <div className="flex flex-col items-center justify-center h-full w-full p-1">
            <span className="text-xl md:text-2xl mb-0.5">🅿️</span>
            <span className="text-[9px] md:text-[11px] font-black text-slate-800 uppercase tracking-tight leading-tight text-center">Free<br/>Parking</span>
          </div>
        );
      case 30:
        return (
          <div className="flex flex-col items-center justify-center h-full w-full p-1">
            <span className="text-lg md:text-xl mb-0.5">🚔</span>
            <span className="text-[9px] md:text-[11px] font-black text-slate-800 uppercase tracking-tight leading-tight text-center">Go To<br/>Jail</span>
          </div>
        );
      default:
        return null;
    }
  };

  const getSpecialIcon = (type: string, name: string) => {
    if (type === "chance") return <span className="text-sm md:text-base">❓</span>;
    if (type === "chest") return <span className="text-sm md:text-base">💰</span>;
    if (type === "tax") return <span className="text-sm md:text-base">{name.includes("Income") ? "💸" : "💎"}</span>;
    if (type === "railroad") return <span className="text-sm md:text-base">🚂</span>;
    if (type === "utility") return <span className="text-sm md:text-base">{name.includes("Electric") ? "💡" : "🚰"}</span>;
    return null;
  };

  return (
    /* 
     * The board sizes itself as a square constrained by BOTH the container 
     * height and width. max-h-full + max-w-full + aspect-square guarantees 
     * it picks whichever dimension is smaller, preventing overflow.
     */
    <div
      className="max-h-full max-w-full aspect-square relative grid grid-cols-11 grid-rows-11 border-[2px] border-[#1a3a1a] rounded-sm overflow-hidden"
      style={{
        gridTemplateColumns: 'repeat(11, minmax(0, 1fr))',
        gridTemplateRows: 'repeat(11, minmax(0, 1fr))',
        background: '#c8e6c9',
      }}
    >
      {MONOPOLY_BOARD.map((space) => {
        const isCorner = space.type === "corner";
        const colorHex = space.colorGroup ? colorHexes[space.colorGroup] : null;

        const playersOnSpace = Object.entries(gameState.players)
          .filter(([_, p]) => p.position === space.id)
          .map(([id, _]) => id);

        return (
          <div
            key={space.id}
            onClick={() => onPropertyClick(space.id)}
            className="relative flex flex-col items-center justify-center cursor-pointer group overflow-hidden"
            style={{
              ...getGridArea(space.id),
              backgroundColor: '#e8f5e9',
              borderWidth: '1px',
              borderColor: '#2e7d32',
              borderStyle: 'solid',
            }}
          >
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-150 z-20 pointer-events-none" />

            {isCorner ? (
              <div className="relative z-10 w-full h-full flex items-center justify-center">
                {getCornerContent(space.id)}
              </div>
            ) : (
              <div className={`absolute inset-0 z-10 flex flex-col w-full h-full ${
                space.id > 10 && space.id < 20 ? 'rotate-90' :
                space.id > 30 && space.id < 40 ? '-rotate-90' : ''
              }`}>
                {/* Color strip for bottom row and both side columns (which are rotated, so top faces center) */}
                {!(space.id > 20 && space.id < 30) && space.type === "property" && colorHex && (
                  <div className="h-4 md:h-5 w-full border-b-[2px] border-black/20 shrink-0" style={{ backgroundColor: colorHex }} />
                )}
                
                <div className={`flex-1 flex flex-col items-center justify-between text-center p-1 w-full min-h-0 ${space.id > 20 && space.id < 30 ? 'rotate-180' : ''}`}>
                  <div className="flex flex-col items-center w-full">
                    {getSpecialIcon(space.type, space.name)}
                    <span className="text-[9px] md:text-[10px] leading-none font-bold text-[#1a3a1a] uppercase tracking-tight w-full break-normal mt-0.5" style={{ fontFamily: "'Georgia', serif" }}>
                      {space.name}
                    </span>
                  </div>
                  {space.price && (
                    <span className="text-[10px] font-bold text-gray-800" style={{ fontFamily: "'Georgia', serif" }}>
                      ${space.price}
                    </span>
                  )}
                </div>

                {/* Color strip exclusively for top row (faces bottom toward center) */}
                {(space.id > 20 && space.id < 30) && space.type === "property" && colorHex && (
                  <div className="h-4 md:h-5 w-full border-t-[2px] border-black/20 shrink-0" style={{ backgroundColor: colorHex }} />
                )}
              </div>
            )}

            {playersOnSpace.length > 0 && (
              <div className="absolute bottom-1 right-1 flex items-center justify-end pointer-events-none z-30">
                <div className="flex flex-row items-center justify-end -space-x-2">
                  {playersOnSpace.map((pid) => {
                    const avatarStr = roomData.playerAvatars?.[pid] || "#475569";
                    const isUrl = avatarStr.startsWith('http');
                    const isCurrentTurn = gameState.currentTurn === pid;
                    const initial = roomData.playerNames[pid]?.charAt(0).toUpperCase() || "?";
                    
                    return (
                      <div
                        key={pid}
                        className={`w-5 h-5 md:w-6 md:h-6 rounded-full flex items-center justify-center border-[1.5px] border-white shadow-sm bg-white overflow-hidden transition-transform ${isCurrentTurn ? 'ring-2 ring-amber-400 ring-offset-1 z-20 scale-110' : 'z-10 hover:z-20'}`}
                      >
                        {isUrl ? (
                          <img src={avatarStr} alt={initial} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center font-bold text-white text-[9px] md:text-[10px]" style={{ backgroundColor: avatarStr }}>
                             {initial}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        );
      })}

      {/* Center space — the 9×9 inner area */}
      <div
        className="relative z-40 flex flex-col items-center justify-center"
        style={{
          gridColumn: '2 / 11',
          gridRow: '2 / 11',
          backgroundColor: '#c8e6c9',
        }}
        id="board-center"
      >
        {/* Monopoly title banner */}
        <div className="mb-4 select-none">
          <div className="bg-[#c41e3a] px-5 py-1.5 rounded-sm" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}>
            <span className="text-white font-black text-xl tracking-[0.15em] uppercase" style={{ fontFamily: "'Georgia', serif", textShadow: '1px 1px 2px rgba(0,0,0,0.3)' }}>
              MONOPOLY
            </span>
          </div>
        </div>

        {/* Children slot: dice canvas + action panel injected by parent */}
        {children}
      </div>
    </div>
  );
}
