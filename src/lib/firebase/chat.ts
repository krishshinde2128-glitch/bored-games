import { db } from "./config";
import { 
  collection, 
  addDoc, 
  serverTimestamp, 
} from "firebase/firestore";

export interface ChatMessage {
  id?: string;
  roomId: string;
  userId: string;
  displayName: string;
  text: string;
  createdAt: any; // Using any to accommodate serverTimestamp vs local dates easily
}

export const sendMessage = async (roomId: string, userId: string, displayName: string, text: string) => {
  if (!text.trim()) return;
  const messagesRef = collection(db, "rooms", roomId, "messages");
  await addDoc(messagesRef, {
    roomId,
    userId,
    displayName,
    text,
    createdAt: serverTimestamp()
  });
};
