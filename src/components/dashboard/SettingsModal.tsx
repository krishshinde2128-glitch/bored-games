"use client";

import { useState, useRef, useEffect } from "react";
import { useAuthStore } from "@/store/authStore";
import { auth } from "@/lib/firebase/config";
import { signOut } from "firebase/auth";
import { updateUsername, updateUserPhoto } from "@/lib/firebase/users";
import { getUserGlobalStats, GlobalStats } from "@/lib/firebase/stats";
import { Edit2, Check, X, Camera, Settings, Trophy, UserCircle, Activity } from "lucide-react";
import { db } from "@/lib/firebase/config";
import { collection, query, getDocs } from "firebase/firestore";

export function SettingsModal() {
  const { user, setUser } = useAuthStore();
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"profile" | "stats">("profile");

  // Profile State
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Stats State
  const [globalStats, setGlobalStats] = useState<GlobalStats | null>(null);
  const [gameStats, setGameStats] = useState<{ id: string, wins: number, losses: number }[]>([]);

  useEffect(() => {
    if (isOpen && user && !globalStats) {
      getUserGlobalStats(user.uid).then(setGlobalStats);
      
      // Fetch game-specific stats
      const fetchGameStats = async () => {
        const statsRef = collection(db, "users", user.uid, "stats");
        const snap = await getDocs(statsRef);
        const gStats: any[] = [];
        snap.forEach(doc => {
          if (doc.id.startsWith("game_")) {
            const data = doc.data();
            gStats.push({
              id: doc.id.replace("game_", ""),
              wins: data.wins || 0,
              losses: data.losses || 0
            });
          }
        });
        setGameStats(gStats);
      };
      fetchGameStats();
    }
  }, [isOpen, user]);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user || !auth.currentUser) return;
    
    setLoading(true);
    setUploadError("");
    
    try {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = async () => {
          const canvas = document.createElement("canvas");
          const MAX_SIZE = 150;
          let width = img.width;
          let height = img.height;
          
          if (width > height) {
            if (width > MAX_SIZE) {
              height = Math.round((height * MAX_SIZE) / width);
              width = MAX_SIZE;
            }
          } else {
            if (height > MAX_SIZE) {
              width = Math.round((width * MAX_SIZE) / height);
              height = MAX_SIZE;
            }
          }
          
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          ctx?.drawImage(img, 0, 0, width, height);
          
          const base64Url = canvas.toDataURL("image/jpeg", 0.7);
          
          await updateUserPhoto(auth.currentUser!.uid, base64Url);
          setUser({ ...user, photoURL: base64Url });
          
          setLoading(false);
          if (fileInputRef.current) fileInputRef.current.value = "";
        };
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(file);
      
    } catch (err: any) {
      console.error("Error setting photo:", err);
      setUploadError("Failed to update profile picture.");
      setLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleSave = async () => {
    if (editName.trim() && user) {
      setLoading(true);
      const newFullTag = await updateUsername(user.uid, editName.trim(), user.tag);
      useAuthStore.getState().setUsername(editName.trim(), newFullTag);
      setIsEditing(false);
      setLoading(false);
    }
  };

  const bestGame = gameStats.length > 0 
    ? gameStats.reduce((prev, current) => (prev.wins > current.wins) ? prev : current)
    : null;

  return (
    <>
      {/* Floating Button */}
      <button 
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-40 bg-dark-cyan text-wheat p-4 rounded-full shadow-2xl hover:bg-fiery-terracotta hover:scale-110 transition-all active:scale-95 group"
      >
        <Settings size={28} className="group-hover:rotate-90 transition-transform duration-500" />
      </button>

      {/* Modal Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-md p-4">
          <div className="bg-wheat w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden border-2 border-fiery-terracotta/30 flex flex-col h-[80vh] md:h-[600px]">
            
            {/* Header */}
            <div className="bg-dark-cyan p-6 flex justify-between items-center text-wheat shadow-md">
              <h2 className="text-2xl font-black tracking-tight flex items-center gap-3">
                <Settings className="text-fiery-terracotta" /> Player Settings
              </h2>
              <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-white/10 rounded-xl transition-colors">
                <X size={24} />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b-2 border-espresso/10">
              <button 
                onClick={() => setActiveTab("profile")}
                className={`flex-1 py-4 font-bold flex justify-center items-center gap-2 transition-colors ${activeTab === "profile" ? "text-fiery-terracotta border-b-4 border-fiery-terracotta bg-white/30" : "text-espresso/60 hover:bg-white/20"}`}
              >
                <UserCircle size={18} /> Profile
              </button>
              <button 
                onClick={() => setActiveTab("stats")}
                className={`flex-1 py-4 font-bold flex justify-center items-center gap-2 transition-colors ${activeTab === "stats" ? "text-dark-cyan border-b-4 border-dark-cyan bg-white/30" : "text-espresso/60 hover:bg-white/20"}`}
              >
                <Trophy size={18} /> Statistics
              </button>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-6 bg-gradient-to-br from-wheat to-wheat/80">
              
              {/* --- PROFILE TAB --- */}
              {activeTab === "profile" && (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
                  <div className="flex flex-col md:flex-row items-center md:items-start gap-8 bg-white/40 p-8 rounded-3xl border border-espresso/10">
                    <div className="relative group cursor-pointer" onClick={() => !loading && fileInputRef.current?.click()}>
                      {user?.photoURL ? (
                        <img src={user.photoURL} alt="Avatar" className={`w-32 h-32 rounded-3xl border-4 border-fiery-terracotta/50 shadow-xl object-cover transition-opacity ${loading ? 'opacity-50' : 'group-hover:opacity-75'}`} />
                      ) : (
                        <div className={`w-32 h-32 rounded-3xl bg-gradient-to-br from-fiery-terracotta/20 to-stormy-teal/20 border-4 border-fiery-terracotta/30 flex items-center justify-center text-5xl font-bold text-stormy-teal shadow-xl transition-opacity ${loading ? 'opacity-50' : 'group-hover:opacity-75'}`}>
                          {user?.displayName?.charAt(0) || "U"}
                        </div>
                      )}
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        {loading ? (
                          <div className="w-8 h-8 border-4 border-white/80 border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <Camera className="text-white drop-shadow-md" size={36} />
                        )}
                      </div>
                      <input type="file" ref={fileInputRef} onChange={handlePhotoUpload} accept="image/*" className="hidden" />
                    </div>

                    <div className="flex-1 text-center md:text-left space-y-4">
                      {isEditing ? (
                        <div className="flex items-center justify-center md:justify-start gap-2">
                          <input
                            type="text"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            className="bg-white border-2 border-fiery-terracotta/50 rounded-xl px-4 py-2 text-espresso outline-none focus:border-stormy-teal w-48 font-bold text-xl shadow-inner"
                            maxLength={20}
                            autoFocus
                          />
                          <button disabled={loading} onClick={handleSave} className="p-2.5 rounded-xl bg-emerald-500 text-white hover:bg-emerald-600 shadow-md">
                            <Check size={18} />
                          </button>
                          <button disabled={loading} onClick={() => setIsEditing(false)} className="p-2.5 rounded-xl bg-red-500 text-white hover:bg-red-600 shadow-md">
                            <X size={18} />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center md:justify-start gap-3">
                          <h2 className="text-3xl font-black text-espresso tracking-tight">{user?.username || user?.displayName?.split(" ")[0] || "Player"}</h2>
                          <button onClick={() => { setEditName(user?.username || ""); setIsEditing(true); }} className="p-2 rounded-xl bg-fiery-terracotta/10 text-fiery-terracotta hover:bg-fiery-terracotta hover:text-white transition-colors">
                            <Edit2 size={16} />
                          </button>
                        </div>
                      )}
                      
                      <div className="bg-espresso/5 rounded-xl p-4 border border-espresso/10 space-y-2">
                        <div className="flex justify-between items-center text-sm">
                          <span className="font-bold text-espresso/60">Discord Tag:</span>
                          <span className="font-bold bg-dark-cyan/20 text-dark-cyan px-2 py-0.5 rounded-md">{user?.fullTag || "N/A"}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                          <span className="font-bold text-espresso/60">Email:</span>
                          <span className="font-medium text-espresso">{user?.email || "N/A"}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {uploadError && <p className="text-red-500 text-sm font-bold text-center">{uploadError}</p>}

                  <button 
                    onClick={() => signOut(auth)}
                    className="w-full py-4 rounded-2xl bg-red-500/10 hover:bg-red-500 text-red-600 hover:text-white transition-all text-lg font-black border-2 border-red-500/30 active:scale-[0.98]"
                  >
                    Sign Out & Exit
                  </button>
                </div>
              )}

              {/* --- STATS TAB --- */}
              {activeTab === "stats" && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
                  
                  {/* Global Overview */}
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-emerald-500/10 border-2 border-emerald-500/30 rounded-3xl p-6 text-center shadow-sm">
                      <h4 className="text-emerald-700 font-black text-sm uppercase tracking-widest mb-1">Total Wins</h4>
                      <p className="text-4xl font-black text-emerald-600">{globalStats?.totalWins || 0}</p>
                    </div>
                    <div className="bg-red-500/10 border-2 border-red-500/30 rounded-3xl p-6 text-center shadow-sm">
                      <h4 className="text-red-700 font-black text-sm uppercase tracking-widest mb-1">Total Losses</h4>
                      <p className="text-4xl font-black text-red-600">{globalStats?.totalLosses || 0}</p>
                    </div>
                    <div className="bg-stormy-teal/10 border-2 border-stormy-teal/30 rounded-3xl p-6 text-center shadow-sm">
                      <h4 className="text-stormy-teal font-black text-sm uppercase tracking-widest mb-1">Matches</h4>
                      <p className="text-4xl font-black text-stormy-teal">{globalStats?.gamesPlayed || 0}</p>
                    </div>
                  </div>

                  {/* Highlights */}
                  <div className="bg-white/50 rounded-3xl p-6 border border-espresso/10">
                    <h3 className="text-xl font-black text-espresso mb-4 flex items-center gap-2">
                      <Activity className="text-fiery-terracotta" /> Career Highlights
                    </h3>
                    <div className="bg-gradient-to-r from-fiery-terracotta/20 to-dark-cyan/20 rounded-2xl p-6 border border-white">
                      <p className="text-espresso/80 font-medium">Best Performing Game</p>
                      {bestGame && bestGame.wins > 0 ? (
                        <div className="mt-2 flex items-end gap-3">
                          <h4 className="text-3xl font-black text-espresso capitalize">{bestGame.id}</h4>
                          <span className="text-lg font-bold text-emerald-600 mb-1">{bestGame.wins} Wins</span>
                        </div>
                      ) : (
                        <h4 className="text-2xl font-black text-espresso mt-2">No wins recorded yet!</h4>
                      )}
                    </div>
                  </div>

                  {/* Per Game Breakdown */}
                  <div className="bg-white/50 rounded-3xl p-6 border border-espresso/10">
                    <h3 className="text-xl font-black text-espresso mb-4">Game Breakdown</h3>
                    {gameStats.length === 0 ? (
                      <p className="text-espresso/60 italic">You haven't played any games yet.</p>
                    ) : (
                      <div className="space-y-3">
                        {gameStats.map(stat => {
                          const total = stat.wins + stat.losses;
                          const winRate = total > 0 ? Math.round((stat.wins / total) * 100) : 0;
                          return (
                            <div key={stat.id} className="bg-white rounded-2xl p-4 border border-espresso/5 flex items-center justify-between shadow-sm">
                              <span className="font-bold text-lg text-espresso capitalize">{stat.id}</span>
                              <div className="flex items-center gap-6">
                                <div className="text-right">
                                  <span className="block text-emerald-500 font-black">{stat.wins} W</span>
                                  <span className="block text-red-500 font-bold text-sm">{stat.losses} L</span>
                                </div>
                                <div className="w-16 h-16 rounded-full border-4 border-espresso/5 flex items-center justify-center relative">
                                  <svg className="absolute inset-0 w-full h-full -rotate-90">
                                    <circle cx="28" cy="28" r="26" fill="transparent" stroke="currentColor" strokeWidth="4" className="text-espresso/5" />
                                    <circle cx="28" cy="28" r="26" fill="transparent" stroke="currentColor" strokeWidth="4" strokeDasharray={`${(winRate / 100) * 163} 163`} className="text-emerald-500" />
                                  </svg>
                                  <span className="text-xs font-black text-espresso">{winRate}%</span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                </div>
              )}
            </div>
            
          </div>
        </div>
      )}
    </>
  );
}
