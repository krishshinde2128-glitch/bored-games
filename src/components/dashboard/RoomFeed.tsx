"use client";

import { useEffect, useState } from "react";
import { collection, query, where, onSnapshot, limit, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { Room } from "@/lib/firebase/rooms";
import { Users, Play, Clock } from "lucide-react";
import { motion } from "framer-motion";

export function RoomFeed({ onJoin }: { onJoin: (roomId: string) => void }) {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(
      collection(db, "rooms"),
      where("status", "==", "waiting"),
      orderBy("createdAt", "desc"),
      limit(10)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const activeRooms: Room[] = [];
      snapshot.forEach((doc) => {
        activeRooms.push(doc.data() as Room);
      });
      setRooms(activeRooms);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <div className="bg-dark-cyan/20 border border-fiery-terracotta/30 rounded-3xl p-6 backdrop-blur-xl shadow-xl shadow-fiery-terracotta/10">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-espresso tracking-tight flex items-center gap-2">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-stormy-teal opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-stormy-teal"></span>
          </span>
          Live Public Rooms
        </h3>
        <span className="text-sm font-bold text-espresso px-3 py-1 bg-dark-cyan rounded-full border border-fiery-terracotta/30">
          {rooms.length} waiting
        </span>
      </div>

      <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
        {loading ? (
          <div className="text-center py-8 text-fiery-terracotta font-medium">Scanning for open games...</div>
        ) : rooms.length === 0 ? (
          <div className="text-center py-12 rounded-2xl bg-wheat border border-fiery-terracotta/30 shadow-inner">
            <Clock className="w-8 h-8 text-fiery-terracotta mx-auto mb-3" />
            <p className="text-stormy-teal font-bold">No public rooms available.</p>
            <p className="text-fiery-terracotta/80 text-sm mt-1 font-medium">Be the first to host a game!</p>
          </div>
        ) : (
          rooms.map((room) => (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              key={room.roomId} 
              className="group flex items-center justify-between p-4 rounded-2xl bg-wheat hover:bg-dark-cyan/50 border border-fiery-terracotta/30 transition-all hover:border-stormy-teal shadow-sm"
            >
              <div>
                <h4 className="font-bold text-espresso mb-1">{room.gameType.replace(/([A-Z])/g, ' $1').trim()}</h4>
                <div className="flex items-center gap-3 text-xs text-stormy-teal font-bold">
                  <span className="flex items-center gap-1.5 bg-dark-cyan/60 px-2 py-1 rounded-md border border-fiery-terracotta/20">
                    <Users size={12} /> {room.players.length} / {room.maxPlayers}
                  </span>
                  <span className="font-mono text-stormy-teal bg-fiery-terracotta/10 px-2 py-1 rounded-md border border-fiery-terracotta/30">
                    ID: {room.roomId}
                  </span>
                </div>
              </div>
              <button 
                onClick={() => onJoin(room.roomId)}
                className="w-10 h-10 rounded-full bg-dark-cyan text-espresso group-hover:bg-fiery-terracotta group-hover:text-wheat flex items-center justify-center transition-all active:scale-95 shadow-sm"
              >
                <Play size={16} className="ml-0.5" fill="currentColor" />
              </button>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
