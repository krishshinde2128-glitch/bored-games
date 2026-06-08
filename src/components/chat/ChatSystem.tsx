"use client";

import { useState, useEffect } from "react";
import { ChatPanel } from "./ChatPanel";
import { ChatToast } from "./ChatToast";
import { collection, query, orderBy, onSnapshot, limit } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { ChatMessage } from "@/lib/firebase/chat";
import { useAuthStore } from "@/store/authStore";

export function ChatSystem({ roomId }: { roomId: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [latestMessage, setLatestMessage] = useState<ChatMessage | null>(null);
  const [showToast, setShowToast] = useState(false);
  const { user } = useAuthStore();

  useEffect(() => {
    const q = query(
      collection(db, "rooms", roomId, "messages"),
      orderBy("createdAt", "desc"),
      limit(50)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs: ChatMessage[] = [];
      snapshot.forEach((doc) => {
        msgs.push({ id: doc.id, ...doc.data() } as ChatMessage);
      });
      setMessages(msgs.reverse());
      
      if (snapshot.docChanges().length > 0) {
        const added = snapshot.docChanges().filter(c => c.type === "added");
        if (added.length > 0) {
          const newMsg = added[0].doc.data() as ChatMessage;
          if (newMsg.userId !== user?.uid && !isOpen) {
            setLatestMessage(newMsg);
            setShowToast(true);
            
            setTimeout(() => {
              setShowToast(false);
            }, 5000);
          }
        }
      }
    });

    return () => unsubscribe();
  }, [roomId, isOpen, user?.uid]);

  return (
    <>
      <ChatPanel 
        isOpen={isOpen} 
        onClose={() => setIsOpen(false)} 
        onOpen={() => setIsOpen(true)}
        messages={messages}
        roomId={roomId}
      />
      
      <ChatToast 
        message={latestMessage}
        isVisible={showToast && !isOpen}
        onClose={() => setShowToast(false)}
        roomId={roomId}
        onOpenChat={() => {
          setShowToast(false);
          setIsOpen(true);
        }}
      />
    </>
  );
}
