"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "@/store/authStore";
import { db } from "@/lib/firebase/config";
import { collection, query, where, onSnapshot, doc, updateDoc, orderBy, limit } from "firebase/firestore";
import { X, Swords } from "lucide-react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";

interface AppNotification {
  id: string;
  type: string;
  fromUid: string;
  fromName: string;
  gameName: string;
  gameId: string;
  createdAt: number;
  read: boolean;
}

export function GlobalNotifications() {
  const { user } = useAuthStore();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, "users", user.uid, "notifications"), 
      where("read", "==", false)
    );
    const unsub = onSnapshot(q, (snap) => {
      const notifs = snap.docs.map(d => d.data() as AppNotification);
      notifs.sort((a, b) => b.createdAt - a.createdAt);
      setNotifications(notifs.slice(0, 5));
    });
    return () => unsub();
  }, [user]);

  const dismiss = async (id: string) => {
    if (!user) return;
    try {
      await updateDoc(doc(db, "users", user.uid, "notifications", id), { read: true });
    } catch (e) {
      console.error("Error dismissing notification:", e);
    }
  };

  if (notifications.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none">
      <AnimatePresence>
        {notifications.map(n => (
          <motion.div
            key={n.id}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="pointer-events-auto w-80 bg-wheat border-2 border-fiery-terracotta/50 rounded-xl shadow-2xl overflow-hidden flex flex-col"
          >
            <div className="bg-fiery-terracotta text-wheat px-3 py-2 flex justify-between items-center">
              <span className="font-bold text-sm flex items-center gap-2">
                <Swords size={16} />
                New Challenge!
              </span>
              <button onClick={() => dismiss(n.id)} className="hover:bg-black/10 p-1 rounded-lg">
                <X size={16} />
              </button>
            </div>
            <div className="p-3 text-espresso text-sm">
              <p><strong>{n.fromName}</strong> challenged you to <strong>{n.gameName}</strong>!</p>
              <div className="mt-3 flex gap-2">
                <Link 
                  href={`/room/${n.gameId}`}
                  onClick={() => dismiss(n.id)}
                  className="flex-1 text-center bg-dark-cyan text-wheat py-1.5 rounded-lg font-bold hover:bg-stormy-teal transition-colors"
                >
                  Join Game
                </Link>
                <button 
                  onClick={() => dismiss(n.id)}
                  className="flex-1 text-center bg-transparent border border-espresso/20 text-espresso py-1.5 rounded-lg font-bold hover:bg-espresso/10 transition-colors"
                >
                  Ignore
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
