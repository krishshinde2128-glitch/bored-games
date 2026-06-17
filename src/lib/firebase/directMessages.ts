import { db } from "./config";
import { collection, doc, setDoc, query, orderBy, onSnapshot } from "firebase/firestore";
import { getUserProfile } from "./users";

export interface DirectMessage {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  createdAt: number;
  type?: 'text' | 'challenge';
  challengeGameId?: string;
}

export interface DMThread {
  id: string;
  participants: string[];
  lastMessage: string;
  lastMessageTime: number;
}

export const getDMThreadId = (uid1: string, uid2: string) => {
  return `dm_${[uid1, uid2].sort().join('_')}`;
};

export const sendDirectMessage = async (fromUid: string, toUid: string, text: string) => {
  if (!text.trim()) return;
  const threadId = getDMThreadId(fromUid, toUid);
  const threadRef = doc(db, "direct_messages", threadId);
  const msgsRef = collection(threadRef, "messages");
  
  const fromProfile = await getUserProfile(fromUid);
  if (!fromProfile) return;

  const msgId = doc(msgsRef).id;
  const now = Date.now();

  await setDoc(threadRef, {
    id: threadId,
    participants: [fromUid, toUid],
    lastMessage: text,
    lastMessageTime: now
  }, { merge: true });

  await setDoc(doc(msgsRef, msgId), {
    id: msgId,
    senderId: fromUid,
    senderName: fromProfile.username,
    text,
    createdAt: now,
    type: 'text'
  });
};

export const sendChallenge = async (fromUid: string, toUid: string, gameId: string, gameName: string) => {
  const threadId = getDMThreadId(fromUid, toUid);
  const threadRef = doc(db, "direct_messages", threadId);
  const msgsRef = collection(threadRef, "messages");
  
  const fromProfile = await getUserProfile(fromUid);
  if (!fromProfile) return;

  const msgId = doc(msgsRef).id;
  const now = Date.now();

  await setDoc(threadRef, {
    id: threadId,
    participants: [fromUid, toUid],
    lastMessage: `Sent a challenge for ${gameName}`,
    lastMessageTime: now
  }, { merge: true });

  await setDoc(doc(msgsRef, msgId), {
    id: msgId,
    senderId: fromUid,
    senderName: fromProfile.username,
    text: `Let's play ${gameName}!`,
    createdAt: now,
    type: 'challenge',
    challengeGameId: gameId
  });

  const notificationId = doc(collection(db, "users", toUid, "notifications")).id;
  await setDoc(doc(db, "users", toUid, "notifications", notificationId), {
    id: notificationId,
    type: 'challenge',
    fromUid,
    fromName: fromProfile.username,
    gameName,
    gameId,
    createdAt: now,
    read: false
  });
};

export const subscribeToDirectMessages = (threadId: string, callback: (msgs: DirectMessage[]) => void) => {
  const msgsRef = collection(db, "direct_messages", threadId, "messages");
  const q = query(msgsRef, orderBy("createdAt", "asc"));
  return onSnapshot(q, (snap) => {
    const msgs = snap.docs.map(d => d.data() as DirectMessage);
    callback(msgs);
  });
};
