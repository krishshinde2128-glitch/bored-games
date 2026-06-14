import React from 'react';
import { MonopolyTrade, MonopolyPropertyState } from '@/lib/firebase/rooms';
import { MONOPOLY_BOARD } from '@/lib/monopolyData';

interface TradeReviewProps {
  currentUserId: string;
  trade: MonopolyTrade;
  playerNames: Record<string, string>;
  properties: Record<number, MonopolyPropertyState>;
  onAccept: () => void;
  onDecline: () => void;
  onCancel: () => void;
}

export default function TradeReview({
  currentUserId,
  trade,
  playerNames,
  properties,
  onAccept,
  onDecline,
  onCancel
}: TradeReviewProps) {
  const isOfferer = currentUserId === trade.offererId;
  const isReceiver = currentUserId === trade.receiverId;
  const isSpectator = !isOfferer && !isReceiver;

  const offererName = playerNames[trade.offererId] || 'Unknown Player';
  const receiverName = playerNames[trade.receiverId] || 'Unknown Player';

  const renderPropertyList = (propertyIds: number[]) => {
    if (propertyIds.length === 0) return <span className="text-gray-500 italic text-sm">No properties</span>;
    
    return (
      <div className="flex flex-col gap-1">
        {propertyIds.map(id => {
          const space = MONOPOLY_BOARD.find(s => s.id === id);
          if (!space) return null;
          const isMortgaged = properties[id]?.isMortgaged;
          
          return (
            <div key={id} className="flex items-center gap-2 p-1.5 bg-white border rounded">
              {space.colorGroup ? (
                <div className="w-3 h-3 rounded-full border border-black/20 shrink-0" style={{ backgroundColor: getColorHex(space.colorGroup) }} />
              ) : (
                <span className="text-[10px]">{space.type === 'railroad' ? '🚂' : '💡'}</span>
              )}
              <span className="text-xs font-bold text-gray-800">{space.name} {isMortgaged ? <span className="text-red-500 text-[10px] uppercase ml-1">(Mortgaged)</span> : ''}</span>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="bg-[#f0e8d8] rounded-xl shadow-2xl border-4 border-[#1a3a1a] w-full max-w-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
        
        {/* Header */}
        <div className="bg-[#1a3a1a] text-white p-4 flex justify-center items-center relative">
          <h2 className="text-xl font-black uppercase tracking-widest text-center">
            {isReceiver ? "Trade Offer Received" : isOfferer ? "Pending Trade Offer" : "Trade Proposed"}
          </h2>
        </div>

        {/* Content */}
        <div className="p-6">
          <p className="text-center text-gray-800 font-bold mb-6">
            <span className="text-blue-700">{offererName}</span> has proposed a trade to <span className="text-red-700">{receiverName}</span>.
          </p>

          <div className="flex flex-col md:flex-row gap-6">
            
            {/* What Offerer is Giving */}
            <div className="flex-1 bg-white/50 border-2 border-dashed border-[#1a3a1a]/30 rounded-lg p-4">
              <h3 className="text-center font-bold uppercase text-sm mb-4 border-b pb-2 text-[#1a3a1a]">
                {isReceiver ? "You Will Receive" : `${offererName} Offers`}
              </h3>
              
              <div className="mb-4 text-center">
                <span className="text-xs uppercase font-bold text-gray-500 block mb-1">Cash</span>
                <span className="text-2xl font-black text-green-600">${trade.offeredCash}</span>
              </div>
              
              <div>
                <span className="text-xs uppercase font-bold text-gray-500 block mb-2 text-center">Properties</span>
                {renderPropertyList(trade.offeredProperties)}
              </div>
            </div>

            {/* Exchange Icon */}
            <div className="flex items-center justify-center -my-2 md:my-0">
              <div className="bg-[#1a3a1a] text-white rounded-full p-3 shadow-lg transform md:rotate-0 rotate-90">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m7 15-5-5 5-5"/><path d="m17 9 5 5-5 5"/><path d="M2 10h14"/><path d="M22 14H8"/></svg>
              </div>
            </div>

            {/* What Receiver is Giving */}
            <div className="flex-1 bg-white/50 border-2 border-dashed border-[#1a3a1a]/30 rounded-lg p-4">
              <h3 className="text-center font-bold uppercase text-sm mb-4 border-b pb-2 text-[#1a3a1a]">
                {isReceiver ? "You Will Give" : `${receiverName} Gives`}
              </h3>
              
              <div className="mb-4 text-center">
                <span className="text-xs uppercase font-bold text-gray-500 block mb-1">Cash</span>
                <span className="text-2xl font-black text-red-600">-${trade.requestedCash}</span>
              </div>
              
              <div>
                <span className="text-xs uppercase font-bold text-gray-500 block mb-2 text-center">Properties</span>
                {renderPropertyList(trade.requestedProperties)}
              </div>
            </div>

          </div>
        </div>

        {/* Actions */}
        <div className="bg-gray-100 p-4 border-t-2 border-[#1a3a1a]/20 flex justify-center gap-4">
          {isReceiver && (
            <>
              <button 
                onClick={onDecline}
                className="px-8 py-3 rounded-lg font-black text-white bg-red-600 hover:bg-red-700 transition-colors uppercase tracking-widest shadow-md"
              >
                Decline
              </button>
              <button 
                onClick={onAccept}
                className="px-8 py-3 rounded-lg font-black text-white bg-green-600 hover:bg-green-700 transition-colors uppercase tracking-widest shadow-md shadow-green-600/30 ring-2 ring-green-600 ring-offset-2 ring-offset-gray-100"
              >
                Accept Trade
              </button>
            </>
          )}

          {isOfferer && (
            <button 
              onClick={onCancel}
              className="px-8 py-3 rounded-lg font-black text-gray-700 bg-gray-300 hover:bg-gray-400 transition-colors uppercase tracking-widest shadow-md"
            >
              Cancel Trade
            </button>
          )}

          {isSpectator && (
            <div className="text-sm font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
              <div className="w-4 h-4 rounded-full border-2 border-gray-400 border-t-gray-600 animate-spin"></div>
              Waiting for {receiverName}...
            </div>
          )}
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
