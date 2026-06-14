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

  const isBattleship = roomData.gameType === "Battleship" && roomData.status !== "waiting";

  return (
    <div className={`min-h-screen ${isBattleship ? 'bg-slate-950 text-cyan-400 selection:bg-cyan-500/30' : 'bg-wheat text-espresso selection:bg-fiery-terracotta/30'} p-6 relative overflow-x-hidden transition-colors duration-1000`}>
      {/* Background Effects */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden transition-opacity duration-1000">
        {isBattleship ? (
          <>
             <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-blue-500/10 blur-[120px] rounded-full" />
             <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-cyan-500/10 blur-[120px] rounded-full" />
             {/* Radar grid lines for the background */}
             <div className="absolute inset-0 bg-[linear-gradient(rgba(6,182,212,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(6,182,212,0.03)_1px,transparent_1px)] bg-[size:50px_50px]" />
          </>
        ) : (
          <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-dark-cyan/20 blur-[120px] rounded-full" />
        )}
      </div>

      <header className="max-w-6xl mx-auto flex items-center justify-between mb-8 relative z-10">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => router.push('/')}
            className={`p-3 rounded-xl transition-colors shadow-sm ${isBattleship ? 'bg-slate-900 hover:bg-cyan-900 text-cyan-400 border border-cyan-800' : 'bg-dark-cyan hover:bg-fiery-terracotta hover:text-wheat border border-fiery-terracotta/30'}`}
          >
            <ArrowLeft size={24} />
          </button>
          <div>
            <h1 className={`text-2xl font-black ${isBattleship ? 'text-cyan-400' : 'text-espresso'}`}>{roomData.gameType}</h1>
            <div className="flex items-center gap-2">
              <span className={`text-sm font-mono px-2 py-0.5 rounded-md font-bold ${isBattleship ? 'bg-slate-900 text-cyan-300 border border-cyan-800' : 'text-espresso bg-dark-cyan border border-fiery-terracotta/30'}`}>ID: {roomData.roomId}</span>
              <span className={`font-bold text-sm ${isBattleship ? 'text-cyan-700' : 'text-fiery-terracotta'}`}>• {roomData.players.length}/{roomData.maxPlayers} Players</span>
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
