"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageSquare, Send, X } from "lucide-react";
import { ChatMessage, sendMessage } from "@/lib/firebase/chat";
import { useAuthStore } from "@/store/authStore";

interface ChatToastProps {
  message: ChatMessage | null;
  isVisible: boolean;
  onClose: () => void;
  roomId: string;
  onOpenChat: () => void;
}

export function ChatToast({ message, isVisible, onClose, roomId, onOpenChat }: ChatToastProps) {
  const [replyText, setReplyText] = useState("");
  const { user } = useAuthStore();

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !user) return;
    const text = replyText;
    setReplyText("");
    onClose();
    await sendMessage(roomId, user.uid, user.displayName || "Player", text);
  };

  return (
    <AnimatePresence>
      {isVisible && message && (
        <motion.div
          initial={{ y: 50, opacity: 0, scale: 0.9 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 20, opacity: 0, scale: 0.9 }}
          className="fixed bottom-24 right-6 w-80 bg-zinc-900 border border-white/10 rounded-2xl shadow-2xl p-4 z-40"
        >
          <div className="flex justify-between items-start mb-2">
            <div className="flex items-center gap-2 text-purple-400 cursor-pointer" onClick={onOpenChat}>
              <MessageSquare size={16} />
              <span className="font-bold text-sm">{message.displayName}</span>
            </div>
            <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors">
              <X size={16} />
            </button>
          </div>
          <p className="text-zinc-300 text-sm mb-3 line-clamp-2 cursor-pointer" onClick={onOpenChat}>
            {message.text}
          </p>
          <form onSubmit={handleReply} className="relative">
            <input
              type="text"
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder="Quick reply..."
              autoFocus
              className="w-full bg-black/50 border border-white/10 rounded-xl pl-3 pr-10 py-2 text-sm text-white outline-none focus:border-purple-500/50"
            />
            <button 
              type="submit"
              disabled={!replyText.trim()}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-purple-400 hover:text-purple-300 disabled:opacity-50 transition-colors"
            >
              <Send size={16} />
            </button>
          </form>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
