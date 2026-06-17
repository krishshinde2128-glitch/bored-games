"use client";

import { useState, useEffect } from "react";
import { getHeadToHeadStats, HeadToHeadStats } from "@/lib/firebase/stats";
import { GAME_LIMITS, GameType } from "@/lib/firebase/rooms";
import { X, Activity } from "lucide-react";

interface Props {
  currentUserId: string;
  friendUid: string;
  friendTag: string;
  onClose: () => void;
}

export function H2HStatsModal({ currentUserId, friendUid, friendTag, onClose }: Props) {
  const [stats, setStats] = useState<HeadToHeadStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getHeadToHeadStats(currentUserId, friendUid)
      .then((data) => {
        setStats(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load H2H stats", err);
        setLoading(false);
      });
  }, [currentUserId, friendUid]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-wheat w-full sm:w-[350px] flex flex-col rounded-3xl shadow-2xl overflow-hidden border-2 border-fiery-terracotta/30">
        
        {/* Header */}
        <div className="bg-stormy-teal text-wheat p-4 flex justify-between items-center shadow-md">
          <div>
            <h3 className="font-bold text-lg flex items-center gap-2">
              <Activity size={18} /> Head-to-Head
            </h3>
            <p className="text-xs text-wheat/80">vs {friendTag}</p>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-lg transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Content Area */}
        <div className="p-6 bg-gradient-to-b from-wheat to-wheat/80 flex flex-col items-center">
          {loading ? (
            <div className="py-8 animate-pulse text-espresso/50 font-bold">Loading stats...</div>
          ) : !stats || (stats.winsAgainst === 0 && stats.lossesAgainst === 0) ? (
            <div className="py-8 text-center text-espresso">
              <p className="text-4xl mb-2 font-black opacity-20">?</p>
              <p className="font-medium text-espresso/70">No games played yet against {friendTag}!</p>
            </div>
          ) : (
            <div className="w-full space-y-6">
              
              <div className="flex justify-between items-center bg-white/50 p-4 rounded-2xl border border-espresso/10">
                <div className="text-center w-1/2 border-r border-espresso/10">
                  <span className="block text-xs font-black text-emerald-600 uppercase tracking-widest">Wins</span>
                  <span className="text-4xl font-black text-emerald-500">{stats.winsAgainst}</span>
                </div>
                <div className="text-center w-1/2">
                  <span className="block text-xs font-black text-red-600 uppercase tracking-widest">Losses</span>
                  <span className="text-4xl font-black text-red-500">{stats.lossesAgainst}</span>
                </div>
              </div>

              {/* Win Rate Bar */}
              <div>
                <div className="flex justify-between text-xs font-bold text-espresso/60 mb-1">
                  <span>Win Rate</span>
                  <span>{stats.winsAgainst + stats.lossesAgainst > 0 ? Math.round((stats.winsAgainst / (stats.winsAgainst + stats.lossesAgainst)) * 100) : 0}%</span>
                </div>
                <div className="w-full h-3 bg-red-500 rounded-full overflow-hidden flex">
                  <div 
                    className="h-full bg-emerald-500" 
                    style={{ width: `${stats.winsAgainst + stats.lossesAgainst > 0 ? (stats.winsAgainst / (stats.winsAgainst + stats.lossesAgainst)) * 100 : 0}%` }} 
                  />
                </div>
              </div>

              {/* Games Breakdown */}
              <div className="mt-6 w-full">
                <h4 className="text-xs font-black uppercase text-espresso/50 mb-3 tracking-wider text-left border-b border-espresso/10 pb-2">Game Breakdown</h4>
                <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar pr-1 w-full">
                  {(Object.keys(GAME_LIMITS) as GameType[]).map(gameId => {
                    const gameData = stats.games?.[gameId] || { wins: 0, losses: 0, gamesPlayed: 0 };
                    const total = gameData.gamesPlayed || gameData.wins + gameData.losses;
                    return (
                      <div key={gameId} className="bg-white/40 p-3 rounded-xl border border-espresso/10 flex justify-between items-center text-sm shadow-sm">
                        <span className="font-bold text-espresso capitalize">{gameId.replace(/([A-Z])/g, ' $1').trim()}</span>
                        <div className="flex gap-4 text-right">
                          <span className="font-black text-emerald-600 w-8">{gameData.wins} W</span>
                          <span className="font-black text-red-500 w-8">{gameData.losses} L</span>
                          <span className="font-bold text-espresso/60 w-16 border-l border-espresso/10 pl-2 text-xs flex items-center justify-end">{total} G</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>
          )}
        </div>

      </div>
    </div>
  );
}
