"use client";

import { useState } from "react";
import { SettingsModal } from "@/components/dashboard/SettingsModal";
import { RoomFeed } from "@/components/dashboard/RoomFeed";
import { CreateRoomModal } from "@/components/dashboard/CreateRoomModal";
import { Plus, ArrowRight } from "lucide-react";
import { joinRoom } from "@/lib/firebase/rooms";
import { useAuthStore } from "@/store/authStore";
import { useRouter } from "next/navigation";
import { SocialDashboard } from "@/components/social/SocialDashboard";
import { ChatSystem } from "@/components/chat/ChatSystem";
import { GameType } from "@/lib/firebase/rooms";

const GAMES_LIST: { id: GameType; name: string; description: string; icon: string; color: string; status: string }[] = [
  {
    id: "Connect4",
    name: "Connect 4",
    description: "Classic vertical checkers. 4 in a row to win.",
    icon: "🔴",
    color: "from-stormy-teal to-fiery-terracotta text-wheat",
    status: "live"
  },
  {
    id: "UltimateTicTacToe",
    name: "Ultimate Tic-Tac-Toe",
    description: "A 9x9 grid of pure strategy. Win the small boards to win the big board.",
    icon: "❌",
    color: "from-fiery-terracotta to-dark-cyan text-wheat",
    status: "live"
  },
  {
    id: "Mancala",
    name: "Mancala",
    description: "Sow your stones and capture your opponent's in this ancient game.",
    icon: "🕳️",
    color: "from-espresso to-stormy-teal text-wheat",
    status: "live"
  },
  {
    id: "GuessWho",
    name: "Guess Who",
    description: "Ask questions and flip cards to deduce your opponent's mystery character.",
    icon: "🕵️",
    color: "from-dark-cyan to-stormy-teal text-wheat",
    status: "live"
  },
  {
    id: "Battleship",
    name: "Battleship",
    description: "Hide your fleet, launch missiles, and sink your opponent.",
    icon: "⛴️",
    color: "from-slate-800 to-cyan-900 text-cyan-100",
    status: "live"
  },
  {
    id: "Monopoly",
    name: "Monopoly",
    description: "Buy properties, trade with friends, and bankrupt your opponents.",
    icon: "🎩",
    color: "from-emerald-800 to-green-600 text-emerald-100",
    status: "coming-soon"
  }
];

export default function Dashboard() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedGameForModal, setSelectedGameForModal] = useState<GameType | null>(null);
  const [joinCode, setJoinCode] = useState("");
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState("");
  
  const { user } = useAuthStore();
  const router = useRouter();

  const handleJoin = async (roomId: string) => {
    if (!user) return;
    setError("");
    setIsJoining(true);
    try {
      const username = user.username || user.displayName || "Player";
      await joinRoom(roomId, user.uid, username, user.photoURL);
      router.push(`/room/${roomId}`);
    } catch (err: unknown) {
      setError((err as Error).message || "Failed to join room.");
    } finally {
      setIsJoining(false);
    }
  };

  const handleJoinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (joinCode.trim().length > 0) {
      handleJoin(joinCode.trim().toUpperCase());
    }
  };

  return (
    <div className="min-h-screen bg-wheat text-espresso selection:bg-fiery-terracotta/30">
      {/* Background Effects */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-dark-cyan/30 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-fiery-terracotta/20 blur-[120px] rounded-full" />
      </div>

      <main className="relative z-10 max-w-6xl mx-auto px-6 py-12">
        <header className="mb-12">
          <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-stormy-teal to-espresso">
            Nexus Hub
          </h1>
          <p className="text-fiery-terracotta font-semibold mt-2">Select a game mode or join an existing lobby.</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Actions & Profile */}
          <div className="lg:col-span-4 space-y-8">
            <div className="p-6 rounded-3xl bg-dark-cyan/20 border border-fiery-terracotta/30 shadow-md">
              <h3 className="text-lg font-bold text-espresso mb-4">Join via Code</h3>
              <form onSubmit={handleJoinSubmit} className="relative">
                <input 
                  type="text" 
                  placeholder="Enter Room Code" 
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value)}
                  className="w-full bg-wheat border border-fiery-terracotta/50 rounded-2xl px-4 py-4 text-espresso outline-none focus:border-stormy-teal transition-colors placeholder:text-fiery-terracotta/70 uppercase font-mono shadow-inner font-bold"
                  maxLength={6}
                />
                <button 
                  type="submit"
                  disabled={isJoining || joinCode.length < 4}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-xl bg-dark-cyan hover:bg-fiery-terracotta hover:text-wheat transition-colors disabled:opacity-50 text-espresso"
                >
                  <ArrowRight size={20} />
                </button>
              </form>
              {error && <p className="text-red-400 text-sm mt-2 font-medium">{error}</p>}
            </div>

            <SocialDashboard />
          </div>

          {/* Right Column: Game Library & Feed */}
          <div className="lg:col-span-8 space-y-8">
            <div className="bg-dark-cyan/20 backdrop-blur-md border border-fiery-terracotta/30 rounded-3xl p-6 shadow-xl shadow-fiery-terracotta/10">
              <h2 className="text-2xl font-black text-espresso mb-6">Game Library</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {GAMES_LIST.map((game) => (
                  <button
                    key={game.id}
                    onClick={() => {
                      setSelectedGameForModal(game.id);
                      setIsModalOpen(true);
                    }}
                    className={`relative overflow-hidden group rounded-2xl p-4 text-left transition-all hover:scale-[1.02] active:scale-[0.98] border border-transparent shadow-md bg-gradient-to-br ${game.color}`}
                  >
                    <div className="absolute inset-0 bg-espresso/10 group-hover:bg-transparent transition-colors" />
                    <div className="relative z-10">
                      <span className="text-4xl mb-3 block drop-shadow-md">{game.icon}</span>
                      <h3 className="font-bold text-current text-lg leading-tight drop-shadow-sm flex items-center gap-2">
                        {game.name}
                        {game.status === "coming-soon" && (
                          <span className="text-[10px] font-black uppercase tracking-wider bg-black/30 px-2 py-0.5 rounded-full text-white">Soon</span>
                        )}
                      </h3>
                      <p className="text-sm text-current opacity-80 mt-1 font-medium">{game.description}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <RoomFeed onJoin={handleJoin} />
          </div>
        </div>
      </main>

      <CreateRoomModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onRoomCreated={handleJoin}
        preselectedGame={selectedGameForModal}
      />

      <SettingsModal />
    </div>
  );
}
