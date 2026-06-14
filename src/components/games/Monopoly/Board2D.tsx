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
  // Step-by-step path animation state
  const [visualPos, setVisualPos] = React.useState<Record<string, number>>(() => {
    const init: Record<string, number> = {};
    if (gameState?.players) {
      Object.entries(gameState.players).forEach(([pid, p]) => {
        init[pid] = p.position;
      });
    }
    return init;
  });

  const [targetPos, setTargetPos] = React.useState<Record<string, number>>(() => {
    const init: Record<string, number> = {};
    if (gameState?.players) {
      Object.entries(gameState.players).forEach(([pid, p]) => {
        init[pid] = p.position;
      });
    }
    return init;
  });

  // Calculate target absolute positions based on circular distance
  React.useEffect(() => {
    if (!gameState?.players) return;
    setTargetPos(prev => {
      const next = { ...prev };
      let changed = false;
      Object.entries(gameState.players).forEach(([pid, p]) => {
        const currentTarget = next[pid] ?? p.position;
        const normalizedTarget = ((currentTarget % 40) + 40) % 40; 
        
        const forwardDist = (p.position - normalizedTarget + 40) % 40;
        const backwardDist = (normalizedTarget - p.position + 40) % 40;

        if (forwardDist !== 0) {
           changed = true;
           if (p.inJail && p.position === 10) {
               // Teleport to jail directly
               next[pid] = currentTarget + forwardDist;
               setVisualPos(v => ({...v, [pid]: currentTarget + forwardDist}));
           } else if (backwardDist <= 3 && backwardDist > 0) {
               // Animate backwards for chance cards like "Go back 3 spaces"
               next[pid] = currentTarget - backwardDist;
           } else {
               // Animate forward
               next[pid] = currentTarget + forwardDist;
           }
        }
      });
      return changed ? next : prev;
    });
  }, [gameState.players]);

  // Animation sync loop: Moves visual position 1 step at a time towards target
  React.useEffect(() => {
    const interval = setInterval(() => {
      setVisualPos(prev => {
        let changed = false;
        const next = { ...prev };
        Object.entries(targetPos).forEach(([pid, target]) => {
           const current = next[pid] ?? target;
           if (current < target) {
              changed = true;
              next[pid] = current + 1;
           } else if (current > target) {
              changed = true;
              next[pid] = current - 1;
           }
        });
        return changed ? next : prev;
      });
    }, 120); // 120ms per square
    return () => clearInterval(interval);
  }, [targetPos]);

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
          <div className="flex flex-col items-center justify-center h-full w-full p-1 text-center">
            <span className="text-[8px] md:text-[10px] font-black text-red-700 uppercase tracking-tighter leading-none mb-[1px]">Collect</span>
            <span className="text-[11px] md:text-xs font-black text-red-700 leading-none mb-0.5">$200</span>
            <span className="text-[7px] md:text-[8px] font-extrabold text-slate-800 uppercase tracking-widest leading-none mb-0.5">← GO</span>
            <span className="text-sm md:text-base leading-none mt-0.5">🏠</span>
          </div>
        );
      case 10:
        return (
          <div className="flex flex-col items-center justify-center h-full w-full p-1">
            <span className="text-lg md:text-xl mb-0.5">👮</span>
            <span className="text-[9px] md:text-[11px] font-black text-slate-800 uppercase tracking-tight leading-tight text-center">Jail</span>
          </div>
        );
      case 20:
        return (
          <div className="flex flex-col items-center justify-center h-full w-full p-1">
            <span className="text-xl md:text-2xl mb-0.5">🅿️</span>
            <span className="text-[9px] md:text-[11px] font-black text-slate-800 uppercase tracking-tight leading-tight text-center">Parking</span>
          </div>
        );
      case 30:
        return (
          <div className="flex flex-col items-center justify-center h-full w-full p-1">
            <span className="text-lg md:text-xl mb-0.5">🚔</span>
            <span className="text-[9px] md:text-[11px] font-black text-slate-800 uppercase tracking-tight leading-tight text-center">Go<br/>Jail</span>
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
    <div
      className="w-full h-full relative grid grid-cols-11 grid-rows-11 border-[2px] border-[#1a3a1a] rounded-sm"
      style={{
        gridTemplateColumns: 'repeat(11, minmax(0, 1fr))',
        gridTemplateRows: 'repeat(11, minmax(0, 1fr))',
        background: '#c8e6c9',
      }}
    >
      {MONOPOLY_BOARD.map((space) => {
        const isCorner = space.type === "corner";
        const colorHex = space.colorGroup ? colorHexes[space.colorGroup] : null;

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
              <>
                {space.type === "property" && colorHex && (() => {
                  const propState = gameState.properties[space.id];
                  const ownerId = propState?.ownerId;
                  let stripColor = colorHex;
                  
                  if (ownerId && roomData.playerAvatars?.[ownerId]) {
                    const av = roomData.playerAvatars[ownerId];
                    if (av.startsWith('#') || av.startsWith('rgb') || av.startsWith('hsl')) {
                      stripColor = av;
                    }
                  }

                  return (
                    <div 
                      className="absolute border-black/20 z-10 transition-colors duration-300"
                      style={{
                        backgroundColor: stripColor,
                        ...(space.id > 0 && space.id < 10 ? { top: 0, left: 0, right: 0, height: '22%', borderBottomWidth: '2px' } : {}),
                        ...(space.id > 10 && space.id < 20 ? { top: 0, right: 0, bottom: 0, width: '22%', borderLeftWidth: '2px' } : {}),
                        ...(space.id > 20 && space.id < 30 ? { top: 0, left: 0, right: 0, height: '22%', borderBottomWidth: '2px' } : {}),
                        ...(space.id > 30 && space.id < 40 ? { top: 0, left: 0, bottom: 0, width: '22%', borderRightWidth: '2px' } : {})
                      }}
                    />
                  );
                })()}
                
                <div className={`absolute inset-0 z-20 flex flex-col w-full h-full ${
                  space.id > 10 && space.id < 20 ? 'rotate-90' :
                  space.id > 30 && space.id < 40 ? '-rotate-90' : ''
                }`}>
                  {/* Houses Row */}
                  {gameState.properties[space.id]?.houses > 0 && (
                    <div className="absolute top-[2px] md:top-1 left-0 w-full flex items-center justify-center gap-[2px] z-30 px-1 pointer-events-none">
                       {gameState.properties[space.id].houses === 5 ? (
                          <div className="text-[14px] md:text-[18px] drop-shadow-md leading-none select-none">🏨</div>
                       ) : (
                          Array.from({ length: gameState.properties[space.id].houses }).map((_, i) => (
                            <div key={i} className="text-[10px] md:text-[14px] drop-shadow-md leading-none select-none">🏠</div>
                          ))
                       )}
                    </div>
                  )}

                  <div 
                    className="flex-1 flex flex-col items-center justify-between text-center px-1 md:px-1.5 pb-1.5 md:pb-2 w-full min-h-0"
                    style={{ paddingTop: space.type === "property" ? '24%' : '4px' }}
                  >
                    <div className="flex flex-col items-center w-full mt-0.5">
                      {getSpecialIcon(space.type, space.name)}
                      <span className="text-[9px] md:text-[10px] leading-none font-bold text-[#1a3a1a] uppercase tracking-tight w-full break-normal mt-0.5">
                        {space.name}
                      </span>
                    </div>
                    {space.price && (
                      <span className="text-[9px] md:text-[10px] font-bold text-gray-800">
                        ${space.price}
                      </span>
                    )}
                  </div>

                  {/* Mortgage Overlay */}
                  {gameState.properties[space.id]?.isMortgaged && (
                    <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/50 backdrop-blur-[1px]">
                      <div className="transform -rotate-45 text-red-600 font-black border-[3px] border-red-600 rounded-sm px-1 py-0.5 bg-white shadow-lg text-[7px] md:text-[9px] uppercase tracking-widest whitespace-nowrap">
                        Mortgaged
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        );
      })}

      {(() => {
        const getCellCoords = (id: number) => {
          if (id === 0) return { col: 10, row: 10 };
          if (id > 0 && id < 10) return { col: 10 - id, row: 10 };
          if (id === 10) return { col: 0, row: 10 };
          if (id > 10 && id < 20) return { col: 0, row: 20 - id };
          if (id === 20) return { col: 0, row: 0 };
          if (id > 20 && id < 30) return { col: id - 20, row: 0 };
          if (id === 30) return { col: 10, row: 0 };
          if (id > 30 && id < 40) return { col: 10, row: id - 30 };
          return { col: 10, row: 10 };
        };

        const playerEntries = Object.entries(gameState.players);
        const sortedEntries = [...playerEntries].sort((a, b) => {
           if (a[0] === gameState.currentTurn) return 1;
           if (b[0] === gameState.currentTurn) return -1;
           return 0;
        });

        return sortedEntries.map(([pid, player], index) => {
          const currentVisualAbs = visualPos[pid] ?? player.position;
          const visualPositionId = ((currentVisualAbs % 40) + 40) % 40;
          const { col, row } = getCellCoords(visualPositionId);
          
          const playersOnSameSpot = sortedEntries.filter(p => p[1].position === player.position);
          const myIndexOnSpot = playersOnSameSpot.findIndex(p => p[0] === pid);
          
          let offsetX = 0;
          let offsetY = 0;
          if (playersOnSameSpot.length > 1) {
             offsetX = (myIndexOnSpot % 2 === 0 ? -1 : 1) * (myIndexOnSpot > 1 ? 10 : 5);
             offsetY = (myIndexOnSpot < 2 ? -1 : 1) * (myIndexOnSpot % 2 === 0 ? 10 : 5);
          }

          const leftPercent = (col * (100 / 11)) + (50 / 11);
          const topPercent = (row * (100 / 11)) + (50 / 11);

          const avatarStr = roomData.playerAvatars?.[pid] || "#475569";
          const isUrl = avatarStr.startsWith('http');
          const isCurrentTurn = gameState.currentTurn === pid;
          const initial = roomData.playerNames[pid]?.charAt(0).toUpperCase() || "?";

          return (
            <div
              key={pid}
              className="absolute z-40 pointer-events-none"
              style={{
                left: `calc(${leftPercent}% + ${offsetX}px)`,
                top: `calc(${topPercent}% + ${offsetY}px)`,
                transitionProperty: 'left, top',
                transitionDuration: '120ms',
                transitionTimingFunction: 'linear'
              }}
            >
              <div className={`-translate-x-1/2 -translate-y-1/2 transition-transform duration-300 ${isCurrentTurn ? 'scale-125 z-50' : 'scale-100 z-40'}`}>
                <div className={`w-6 h-6 md:w-8 md:h-8 rounded-full flex items-center justify-center border-2 border-white shadow-lg bg-white overflow-hidden ${isCurrentTurn ? 'ring-4 ring-amber-400 ring-offset-1' : ''}`}>
                  {isUrl ? (
                    <img src={avatarStr} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center font-bold text-white text-xs md:text-sm" style={{ backgroundColor: avatarStr }}>
                      {(!avatarStr.startsWith('#') && !avatarStr.startsWith('rgb') && !avatarStr.startsWith('hsl')) ? avatarStr : initial}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        });
      })()}

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
            <span className="text-white font-black text-xl tracking-[0.15em] uppercase" style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.3)' }}>
              Monopoly
            </span>
          </div>
        </div>

        {/* Children slot: dice canvas + action panel injected by parent */}
        {children}
      </div>
    </div>
  );
}
