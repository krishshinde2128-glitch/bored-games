"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageSquare, X, Send } from "lucide-react";
import { ChatMessage, sendMessage } from "@/lib/firebase/chat";
import { useAuthStore } from "@/store/authStore";

interface ChatPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onOpen: () => void;
  messages: ChatMessage[];
  roomId: string;
}

export function ChatPanel({ isOpen, onClose, onOpen, messages, roomId }: ChatPanelProps) {
  const [text, setText] = useState("");
  const { user } = useAuthStore();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || !user) return;
    const currentText = text;
    setText("");
    await sendMessage(roomId, user.uid, user.displayName || "Player", currentText);
  };

  return (
    <>
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            onClick={onOpen}
            className="fixed bottom-6 right-6 w-14 h-14 bg-fiery-terracotta text-wheat rounded-full shadow-xl flex items-center justify-center hover:scale-110 hover:bg-stormy-teal active:scale-95 transition-all z-40"
          >
            <MessageSquare size={24} />
          </motion.button>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ x: "100%", opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: "100%", opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed top-0 right-0 w-full max-w-sm h-screen bg-dark-cyan/95 backdrop-blur-2xl border-l border-fiery-terracotta/30 z-50 flex flex-col shadow-2xl"
          >
            <div className="p-4 border-b border-fiery-terracotta/30 flex justify-between items-center bg-wheat">
              <div className="flex items-center gap-2">
                <MessageSquare size={20} className="text-fiery-terracotta" />
                <h3 className="font-bold text-espresso">Room Chat</h3>
              </div>
              <button onClick={onClose} className="p-2 rounded-full hover:bg-fiery-terracotta/20 text-fiery-terracotta hover:text-espresso transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
              {messages.length === 0 ? (
                <div className="h-full flex items-center justify-center text-fiery-terracotta/80 font-bold text-sm">
                  No messages yet. Say hi!
                </div>
              ) : (
                messages.map((msg, idx) => {
                  const isMe = msg.userId === user?.uid;
                  return (
                    <div key={msg.id || idx} className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}>
                      {!isMe && <span className="text-xs text-fiery-terracotta font-bold ml-1 mb-1">{msg.displayName}</span>}
                      <div 
                        className={`px-4 py-2.5 rounded-2xl max-w-[85%] text-sm shadow-sm ${
                          isMe 
                            ? "bg-fiery-terracotta text-wheat rounded-br-sm" 
                            : "bg-wheat text-espresso rounded-bl-sm border border-fiery-terracotta/30"
                        }`}
                      >
                        {msg.text}
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            <form onSubmit={handleSend} className="p-4 border-t border-fiery-terracotta/30 bg-dark-cyan/50">
              <div className="relative flex items-center">
                <input
                  type="text"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Type a message..."
                  className="w-full bg-wheat border border-fiery-terracotta/50 rounded-full pl-4 pr-12 py-3 text-sm text-espresso outline-none focus:border-stormy-teal transition-colors shadow-inner placeholder:text-fiery-terracotta/70 font-bold"
                />
                <button 
                  type="submit"
                  disabled={!text.trim()}
                  className="absolute right-2 p-2 bg-fiery-terracotta rounded-full text-wheat hover:bg-stormy-teal disabled:opacity-50 transition-colors"
                >
                  <Send size={16} />
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
