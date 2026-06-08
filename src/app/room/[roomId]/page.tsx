"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { Room } from "@/lib/firebase/rooms";
import { useAuthStore } from "@/store/authStore";
import { Connect4 } from "@/components/games/Connect4";
import { UltimateTicTacToe } from "@/components/games/UltimateTicTacToe";
import { Mancala } from "@/components/games/Mancala";
import { GuessWho } from "@/components/games/GuessWho";
import { Battleship } from "@/components/games/Battleship";
import { Monopoly } from "@/components/games/Monopoly/Monopoly";
import { RoomLobby } from "@/components/lobby/RoomLobby";
import { ChatSystem } from "@/components/chat/ChatSystem";
import { ArrowLeft } from "lucide-react";

export default function RoomPage() {
  const params = useParams();
  const router = useRouter();
  const roomId = params.roomId as string;
  const { user } = useAuthStore();
  const [roomData, setRoomData] = useState<Room | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!roomId) return;
    
    // Subscribe to room updates in real-time
    const unsub = onSnapshot(doc(db, "rooms", roomId), (docSnap) => {
      if (docSnap.exists()) {
        setRoomData(docSnap.data() as Room);
      } else {
        setRoomData(null); // Room doesn't exist
      }
      setLoading(false);
    });

    return () => unsub();
  }, [roomId]);

  if (!user) return <div className="min-h-screen bg-wheat p-8 text-center text-espresso">Please sign in first.</div>;
  if (loading) return <div className="min-h-screen bg-wheat p-8 text-center text-fiery-terracotta animate-pulse">Loading room...</div>;
  if (!roomData) return <div className="min-h-screen bg-wheat p-8 text-center text-stormy-teal font-bold">Room not found.</div>;

  return (
    <div className="min-h-screen bg-wheat text-espresso selection:bg-fiery-terracotta/30 p-6 relative overflow-x-hidden">
      {/* Background Effects */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-dark-cyan/20 blur-[120px] rounded-full" />
      </div>

      <header className="max-w-6xl mx-auto flex items-center justify-between mb-8 relative z-10">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => router.push('/')}
            className="p-3 bg-dark-cyan hover:bg-fiery-terracotta hover:text-wheat rounded-xl transition-colors border border-fiery-terracotta/30 shadow-sm"
          >
            <ArrowLeft size={24} />
          </button>
          <div>
            <h1 className="text-2xl font-black text-espresso">{roomData.gameType}</h1>
            <div className="flex items-center gap-2">
              <span className="text-espresso text-sm font-mono bg-dark-cyan px-2 py-0.5 rounded-md border border-fiery-terracotta/30 font-bold">ID: {roomData.roomId}</span>
              <span className="text-fiery-terracotta font-bold text-sm">• {roomData.players.length}/{roomData.maxPlayers} Players</span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto flex flex-col items-center justify-center relative z-10 w-full">
        {roomData.status === "waiting" ? (
          <RoomLobby roomId={roomId} roomData={roomData} currentUserId={user.uid} />
        ) : roomData.gameType === "Connect4" ? (
          <Connect4 roomId={roomId} currentUserId={user.uid} roomData={roomData} />
        ) : roomData.gameType === "UltimateTicTacToe" ? (
          <UltimateTicTacToe roomId={roomId} currentUserId={user.uid} roomData={roomData} />
        ) : roomData.gameType === "Mancala" ? (
          <Mancala roomId={roomId} currentUserId={user.uid} roomData={roomData} />
        ) : roomData.gameType === "GuessWho" ? (
          <GuessWho roomId={roomId} currentUserId={user.uid} roomData={roomData} />
        ) : roomData.gameType === "Battleship" ? (
          <Battleship roomId={roomId} currentUserId={user.uid} roomData={roomData} />
        ) : roomData.gameType === "Monopoly" ? (
          <Monopoly roomId={roomId} currentUserId={user.uid} roomData={roomData} />
        ) : (
          <div className="p-12 text-center border border-fiery-terracotta/30 rounded-3xl bg-dark-cyan/20 max-w-lg w-full shadow-sm">
            <h2 className="text-2xl font-bold mb-2 text-espresso">Game Not Implemented Yet</h2>
            <p className="text-fiery-terracotta">The game logic for {roomData.gameType} is coming soon.</p>
          </div>
        )}
      </main>

      {/* Floating Chat System */}
      <ChatSystem roomId={roomId} />
    </div>
  );
}
