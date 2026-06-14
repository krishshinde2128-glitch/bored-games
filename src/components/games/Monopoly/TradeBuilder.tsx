import React, { useState, useMemo } from 'react';
import { MonopolyPlayer, MonopolyPropertyState, MonopolyTrade } from '@/lib/firebase/rooms';
import { MonopolySpace, MONOPOLY_BOARD } from '@/lib/monopolyData';

interface TradeBuilderProps {
  currentUserId: string;
  players: Record<string, MonopolyPlayer>;
  properties: Record<number, MonopolyPropertyState>;
  playerNames: Record<string, string>;
  onProposeTrade: (trade: Omit<MonopolyTrade, "status">) => void;
  onCancel: () => void;
}

export default function TradeBuilder({
  currentUserId,
  players,
  properties,
  playerNames,
  onProposeTrade,
  onCancel
}: TradeBuilderProps) {
  // Opponents available for trading
  const opponents = Object.keys(players).filter(id => id !== currentUserId && !players[id].isBankrupt);
  
  const [targetPlayerId, setTargetPlayerId] = useState<string>(opponents[0] || "");
  const [offeredCash, setOfferedCash] = useState<number>(0);
  const [requestedCash, setRequestedCash] = useState<number>(0);
  const [offeredProperties, setOfferedProperties] = useState<number[]>([]);
  const [requestedProperties, setRequestedProperties] = useState<number[]>([]);

  // Get properties owned by current user
  const myProperties = useMemo(() => {
    return MONOPOLY_BOARD.filter(space => 
      (space.type === "property" || space.type === "railroad" || space.type === "utility") &&
      properties[space.id]?.ownerId === currentUserId
    );
  }, [properties, currentUserId]);

  // Get properties owned by target opponent
  const theirProperties = useMemo(() => {
    if (!targetPlayerId) return [];
    return MONOPOLY_BOARD.filter(space => 
      (space.type === "property" || space.type === "railroad" || space.type === "utility") &&
      properties[space.id]?.ownerId === targetPlayerId
    );
  }, [properties, targetPlayerId]);

  const toggleMyProperty = (propId: number) => {
    // Check if property has houses (cannot trade properties with houses)
    if (properties[propId]?.houses > 0) {
      alert("You must sell all houses on this property before trading it.");
      return;
    }
    setOfferedProperties(prev => 
      prev.includes(propId) ? prev.filter(id => id !== propId) : [...prev, propId]
    );
  };

  const toggleTheirProperty = (propId: number) => {
    if (properties[propId]?.houses > 0) {
      alert("This property has houses built on it and cannot be traded.");
      return;
    }
    setRequestedProperties(prev => 
      prev.includes(propId) ? prev.filter(id => id !== propId) : [...prev, propId]
    );
  };

  const myCash = players[currentUserId]?.cash || 0;
  const theirCash = players[targetPlayerId]?.cash || 0;

  const handlePropose = () => {
    if (!targetPlayerId) return;
    if (offeredCash > myCash) {
      alert("You cannot offer more cash than you have.");
      return;
    }
    if (requestedCash > theirCash) {
      alert("You cannot request more cash than they have.");
      return;
    }
    if (offeredCash === 0 && requestedCash === 0 && offeredProperties.length === 0 && requestedProperties.length === 0) {
      alert("You must offer or request something to propose a trade.");
      return;
    }

    onProposeTrade({
      offererId: currentUserId,
      receiverId: targetPlayerId,
      offeredCash,
      offeredProperties,
      requestedCash,
      requestedProperties,
    });
  };

  const renderPropertyCheckbox = (space: MonopolySpace, isMine: boolean) => {
    const isSelected = isMine ? offeredProperties.includes(space.id) : requestedProperties.includes(space.id);
    const toggleFunc = isMine ? toggleMyProperty : toggleTheirProperty;
    const propState = properties[space.id];
    const hasHouses = propState?.houses > 0;
    
    return (
      <div 
        key={space.id} 
        onClick={() => !hasHouses && toggleFunc(space.id)}
        className={`flex items-center justify-between p-2 rounded border mb-1 cursor-pointer transition-colors ${
          hasHouses ? 'bg-gray-200 opacity-50 cursor-not-allowed' : 
          isSelected ? 'bg-green-100 border-green-500' : 'bg-white hover:bg-gray-50 border-gray-300'
        }`}
      >
        <div className="flex items-center gap-2">
          {space.colorGroup ? (
            <div className="w-3 h-3 rounded-full border border-black/20" style={{ backgroundColor: getColorHex(space.colorGroup) }} />
          ) : (
            <span className="text-[10px]">{space.type === 'railroad' ? '🚂' : '💡'}</span>
          )}
          <span className="text-xs font-bold text-gray-800">{space.name} {propState?.isMortgaged ? '(Mortgaged)' : ''}</span>
        </div>
        <div className="flex items-center gap-2">
          {hasHouses && <span className="text-[8px] text-red-500 font-bold uppercase">Has Houses</span>}
          <div className={`w-4 h-4 rounded-sm border flex items-center justify-center ${isSelected ? 'bg-green-500 border-green-600' : 'bg-white border-gray-400'}`}>
            {isSelected && <span className="text-white text-[10px]">✓</span>}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-[#f0e8d8] rounded-xl shadow-2xl border-4 border-[#1a3a1a] w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="bg-[#1a3a1a] text-white p-4 flex justify-between items-center shrink-0">
          <h2 className="text-xl font-black uppercase tracking-widest">Propose Trade</h2>
          <button onClick={onCancel} className="text-white/80 hover:text-white font-bold text-xl leading-none">&times;</button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 flex flex-col md:flex-row gap-6">
          
          {/* My Side */}
          <div className="flex-1 bg-white/50 rounded-lg p-4 border-2 border-[#1a3a1a]/20 flex flex-col">
            <h3 className="text-lg font-bold text-[#1a3a1a] mb-2 uppercase border-b-2 border-[#1a3a1a]/20 pb-2">Your Offer</h3>
            <div className="mb-4">
              <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Cash to Offer (Max ${myCash})</label>
              <div className="flex items-center">
                <span className="text-xl font-bold text-green-700 mr-2">$</span>
                <input 
                  type="number" 
                  min="0" 
                  max={myCash}
                  value={offeredCash}
                  onChange={(e) => setOfferedCash(Math.min(myCash, Math.max(0, parseInt(e.target.value) || 0)))}
                  className="w-full bg-white border-2 border-gray-300 rounded p-2 font-bold text-lg focus:outline-none focus:border-[#1a3a1a]"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              <label className="block text-xs font-bold text-gray-600 uppercase mb-2">Properties to Offer</label>
              {myProperties.length === 0 ? (
                <div className="text-sm text-gray-500 italic p-4 text-center border-2 border-dashed rounded">You don't own any properties.</div>
              ) : (
                <div className="space-y-1">
                  {myProperties.map(space => renderPropertyCheckbox(space, true))}
                </div>
              )}
            </div>
          </div>

          {/* Their Side */}
          <div className="flex-1 bg-white/50 rounded-lg p-4 border-2 border-[#1a3a1a]/20 flex flex-col">
            <div className="flex items-center justify-between mb-2 border-b-2 border-[#1a3a1a]/20 pb-2">
              <h3 className="text-lg font-bold text-[#1a3a1a] uppercase">Requesting</h3>
              <select 
                value={targetPlayerId} 
                onChange={(e) => {
                  setTargetPlayerId(e.target.value);
                  setRequestedCash(0);
                  setRequestedProperties([]);
                }}
                className="bg-white border-2 border-[#1a3a1a] rounded px-2 py-1 text-sm font-bold focus:outline-none"
              >
                {opponents.map(id => (
                  <option key={id} value={id}>{playerNames[id] || 'Unknown Player'}</option>
                ))}
              </select>
            </div>

            <div className="mb-4">
              <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Cash to Request (Max ${theirCash})</label>
              <div className="flex items-center">
                <span className="text-xl font-bold text-green-700 mr-2">$</span>
                <input 
                  type="number" 
                  min="0" 
                  max={theirCash}
                  value={requestedCash}
                  onChange={(e) => setRequestedCash(Math.min(theirCash, Math.max(0, parseInt(e.target.value) || 0)))}
                  className="w-full bg-white border-2 border-gray-300 rounded p-2 font-bold text-lg focus:outline-none focus:border-[#1a3a1a]"
                  disabled={!targetPlayerId}
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              <label className="block text-xs font-bold text-gray-600 uppercase mb-2">Properties to Request</label>
              {theirProperties.length === 0 ? (
                <div className="text-sm text-gray-500 italic p-4 text-center border-2 border-dashed rounded">They don't own any properties.</div>
              ) : (
                <div className="space-y-1">
                  {theirProperties.map(space => renderPropertyCheckbox(space, false))}
                </div>
              )}
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="bg-gray-100 p-4 border-t-2 border-[#1a3a1a]/20 flex justify-end gap-3 shrink-0">
          <button 
            onClick={onCancel}
            className="px-6 py-2 rounded font-bold text-gray-600 bg-gray-200 hover:bg-gray-300 transition-colors uppercase tracking-wider"
          >
            Cancel
          </button>
          <button 
            onClick={handlePropose}
            disabled={!targetPlayerId}
            className="px-8 py-2 rounded font-bold text-white bg-[#2e7d32] hover:bg-[#256a29] transition-colors shadow-md disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-widest"
          >
            Propose Trade
          </button>
        </div>
      </div>
    </div>
  );
}

// Helper to get color hex
function getColorHex(colorGroup: string) {
  const colors: Record<string, string> = {
    brown: "#8B4513",
    lightBlue: "#AAD8E6",
    pink: "#D93A96",
    orange: "#F7941D",
    red: "#ED1B24",
    yellow: "#FEF200",
    green: "#1FB25A",
    darkBlue: "#0072BB",
  };
  return colors[colorGroup] || "#ccc";
}
