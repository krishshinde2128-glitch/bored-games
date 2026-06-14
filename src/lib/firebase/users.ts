import { db } from "./config";
import { doc, setDoc, getDoc, updateDoc, collection, query, where, getDocs } from "firebase/firestore";

export interface UserProfile {
  uid: string;
  username: string;
  createdAt: number;
  photoURL?: string;
  tag?: string;
  fullTag?: string;
}

export const getUserProfile = async (uid: string): Promise<UserProfile | null> => {
  const userRef = doc(db, "users", uid);
  const snap = await getDoc(userRef);
  if (snap.exists()) {
    return snap.data() as UserProfile;
  }
  return null;
};

export const createUserProfile = async (uid: string, username: string): Promise<void> => {
  const userRef = doc(db, "users", uid);
  const tag = Math.floor(1000 + Math.random() * 9000).toString();
  const fullTag = `${username}#${tag}`;
  
  await setDoc(userRef, {
    uid,
    username,
    tag,
    fullTag,
    createdAt: Date.now()
  });
};

export const updateUsername = async (uid: string, newUsername: string, currentTag?: string): Promise<string | undefined> => {
  const userRef = doc(db, "users", uid);
  if (currentTag) {
    const fullTag = `${newUsername}#${currentTag}`;
    await updateDoc(userRef, {
      username: newUsername,
      fullTag
    });
    return fullTag;
  } else {
    await updateDoc(userRef, {
      username: newUsername
    });
    return undefined;
  }
};

export const updateUserPhoto = async (uid: string, photoURL: string): Promise<void> => {
  const userRef = doc(db, "users", uid);
  await updateDoc(userRef, {
    photoURL
  });
};

export const assignTagIfMissing = async (uid: string, currentUsername: string): Promise<{tag: string, fullTag: string}> => {
  const userRef = doc(db, "users", uid);
  const tag = Math.floor(1000 + Math.random() * 9000).toString();
  const fullTag = `${currentUsername}#${tag}`;
  await updateDoc(userRef, {
    tag,
    fullTag
  });
  return { tag, fullTag };
};

export const searchUserByFullTag = async (fullTag: string): Promise<UserProfile | null> => {
  const usersRef = collection(db, "users");
  const q = query(usersRef, where("fullTag", "==", fullTag));
  const snap = await getDocs(q);
  if (snap.empty) return null;
  return snap.docs[0].data() as UserProfile;
};
