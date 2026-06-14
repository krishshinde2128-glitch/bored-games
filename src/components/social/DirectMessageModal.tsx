"use client";

import { useState, useEffect, useRef } from "react";
import { useAuthStore } from "@/store/authStore";
import { DirectMessage, subscribeToDirectMessages, sendDirectMessage, getDMThreadId } from "@/lib/firebase/directMessages";
import { X, Send } from "lucide-react";

interface Props {
  friendUid: string;
  friendTag: string;
  onClose: () => void;
}

export function DirectMessageModal({ friendUid, friendTag, onClose }: Props) {
  const { user } = useAuthStore();
  const [messages, setMessages] = useState<DirectMessage[]>([]);
  const [text, setText] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) return;
    const threadId = getDMThreadId(user.uid, friendUid);
    const unsub = subscribeToDirectMessages(threadId, setMessages);
    return () => unsub();
  }, [user, friendUid]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !text.trim()) return;
    const msg = text;
    setText("");
    await sendDirectMessage(user.uid, friendUid, msg);
  };

  if (!user) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-end sm:justify-center bg-black/20 backdrop-blur-sm sm:p-4">
      <div className="bg-wheat w-full sm:w-[400px] h-[80vh] sm:h-[500px] flex flex-col rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden border-2 border-fiery-terracotta/30">
        
        {/* Header */}
        <div className="bg-dark-cyan text-wheat p-4 flex justify-between items-center shadow-md z-10">
          <div>
            <h3 className="font-bold text-lg">{friendTag}</h3>
            <p className="text-xs text-wheat/70">Direct Message</p>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-lg transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Messages List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar bg-wheat/50">
          {messages.length === 0 && (
            <p className="text-center text-sm text-espresso/50 italic mt-10">
              This is the beginning of your chat history with {friendTag}. Say hi!
            </p>
          )}
          {messages.map((msg) => {
            const isMe = msg.senderId === user.uid;
            return (
              <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                <div className={`max-w-[80%] px-4 py-2 rounded-2xl ${
                  msg.type === 'challenge' 
                    ? 'bg-fiery-terracotta text-wheat shadow-md font-bold border-2 border-espresso'
                    : isMe 
                      ? 'bg-stormy-teal text-wheat rounded-br-sm' 
                      : 'bg-white text-espresso border border-espresso/10 rounded-bl-sm'
                }`}>
                  {msg.text}
                </div>
                <span className="text-[10px] text-espresso/40 mt-1 px-1">
                  {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            );
          })}
          <div ref={endRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 bg-white border-t border-espresso/10">
          <form onSubmit={handleSend} className="flex gap-2">
            <input 
              type="text" 
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Type a message..."
              className="flex-1 bg-wheat border border-espresso/20 rounded-full px-4 py-2 text-sm outline-none focus:border-stormy-teal text-espresso"
            />
            <button type="submit" disabled={!text.trim()} className="bg-fiery-terracotta text-wheat p-2 rounded-full disabled:opacity-50 hover:bg-dark-cyan transition-colors">
              <Send size={18} />
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}
