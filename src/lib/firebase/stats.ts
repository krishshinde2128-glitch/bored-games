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
  gamesPlayed: number;
}

export interface HeadToHeadStats {
  winsAgainst: number;
  lossesAgainst: number;
  gamesPlayed: number;
  games?: Record<string, { wins: number; losses: number; gamesPlayed: number }>;
}

export const recordMatchResult = async (gameId: string, player1Uid: string, player2Uid: string, winnerUid: string | 'draw') => {
  const batch = writeBatch(db);

  const p1GlobalRef = doc(db, "users", player1Uid, "stats", "global");
  const p1GameRef = doc(db, "users", player1Uid, "stats", `game_${gameId}`);
  const p1H2HRef = doc(db, "users", player1Uid, "stats", `vs_${player2Uid}`);

  const p2GlobalRef = doc(db, "users", player2Uid, "stats", "global");
  const p2GameRef = doc(db, "users", player2Uid, "stats", `game_${gameId}`);
  const p2H2HRef = doc(db, "users", player2Uid, "stats", `vs_${player1Uid}`);

  if (winnerUid === 'draw') {
    // Just increment games played everywhere
    batch.set(p1GlobalRef, { gamesPlayed: increment(1) }, { merge: true });
    batch.set(p1GameRef, { gamesPlayed: increment(1) }, { merge: true });
    batch.set(p1H2HRef, { 
      gamesPlayed: increment(1),
      [`games.${gameId}.gamesPlayed`]: increment(1)
    }, { merge: true });

    batch.set(p2GlobalRef, { gamesPlayed: increment(1) }, { merge: true });
    batch.set(p2GameRef, { gamesPlayed: increment(1) }, { merge: true });
    batch.set(p2H2HRef, { 
      gamesPlayed: increment(1),
      [`games.${gameId}.gamesPlayed`]: increment(1)
    }, { merge: true });
  } else {
    const isP1Winner = winnerUid === player1Uid;
    
    // P1 Updates
    batch.set(p1GlobalRef, { 
      totalWins: increment(isP1Winner ? 1 : 0), 
      totalLosses: increment(isP1Winner ? 0 : 1),
      gamesPlayed: increment(1) 
    }, { merge: true });
    batch.set(p1GameRef, { 
      wins: increment(isP1Winner ? 1 : 0),
      losses: increment(isP1Winner ? 0 : 1),
      gamesPlayed: increment(1)
    }, { merge: true });
    batch.set(p1H2HRef, { 
      winsAgainst: increment(isP1Winner ? 1 : 0),
      lossesAgainst: increment(isP1Winner ? 0 : 1),
      gamesPlayed: increment(1),
      [`games.${gameId}.wins`]: increment(isP1Winner ? 1 : 0),
      [`games.${gameId}.losses`]: increment(isP1Winner ? 0 : 1),
      [`games.${gameId}.gamesPlayed`]: increment(1)
    }, { merge: true });

    // P2 Updates
    batch.set(p2GlobalRef, { 
      totalWins: increment(!isP1Winner ? 1 : 0), 
      totalLosses: increment(!isP1Winner ? 0 : 1),
      gamesPlayed: increment(1) 
    }, { merge: true });
    batch.set(p2GameRef, { 
      wins: increment(!isP1Winner ? 1 : 0),
      losses: increment(!isP1Winner ? 0 : 1),
      gamesPlayed: increment(1)
    }, { merge: true });
    batch.set(p2H2HRef, { 
      winsAgainst: increment(!isP1Winner ? 1 : 0),
      lossesAgainst: increment(!isP1Winner ? 0 : 1),
      gamesPlayed: increment(1),
      [`games.${gameId}.wins`]: increment(!isP1Winner ? 1 : 0),
      [`games.${gameId}.losses`]: increment(!isP1Winner ? 0 : 1),
      [`games.${gameId}.gamesPlayed`]: increment(1)
    }, { merge: true });
  }

  await batch.commit();
};

export const getUserGlobalStats = async (uid: string): Promise<GlobalStats> => {
  const snap = await getDoc(doc(db, "users", uid, "stats", "global"));
  if (!snap.exists()) return { totalWins: 0, totalLosses: 0, gamesPlayed: 0 };
  return snap.data() as GlobalStats;
};

export const getHeadToHeadStats = async (uid1: string, uid2: string): Promise<HeadToHeadStats> => {
  const snap = await getDoc(doc(db, "users", uid1, "stats", `vs_${uid2}`));
  if (!snap.exists()) return { winsAgainst: 0, lossesAgainst: 0, gamesPlayed: 0 };
  return snap.data() as HeadToHeadStats;
};
