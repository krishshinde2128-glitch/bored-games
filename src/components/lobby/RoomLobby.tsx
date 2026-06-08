"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Room, RoomSettings, updateRoomStatus, updateRoomSettings, GAME_LIMITS, updatePlayerAvatar } from "@/lib/firebase/rooms";
import { Copy, Check, User, Crown, Settings, Play, Users, Eye, HelpCircle } from "lucide-react";

interface RoomLobbyProps {
  roomId: string;
  roomData: Room;
  currentUserId: string;
}

export function RoomLobby({ roomId, roomData, currentUserId }: RoomLobbyProps) {
  const isHost = roomData.hostId === currentUserId;
  const players = roomData.players;
  const playerNames = roomData.playerNames || {};

  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedColor, setSelectedColor] = useState<string | null>(
    roomData.playerAvatars?.[currentUserId] || null
  );

  const defaultSettings: RoomSettings = roomData.settings || {
    allowSpectators: true,
    firstTurn: "random",
    deckEdition: "standard",
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(roomId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleStartGame = async () => {
    try {
      setSaving(true);
      await updateRoomStatus(roomId, "in-progress");
    } catch (err) {
      console.error("Failed to start game", err);
    } finally {
      setSaving(false);
    }
  };

  const handleSettingChange = async (key: keyof RoomSettings, value: any) => {
    if (!isHost) return;
    const updatedSettings = {
      ...defaultSettings,
      [key]: value,
    };
    try {
      await updateRoomSettings(roomId, updatedSettings, roomData.maxPlayers);
    } catch (err) {
      console.error("Failed to update settings", err);
    }
  };

  const handleMaxPlayersChange = async (val: number) => {
    if (!isHost) return;
    try {
      await updateRoomSettings(roomId, defaultSettings, val);
    } catch (err) {
      console.error("Failed to update max players", err);
    }
  };

  const maxAllowedForGame = GAME_LIMITS[roomData.gameType] || 2;
  const canStart = players.length >= 2;

  const AVATAR_COLORS = [
    "#b8d951", "#ffc83d", "#f48c42", "#c45a4a",
    "#62a4e8", "#7be4ed", "#1bb996", "#56e359",
    "#9e7861", "#c43f9a", "#ff7a97", "#855ee3"
  ];

  const handleColorSelect = async (color: string) => {
    setSelectedColor(color);
    try {
      await updatePlayerAvatar(roomId, currentUserId, color);
    } catch (err) {
      console.error("Failed to update avatar", err);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-4 md:p-8 font-sans">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-xl relative"
      >
        {/* Glow Effects */}
        <div className="absolute -top-12 -left-12 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-12 -right-12 w-48 h-48 bg-green-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="p-6 md:p-8 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50">
          <div>
            <div className="text-xs text-indigo-600 font-semibold tracking-wider uppercase mb-1">Room Lobby</div>
            <h2 className="text-3xl font-extrabold text-slate-900 flex items-center gap-3">
              <span>{roomData.gameType}</span>
              <span className="text-xs px-2.5 py-1 bg-slate-200 text-slate-700 border border-slate-300 rounded-full font-normal">
                Max {roomData.maxPlayers} Players
              </span>
            </h2>
          </div>

          {/* Game Code Display */}
          <div className="flex items-center gap-2 bg-white border border-slate-200 px-4 py-3 rounded-2xl">
            <div className="flex flex-col">
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Lobby Code</span>
              <span className="text-lg font-mono font-bold text-indigo-600 tracking-widest">{roomId}</span>
            </div>
            <button
              onClick={handleCopyCode}
              className="ml-3 p-2 bg-slate-100 hover:bg-slate-200 hover:text-indigo-600 text-slate-500 rounded-xl transition-all border border-slate-200"
              title="Copy Code"
            >
              {copied ? <Check size={18} className="text-green-500" /> : <Copy size={18} />}
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-slate-200">

          {/* Players Roster (Left Column) */}
          <div className="col-span-1 lg:col-span-7 p-6 md:p-8 bg-white">
            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-6 flex items-center gap-2">
              <Users size={16} />
              <span>Players in Room ({players.length}/{roomData.maxPlayers})</span>
            </h3>

            <div className="space-y-4">
              {players.map((pId, idx) => {
                const isPlayerHost = pId === roomData.hostId;
                const name = playerNames[pId] || `Player ${idx + 1}`;

                return (
                  <motion.div
                    key={pId}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center justify-between p-4 bg-white border border-slate-200 rounded-2xl hover:border-slate-300 transition-colors shadow-sm"
                  >
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold shadow-md relative"
                        style={{ backgroundColor: roomData.playerAvatars?.[pId] || "#475569" }}
                      >
                        {roomData.playerAvatars?.[pId] ? (
                          <div className="flex gap-0.5 mt-2">
                             <div className="w-2.5 h-2.5 bg-white rounded-full flex items-center justify-center"><div className="w-1 h-1 bg-black rounded-full" /></div>
                             <div className="w-2.5 h-2.5 bg-white rounded-full flex items-center justify-center"><div className="w-1 h-1 bg-black rounded-full" /></div>
                          </div>
                        ) : (
                          name.charAt(0).toUpperCase()
                        )}
                      </div>
                      <div>
                        <div className="font-bold text-slate-800 flex items-center gap-2">
                          <span>{name}</span>
                          {pId === currentUserId && (
                            <span className="text-[10px] bg-indigo-100 text-indigo-600 px-1.5 py-0.5 rounded border border-indigo-200 font-normal">
                              You
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-slate-500">Joined</span>
                      </div>
                    </div>

                    {isPlayerHost && (
                      <span className="flex items-center gap-1.5 text-xs text-yellow-500 bg-yellow-500/10 border border-yellow-500/20 px-2.5 py-1 rounded-full font-semibold">
                        <Crown size={12} />
                        <span>Host</span>
                      </span>
                    )}
                  </motion.div>
                );
              })}

              {/* Waiting Slots */}
              {Array.from({ length: Math.max(0, roomData.maxPlayers - players.length) }).map((_, i) => (
                <div
                  key={`empty-${i}`}
                  className="flex items-center justify-between p-4 border border-dashed border-slate-300 rounded-2xl bg-slate-50 opacity-80"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 shadow-sm">
                      <User size={18} />
                    </div>
                    <div>
                      <span className="font-medium text-slate-500 italic">Waiting for player...</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Settings & Controls (Right Column) */}
          <div className="col-span-1 lg:col-span-5 p-6 md:p-8 flex flex-col justify-between bg-slate-50">
            <div>
              <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-6 flex items-center gap-2">
                <User size={16} />
                <span>Select Appearance</span>
              </h3>

              <div className="mb-8 relative flex flex-col items-center">
                 {/* Dice Background glow as in Richup */}
                 <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-white blur-2xl rounded-full" />
                 
                 <div className="grid grid-cols-4 gap-4 relative z-10 p-4">
                    {AVATAR_COLORS.map(color => (
                       <button
                         key={color}
                         onClick={() => handleColorSelect(color)}
                         className="w-12 h-12 rounded-full transition-transform hover:scale-110 flex items-center justify-center relative shadow-lg"
                         style={{ 
                            backgroundColor: color,
                            boxShadow: selectedColor === color ? `0 0 20px 2px ${color}80` : 'none'
                         }}
                       >
                          {selectedColor === color && (
                             <div className="flex gap-1 mt-2">
                               <div className="w-3 h-3 bg-white rounded-full flex items-center justify-center"><div className="w-1.5 h-1.5 bg-black rounded-full" /></div>
                               <div className="w-3 h-3 bg-white rounded-full flex items-center justify-center"><div className="w-1.5 h-1.5 bg-black rounded-full" /></div>
                             </div>
                          )}
                       </button>
                    ))}
                 </div>
              </div>

              <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-6 flex items-center gap-2 mt-8">
                <Settings size={16} />
                <span>Room Settings</span>
              </h3>

              <div className="space-y-6">
                {/* Max Players Limit */}
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Max Players</label>
                  {isHost ? (
                    <select
                      value={roomData.maxPlayers}
                      onChange={(e) => handleMaxPlayersChange(Number(e.target.value))}
                      className="w-full bg-white border border-slate-200 text-slate-800 p-3 rounded-xl focus:outline-none focus:border-indigo-500 font-medium shadow-sm"
                    >
                      {Array.from({ length: maxAllowedForGame - 1 }, (_, i) => i + 2).map((num) => (
                        <option key={num} value={num}>
                          {num} Players
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="w-full bg-slate-100 border border-slate-200 text-slate-500 p-3 rounded-xl font-medium">
                      {roomData.maxPlayers} Players (Set by Host)
                    </div>
                  )}
                </div>

                {/* Spectator Policy */}
                <div className="flex items-center justify-between p-4 bg-white border border-slate-200 shadow-sm rounded-2xl">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                      <Eye size={14} className="text-slate-500" />
                      <span>Allow Spectators</span>
                    </span>
                    <span className="text-xs text-slate-500">Allow users to view your game live</span>
                  </div>
                  {isHost ? (
                    <button
                      onClick={() => handleSettingChange("allowSpectators", !defaultSettings.allowSpectators)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${defaultSettings.allowSpectators ? "bg-indigo-500" : "bg-slate-300"
                        }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${defaultSettings.allowSpectators ? "translate-x-6" : "translate-x-1"
                          }`}
                      />
                    </button>
                  ) : (
                    <span className="text-xs font-semibold text-slate-500">
                      {defaultSettings.allowSpectators ? "Enabled" : "Disabled"}
                    </span>
                  )}
                </div>

                {/* Turn Choice */}
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">First Turn</label>
                  {isHost ? (
                    <select
                      value={defaultSettings.firstTurn}
                      onChange={(e) => handleSettingChange("firstTurn", e.target.value)}
                      className="w-full bg-white border border-slate-200 text-slate-800 p-3 rounded-xl focus:outline-none focus:border-indigo-500 font-medium shadow-sm"
                    >
                      <option value="random">Random Selection</option>
                      <option value="host">Host First</option>
                      <option value="opponent">Opponent First</option>
                    </select>
                  ) : (
                    <div className="w-full bg-slate-100 border border-slate-200 text-slate-500 p-3 rounded-xl font-medium uppercase text-xs tracking-wider">
                      {defaultSettings.firstTurn === "random"
                        ? "🎲 Random"
                        : defaultSettings.firstTurn === "host"
                          ? "👑 Host"
                          : "⚔️ Opponent"}{" "}
                      goes first
                    </div>
                  )}
                </div>

                {/* Guess Who specific setting: Deck Edition */}
                {roomData.gameType === "GuessWho" && (
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Deck Edition</label>
                    {isHost ? (
                      <select
                        value={defaultSettings.deckEdition || "standard"}
                        onChange={(e) => handleSettingChange("deckEdition", e.target.value)}
                        className="w-full bg-white border border-slate-200 text-slate-800 p-3 rounded-xl focus:outline-none focus:border-indigo-500 font-medium shadow-sm"
                      >
                        <option value="standard">Standard Edition</option>
                        <option value="youtuber">YouTuber Edition</option>
                      </select>
                    ) : (
                      <div className="w-full bg-slate-100 border border-slate-200 text-slate-500 p-3 rounded-xl font-medium uppercase text-xs tracking-wider">
                        {defaultSettings.deckEdition === "youtuber"
                          ? "🎥 YouTuber Edition"
                          : "👥 Standard Edition"}
                      </div>
                    )}
                  </div>
                )}

                {/* Battleship specific setting: Game Mode */}
                {roomData.gameType === "Battleship" && (
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Game Mode</label>
                    {isHost ? (
                      <select
                        value={defaultSettings.battleshipMode || "classic"}
                        onChange={(e) => handleSettingChange("battleshipMode", e.target.value)}
                        className="w-full bg-white border border-slate-200 text-slate-800 p-3 rounded-xl focus:outline-none focus:border-indigo-500 font-medium shadow-sm"
                      >
                        <option value="classic">Classic (10x10)</option>
                        <option value="powerups">Power Ups (15x15)</option>
                      </select>
                    ) : (
                      <div className="w-full bg-slate-100 border border-slate-200 text-slate-500 p-3 rounded-xl font-medium uppercase text-xs tracking-wider">
                        {defaultSettings.battleshipMode === "powerups"
                          ? "⚡ Power Ups (15x15)"
                          : "⚓ Classic (10x10)"}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Launch Game controls */}
            <div className="mt-8 pt-6 border-t border-slate-200">
              {isHost ? (
                <button
                  onClick={handleStartGame}
                  disabled={!canStart || saving}
                  className={`w-full py-4 flex items-center justify-center gap-2 rounded-2xl font-bold tracking-wider transition-all duration-300 shadow-md ${canStart
                      ? "bg-gradient-to-r from-indigo-500 to-blue-600 hover:from-indigo-600 hover:to-blue-700 text-white active:scale-95"
                      : "bg-slate-200 text-slate-400 cursor-not-allowed border border-slate-300"
                    }`}
                >
                  <Play size={18} fill="currentColor" />
                  <span>{saving ? "Deploying..." : "Launch Match"}</span>
                </button>
              ) : (
                <div className="text-center p-4 bg-slate-100 border border-slate-200 rounded-2xl">
                  <div className="text-xs font-semibold text-indigo-600 animate-pulse uppercase tracking-wider flex items-center justify-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-indigo-500 animate-ping" />
                    <span>Awaiting host deployment...</span>
                  </div>
                </div>
              )}

              {!canStart && (
                <p className="text-xs text-center text-red-400/80 mt-3 font-medium flex items-center justify-center gap-1">
                  <HelpCircle size={12} />
                  <span>Waiting for friends to join...</span>
                </p>
              )}
            </div>

          </div>
        </div>
      </motion.div>
    </div>
  );
}
