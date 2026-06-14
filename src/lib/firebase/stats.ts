import { db } from "./config";
import { doc, getDoc, increment, writeBatch } from "firebase/firestore";

export interface GlobalStats {
  totalWins: number;
  totalLosses: number;
  gamesPlayed: number;
}

export interface GameSpecificStats {
  wins: number;
  losses: number;
}

export interface HeadToHeadStats {
  winsAgainst: number;
  lossesAgainst: number;
}

export const recordMatchResult = async (gameId: string, winnerUid: string, loserUid: string) => {
  const batch = writeBatch(db);

  // Winner Refs
  const winnerGlobalRef = doc(db, "users", winnerUid, "stats", "global");
  const winnerGameRef = doc(db, "users", winnerUid, "stats", `game_${gameId}`);
  const winnerH2HRef = doc(db, "users", winnerUid, "stats", `vs_${loserUid}`);

  // Loser Refs
  const loserGlobalRef = doc(db, "users", loserUid, "stats", "global");
  const loserGameRef = doc(db, "users", loserUid, "stats", `game_${gameId}`);
  const loserH2HRef = doc(db, "users", loserUid, "stats", `vs_${winnerUid}`);

  // Update Winner
  batch.set(winnerGlobalRef, { totalWins: increment(1), gamesPlayed: increment(1) }, { merge: true });
  batch.set(winnerGameRef, { wins: increment(1) }, { merge: true });
  batch.set(winnerH2HRef, { winsAgainst: increment(1) }, { merge: true });

  // Update Loser
  batch.set(loserGlobalRef, { totalLosses: increment(1), gamesPlayed: increment(1) }, { merge: true });
  batch.set(loserGameRef, { losses: increment(1) }, { merge: true });
  batch.set(loserH2HRef, { lossesAgainst: increment(1) }, { merge: true });

  await batch.commit();
};

export const getUserGlobalStats = async (uid: string): Promise<GlobalStats> => {
  const snap = await getDoc(doc(db, "users", uid, "stats", "global"));
  if (!snap.exists()) return { totalWins: 0, totalLosses: 0, gamesPlayed: 0 };
  return snap.data() as GlobalStats;
};

export const getHeadToHeadStats = async (uid1: string, uid2: string): Promise<HeadToHeadStats> => {
  const snap = await getDoc(doc(db, "users", uid1, "stats", `vs_${uid2}`));
  if (!snap.exists()) return { winsAgainst: 0, lossesAgainst: 0 };
  return snap.data() as HeadToHeadStats;
};
