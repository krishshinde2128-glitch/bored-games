import { db } from "./config";
import { doc, setDoc, getDoc, updateDoc } from "firebase/firestore";

export interface UserProfile {
  uid: string;
  username: string;
  createdAt: number;
  photoURL?: string;
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
  await setDoc(userRef, {
    uid,
    username,
    createdAt: Date.now()
  });
};

export const updateUsername = async (uid: string, newUsername: string): Promise<void> => {
  const userRef = doc(db, "users", uid);
  await updateDoc(userRef, {
    username: newUsername
  });
};

export const updateUserPhoto = async (uid: string, photoURL: string): Promise<void> => {
  const userRef = doc(db, "users", uid);
  await updateDoc(userRef, {
    photoURL
  });
};
