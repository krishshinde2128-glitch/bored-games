"use client";

import { useState, useEffect } from "react";
import { auth, googleProvider } from "@/lib/firebase/config";
import { onAuthStateChanged, signInWithPopup } from "firebase/auth";
import { useAuthStore } from "@/store/authStore";
import { getUserProfile, createUserProfile } from "@/lib/firebase/users";

function UsernamePromptModal({ uid, defaultName, onSuccess }: { uid: string, defaultName: string, onSuccess: (name: string) => void }) {
  const [name, setName] = useState(defaultName.split(' ')[0] || "");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    await createUserProfile(uid, name.trim());
    onSuccess(name.trim());
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm">
      <div className="bg-white border border-zinc-100 p-8 rounded-3xl max-w-md w-full mx-4 shadow-2xl">
        <h2 className="text-3xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-pink-500 mb-2">
          Welcome to Nexus
        </h2>
        <p className="text-zinc-500 mb-6">What should we call you?</p>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input 
            type="text" 
            value={name} 
            onChange={(e) => setName(e.target.value)} 
            placeholder="Enter username..." 
            maxLength={20}
            className="bg-white border border-zinc-200 rounded-xl px-4 py-3 text-zinc-900 focus:outline-none focus:border-purple-500 transition-colors shadow-sm"
            required
            autoFocus
          />
          <button 
            type="submit" 
            disabled={loading || name.trim().length < 3}
            className="bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold rounded-xl py-3 disabled:opacity-50 hover:opacity-90 transition-opacity shadow-md"
          >
            {loading ? "Saving..." : "Start Playing"}
          </button>
        </form>
      </div>
    </div>
  );
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { setUser, setIsLoading, user, isLoading } = useAuthStore();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        const profile = await getUserProfile(currentUser.uid);
        setUser({
          uid: currentUser.uid,
          displayName: currentUser.displayName,
          photoURL: profile?.photoURL || currentUser.photoURL,
          username: profile?.username || null
        });
      } else {
        setUser(null);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [setUser, setIsLoading]);

  const login = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error("Login failed:", error);
    }
  };

  if (isLoading) {
    return <div className="h-screen w-screen flex items-center justify-center bg-slate-50 text-zinc-900">Loading...</div>;
  }

  if (!user) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-slate-50 text-zinc-900 gap-4 relative overflow-hidden">
        {/* Background Accents */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-[100px] -z-10" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-pink-500/10 rounded-full blur-[100px] -z-10" />
        
        <div className="text-center space-y-4 mb-8">
          <h1 className="text-5xl md:text-7xl font-black tracking-tighter">
            Nexus <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-pink-500">Hub</span>
          </h1>
          <p className="text-zinc-500 text-lg">Sign in to access 13 multiplayer games.</p>
        </div>
        <button 
          onClick={login}
          className="flex items-center gap-3 bg-white border border-zinc-200 px-8 py-4 rounded-full font-semibold hover:bg-slate-50 hover:shadow-lg transition-all active:scale-95 shadow-sm text-zinc-900"
        >
          Authenticate with Google
        </button>
      </div>
    );
  }

  if (user && !user.username) {
    return (
      <>
        {children}
        <UsernamePromptModal 
          uid={user.uid} 
          defaultName={user.displayName || "Player"} 
          onSuccess={(name) => useAuthStore.getState().setUsername(name)}
        />
      </>
    );
  }

  return <>{children}</>;
}
