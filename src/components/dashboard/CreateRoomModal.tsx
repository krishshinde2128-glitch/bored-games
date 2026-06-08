"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Gamepad2, Users } from "lucide-react";
import { GameType, GAME_LIMITS, createRoom } from "@/lib/firebase/rooms";
import { useAuthStore } from "@/store/authStore";

interface CreateRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRoomCreated: (roomId: string) => void;
  preselectedGame?: GameType | null;
}

export function CreateRoomModal({ isOpen, onClose, onRoomCreated, preselectedGame }: CreateRoomModalProps) {
  const [selectedGame, setSelectedGame] = useState<GameType>("Connect4");
  const [isCreating, setIsCreating] = useState(false);
  const { user } = useAuthStore();
  
  useEffect(() => {
    if (isOpen && preselectedGame) {
      setSelectedGame(preselectedGame);
    }
  }, [isOpen, preselectedGame]);

  const handleCreate = async () => {
    if (!user) return;
    setIsCreating(true);
    try {
      const username = user.username || user.displayName || "Player";
      const roomId = await createRoom(user.uid, username, selectedGame);
      onRoomCreated(roomId);
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-espresso/20 backdrop-blur-sm z-40"
          />
          <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="w-full max-w-md bg-dark-cyan/90 border border-fiery-terracotta/30 backdrop-blur-xl rounded-3xl shadow-2xl overflow-hidden pointer-events-auto"
            >
              <div className="flex justify-between items-center p-6 border-b border-fiery-terracotta/20">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-fiery-terracotta/20 rounded-xl">
                    <Gamepad2 className="w-5 h-5 text-stormy-teal" />
                  </div>
                  <h3 className="text-xl font-bold text-espresso tracking-tight">Host Game</h3>
                </div>
                <button onClick={onClose} className="p-2 rounded-full hover:bg-fiery-terracotta/20 text-fiery-terracotta hover:text-espresso transition-colors">
                  <X size={20} />
                </button>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-stormy-teal mb-2">Select Game Mode</label>
                    <div className="relative">
                      <select
                        value={selectedGame}
                        onChange={(e) => setSelectedGame(e.target.value as GameType)}
                        className="w-full bg-wheat border border-fiery-terracotta/50 rounded-xl px-4 py-4 text-espresso outline-none focus:border-stormy-teal transition-all appearance-none text-lg font-bold shadow-inner"
                      >
                        {Object.keys(GAME_LIMITS).map((game) => (
                          <option key={game} value={game} className="bg-wheat text-espresso">
                            {game.replace(/([A-Z])/g, ' $1').trim()}
                          </option>
                        ))}
                      </select>
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-fiery-terracotta">
                        ▼
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 px-4 py-3 bg-wheat rounded-xl border border-fiery-terracotta/30 shadow-inner">
                    <Users className="w-4 h-4 text-fiery-terracotta" />
                    <span className="text-sm text-fiery-terracotta/80 font-medium">Max Players: <span className="text-espresso font-bold">{GAME_LIMITS[selectedGame]}</span></span>
                  </div>
                </div>
                
                <button
                  onClick={handleCreate}
                  disabled={isCreating}
                  className="w-full mt-8 bg-gradient-to-r from-fiery-terracotta to-stormy-teal text-wheat font-bold py-4 rounded-xl transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-50 text-lg shadow-md border border-stormy-teal/50"
                >
                  {isCreating ? "Initializing Protocol..." : "Generate Room Code"}
                </button>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
