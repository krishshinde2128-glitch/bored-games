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
    "#3a9b8d", "#8f2a31", "#7c423b", "#d9822b",
    "#e5c453", "#5c7b39", "#2c5d82", "#7b4b70",
    "#a34343", "#4f8a8b", "#9b786f", "#342f33"
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
        className="bg-wheat border-4 border-espresso rounded-3xl overflow-hidden shadow-[8px_8px_0px_var(--color-espresso)] relative"
      >
        {/* Glow Effects */}
        <div className="absolute -top-12 -left-12 w-48 h-48 bg-dark-cyan/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-12 -right-12 w-48 h-48 bg-fiery-terracotta/20 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="p-6 md:p-8 border-b-4 border-espresso flex flex-col md:flex-row md:items-center justify-between gap-4 bg-wheat/50">
          <div>
            <div className="text-xs text-fiery-terracotta font-black tracking-widest uppercase mb-1 drop-shadow-sm">Room Lobby</div>
            <h2 className="text-3xl font-black text-stormy-teal flex items-center gap-3">
              <span>{roomData.gameType}</span>
              <span className="text-xs px-2.5 py-1 bg-dark-cyan text-wheat border-2 border-espresso rounded-full font-bold shadow-[2px_2px_0px_var(--color-espresso)]">
                Max {roomData.maxPlayers} Players
              </span>
            </h2>
          </div>

          {/* Game Code Display */}
          <div className="flex items-center gap-2 bg-wheat border-2 border-espresso px-4 py-3 rounded-2xl shadow-[4px_4px_0px_var(--color-espresso)]">
            <div className="flex flex-col">
              <span className="text-[10px] text-espresso/70 font-bold uppercase tracking-wider">Lobby Code</span>
              <span className="text-lg font-mono font-black text-dark-cyan tracking-widest drop-shadow-sm">{roomId}</span>
            </div>
            <button
              onClick={handleCopyCode}
              className="ml-3 p-2 bg-wheat hover:bg-fiery-terracotta hover:text-wheat text-espresso rounded-xl transition-all border-2 border-espresso shadow-[2px_2px_0px_var(--color-espresso)] active:shadow-none active:translate-y-[2px] active:translate-x-[2px]"
              title="Copy Code"
            >
              {copied ? <Check size={18} className="text-dark-cyan" /> : <Copy size={18} />}
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="grid grid-cols-1 lg:grid-cols-12 divide-y-4 lg:divide-y-0 lg:divide-x-4 divide-espresso">

          {/* Players Roster (Left Column) */}
          <div className="col-span-1 lg:col-span-7 p-6 md:p-8 bg-wheat">
            <h3 className="text-sm font-black text-espresso/80 uppercase tracking-widest mb-6 flex items-center gap-2">
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
                    className="flex items-center justify-between p-4 bg-wheat border-2 border-espresso rounded-2xl hover:bg-white/40 transition-colors shadow-[2px_2px_0px_var(--color-espresso)]"
                  >
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-10 h-10 rounded-full flex items-center justify-center text-wheat font-bold shadow-md relative border-2 border-espresso"
                        style={{ backgroundColor: roomData.playerAvatars?.[pId] || "var(--color-stormy-teal)" }}
                      >
                        {roomData.playerAvatars?.[pId] ? (
                          <div className="flex gap-0.5 mt-2">
                             <div className="w-2.5 h-2.5 bg-wheat rounded-full flex items-center justify-center border border-espresso"><div className="w-1 h-1 bg-espresso rounded-full" /></div>
                             <div className="w-2.5 h-2.5 bg-wheat rounded-full flex items-center justify-center border border-espresso"><div className="w-1 h-1 bg-espresso rounded-full" /></div>
                          </div>
                        ) : (
                          name.charAt(0).toUpperCase()
                        )}
                      </div>
                      <div>
                        <div className="font-bold text-stormy-teal flex items-center gap-2">
                          <span>{name}</span>
                          {pId === currentUserId && (
                            <span className="text-[10px] bg-dark-cyan text-wheat px-1.5 py-0.5 rounded border-2 border-espresso font-bold shadow-sm">
                              You
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-espresso/70 font-bold">Joined</span>
                      </div>
                    </div>

                    {isPlayerHost && (
                      <span className="flex items-center gap-1.5 text-xs text-fiery-terracotta bg-fiery-terracotta/10 border-2 border-fiery-terracotta/50 px-2.5 py-1 rounded-full font-bold">
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
                  className="flex items-center justify-between p-4 border-2 border-dashed border-espresso/40 rounded-2xl bg-wheat/50 opacity-80"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-wheat border-2 border-espresso/40 flex items-center justify-center text-espresso/50 shadow-sm">
                      <User size={18} />
                    </div>
                    <div>
                      <span className="font-bold text-espresso/50 italic">Waiting for player...</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Settings & Controls (Right Column) */}
          <div className="col-span-1 lg:col-span-5 p-6 md:p-8 flex flex-col justify-between bg-wheat/50">
            <div>
              <h3 className="text-sm font-black text-espresso/80 uppercase tracking-widest mb-6 flex items-center gap-2">
                <User size={16} />
                <span>Select Appearance</span>
              </h3>

              <div className="mb-8 relative flex flex-col items-center">
                 {/* Dice Background glow as in Richup */}
                 <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-wheat blur-2xl rounded-full" />
                 
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

              <h3 className="text-sm font-black text-espresso/80 uppercase tracking-widest mb-6 flex items-center gap-2 mt-8">
                <Settings size={16} />
                <span>Room Settings</span>
              </h3>

              <div className="space-y-6">
                {/* Max Players Limit */}
                <div>
                  <label className="block text-xs font-black text-espresso/80 uppercase tracking-wider mb-2">Max Players</label>
                  {isHost ? (
                    <select
                      value={roomData.maxPlayers}
                      onChange={(e) => handleMaxPlayersChange(Number(e.target.value))}
                      className="w-full bg-wheat border-2 border-espresso text-stormy-teal p-3 rounded-xl focus:outline-none focus:ring-4 focus:ring-fiery-terracotta/20 font-bold shadow-[2px_2px_0px_var(--color-espresso)]"
                    >
                      {Array.from({ length: maxAllowedForGame - 1 }, (_, i) => i + 2).map((num) => (
                        <option key={num} value={num}>
                          {num} Players
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="w-full bg-wheat border-2 border-espresso/40 text-espresso/70 p-3 rounded-xl font-bold italic">
                      {roomData.maxPlayers} Players (Set by Host)
                    </div>
                  )}
                </div>

                {/* Spectator Policy */}
                <div className="flex items-center justify-between p-4 bg-wheat border-2 border-espresso shadow-[2px_2px_0px_var(--color-espresso)] rounded-2xl">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-sm font-bold text-stormy-teal flex items-center gap-1.5">
                      <Eye size={14} className="text-espresso/70" />
                      <span>Allow Spectators</span>
                    </span>
                    <span className="text-xs text-espresso/70">Allow users to view your game live</span>
                  </div>
                  {isHost ? (
                    <button
                      onClick={() => handleSettingChange("allowSpectators", !defaultSettings.allowSpectators)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors border-2 border-espresso ${defaultSettings.allowSpectators ? "bg-dark-cyan" : "bg-espresso/20"
                        }`}
                    >
                      <span
                        className={`inline-block h-3.5 w-3.5 transform rounded-full border border-espresso transition-transform ${defaultSettings.allowSpectators ? "translate-x-6 bg-wheat" : "translate-x-1 bg-espresso"
                          }`}
                      />
                    </button>
                  ) : (
                    <span className="text-xs font-bold text-espresso/70">
                      {defaultSettings.allowSpectators ? "Enabled" : "Disabled"}
                    </span>
                  )}
                </div>

                {/* Turn Choice */}
                <div>
                  <label className="block text-xs font-black text-espresso/80 uppercase tracking-wider mb-2">First Turn</label>
                  {isHost ? (
                    <select
                      value={defaultSettings.firstTurn}
                      onChange={(e) => handleSettingChange("firstTurn", e.target.value)}
                      className="w-full bg-wheat border-2 border-espresso text-stormy-teal p-3 rounded-xl focus:outline-none focus:ring-4 focus:ring-fiery-terracotta/20 font-bold shadow-[2px_2px_0px_var(--color-espresso)]"
                    >
                      <option value="random">Random Selection</option>
                      <option value="host">Host First</option>
                      <option value="opponent">Opponent First</option>
                    </select>
                  ) : (
                    <div className="w-full bg-wheat border-2 border-espresso/40 text-espresso/70 p-3 rounded-xl font-bold uppercase text-xs tracking-wider italic">
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
                    <label className="block text-xs font-black text-espresso/80 uppercase tracking-wider mb-2">Deck Edition</label>
                    {isHost ? (
                      <select
                        value={defaultSettings.deckEdition || "standard"}
                        onChange={(e) => handleSettingChange("deckEdition", e.target.value)}
                        className="w-full bg-wheat border-2 border-espresso text-stormy-teal p-3 rounded-xl focus:outline-none focus:ring-4 focus:ring-fiery-terracotta/20 font-bold shadow-[2px_2px_0px_var(--color-espresso)]"
                      >
                        <option value="standard">Standard Edition</option>
                        <option value="youtuber">YouTuber (All)</option>
                        <option value="youtuber_uk">YouTuber (UK)</option>
                        <option value="youtuber_usa">YouTuber (USA)</option>
                        <option value="youtuber_india">YouTuber (India)</option>
                        <option value="youtuber_gaming">YouTuber (Gaming)</option>
                      </select>
                    ) : (
                      <div className="w-full bg-wheat border-2 border-espresso/40 text-espresso/70 p-3 rounded-xl font-bold uppercase text-xs tracking-wider italic">
                        {defaultSettings.deckEdition === "standard"
                          ? "👥 Standard Edition"
                          : `🎥 ${defaultSettings.deckEdition?.replace('youtuber_', '').toUpperCase()} Edition`}
                      </div>
                    )}
                  </div>
                )}

                {/* Battleship specific setting: Game Mode */}
                {roomData.gameType === "Battleship" && (
                  <div>
                    <label className="block text-xs font-black text-espresso/80 uppercase tracking-wider mb-2">Game Mode</label>
                    {isHost ? (
                      <select
                        value={defaultSettings.battleshipMode || "classic"}
                        onChange={(e) => handleSettingChange("battleshipMode", e.target.value)}
                        className="w-full bg-wheat border-2 border-espresso text-stormy-teal p-3 rounded-xl focus:outline-none focus:ring-4 focus:ring-fiery-terracotta/20 font-bold shadow-[2px_2px_0px_var(--color-espresso)]"
                      >
                        <option value="classic">Classic (10x10)</option>
                        <option value="powerups">Power Ups (15x15)</option>
                      </select>
                    ) : (
                      <div className="w-full bg-wheat border-2 border-espresso/40 text-espresso/70 p-3 rounded-xl font-bold uppercase text-xs tracking-wider italic">
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
            <div className="mt-8 pt-6 border-t-4 border-espresso">
              {isHost ? (
                <button
                  onClick={handleStartGame}
                  disabled={!canStart || saving}
                  className={`w-full py-4 flex items-center justify-center gap-2 rounded-2xl font-black uppercase tracking-widest transition-all duration-300 border-2 border-espresso shadow-[4px_4px_0px_var(--color-espresso)] ${canStart
                      ? "bg-fiery-terracotta hover:bg-[#a6343c] text-wheat active:shadow-none active:translate-y-[4px] active:translate-x-[4px]"
                      : "bg-espresso/20 text-espresso/40 cursor-not-allowed shadow-[2px_2px_0px_var(--color-espresso)]"
                    }`}
                >
                  <Play size={20} fill="currentColor" />
                  <span>{saving ? "Deploying..." : "Launch Match"}</span>
                </button>
              ) : (
                <div className="text-center p-4 bg-wheat border-2 border-espresso shadow-[2px_2px_0px_var(--color-espresso)] rounded-2xl">
                  <div className="text-xs font-black text-dark-cyan animate-pulse uppercase tracking-widest flex items-center justify-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-dark-cyan animate-ping border border-espresso" />
                    <span>Awaiting host deployment...</span>
                  </div>
                </div>
              )}

              {!canStart && (
                <p className="text-xs text-center text-fiery-terracotta mt-4 font-black uppercase tracking-widest flex items-center justify-center gap-1 drop-shadow-sm">
                  <HelpCircle size={14} />
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
