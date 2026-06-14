import { db } from "./config";
import { collection, doc, setDoc, getDoc, getDocs, updateDoc, query, where, deleteDoc, onSnapshot } from "firebase/firestore";
import { searchUserByFullTag, getUserProfile } from "./users";

export interface FriendRequest {
  id: string;
  fromUid: string;
  fromFullTag: string;
  toUid: string;
  toFullTag: string;
  status: 'pending' | 'accepted' | 'declined';
  createdAt: number;
}

export interface Friend {
  uid: string;
  fullTag: string;
  addedAt: number;
}

export const sendFriendRequest = async (fromUid: string, toFullTag: string): Promise<{ success: boolean; message: string }> => {
  const toUser = await searchUserByFullTag(toFullTag);
  if (!toUser) return { success: false, message: "User not found." };
  if (toUser.uid === fromUid) return { success: false, message: "You cannot add yourself." };

  const fromUser = await getUserProfile(fromUid);
  if (!fromUser || !fromUser.fullTag) return { success: false, message: "Your profile is incomplete." };

  const friendRef = doc(db, "users", fromUid, "friends", toUser.uid);
  const friendSnap = await getDoc(friendRef);
  if (friendSnap.exists()) return { success: false, message: "You are already friends." };

  const requestsRef = collection(db, "friend_requests");
  const q1 = query(requestsRef, where("fromUid", "==", fromUid), where("toUid", "==", toUser.uid), where("status", "==", "pending"));
  const snap1 = await getDocs(q1);
  if (!snap1.empty) return { success: false, message: "Request already sent." };

  const q2 = query(requestsRef, where("fromUid", "==", toUser.uid), where("toUid", "==", fromUid), where("status", "==", "pending"));
  const snap2 = await getDocs(q2);
  if (!snap2.empty) return { success: false, message: "They already sent you a request. Accept it instead." };

  const newRequestRef = doc(collection(db, "friend_requests"));
  await setDoc(newRequestRef, {
    id: newRequestRef.id,
    fromUid,
    fromFullTag: fromUser.fullTag,
    toUid: toUser.uid,
    toFullTag: toUser.fullTag,
    status: 'pending',
    createdAt: Date.now()
  });

  return { success: true, message: "Friend request sent!" };
};

export const acceptFriendRequest = async (requestId: string): Promise<void> => {
  const reqRef = doc(db, "friend_requests", requestId);
  const reqSnap = await getDoc(reqRef);
  if (!reqSnap.exists()) return;

  const req = reqSnap.data() as FriendRequest;
  if (req.status !== 'pending') return;

  await updateDoc(reqRef, { status: 'accepted' });

  const friend1Ref = doc(db, "users", req.fromUid, "friends", req.toUid);
  const friend2Ref = doc(db, "users", req.toUid, "friends", req.fromUid);

  await setDoc(friend1Ref, { uid: req.toUid, fullTag: req.toFullTag, addedAt: Date.now() });
  await setDoc(friend2Ref, { uid: req.fromUid, fullTag: req.fromFullTag, addedAt: Date.now() });
};

export const declineFriendRequest = async (requestId: string): Promise<void> => {
  const reqRef = doc(db, "friend_requests", requestId);
  await updateDoc(reqRef, { status: 'declined' });
};

export const removeFriend = async (uid1: string, uid2: string): Promise<void> => {
  await deleteDoc(doc(db, "users", uid1, "friends", uid2));
  await deleteDoc(doc(db, "users", uid2, "friends", uid1));
};

export const subscribeToPendingRequests = (uid: string, callback: (requests: FriendRequest[]) => void) => {
  const q = query(collection(db, "friend_requests"), where("toUid", "==", uid), where("status", "==", "pending"));
  return onSnapshot(q, (snap) => {
    const reqs = snap.docs.map(d => d.data() as FriendRequest);
    callback(reqs);
  });
};

export const subscribeToFriendsList = (uid: string, callback: (friends: Friend[]) => void) => {
  const q = collection(db, "users", uid, "friends");
  return onSnapshot(q, (snap) => {
    const friends = snap.docs.map(d => d.data() as Friend);
    callback(friends);
  });
};
