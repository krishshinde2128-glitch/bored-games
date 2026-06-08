"use client";

import { useState, useRef } from "react";
import { useAuthStore } from "@/store/authStore";
import { auth, storage } from "@/lib/firebase/config";
import { signOut, updateProfile } from "firebase/auth";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { updateUsername, updateUserPhoto } from "@/lib/firebase/users";
import { Edit2, Check, X, Camera } from "lucide-react";

export function ProfilePanel() {
  const { user, setUser } = useAuthStore();
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user || !auth.currentUser) return;
    
    setLoading(true);
    setUploadError("");
    
    try {
      // 1. Read file as Data URL
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = async () => {
          // 2. Compress using Canvas (150x150)
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
          
          // 3. Export as low-quality JPEG Base64
          const base64Url = canvas.toDataURL("image/jpeg", 0.7);
          
          // 4. Save directly to Firestore profile
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

  const startEditing = () => {
    setEditName(user?.username || user?.displayName?.split(" ")[0] || "");
    setIsEditing(true);
  };

  const handleSave = async () => {
    if (!user || !editName.trim()) return;
    setLoading(true);
    await updateUsername(user.uid, editName.trim());
    useAuthStore.getState().setUsername(editName.trim());
    setIsEditing(false);
    setLoading(false);
  };

  return (
    <div className="p-6 rounded-3xl bg-dark-cyan/20 border border-fiery-terracotta/30 backdrop-blur-2xl shadow-xl shadow-fiery-terracotta/10">
      <div className="flex items-center gap-5 mb-6">
        <div className="relative group cursor-pointer" onClick={() => !loading && fileInputRef.current?.click()}>
          {user?.photoURL ? (
            <img src={user.photoURL} alt="Avatar" className={`w-16 h-16 rounded-2xl border border-fiery-terracotta/50 shadow-md object-cover transition-opacity ${loading ? 'opacity-50' : 'group-hover:opacity-75'}`} />
          ) : (
            <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br from-fiery-terracotta/20 to-stormy-teal/20 border border-fiery-terracotta/30 flex items-center justify-center text-2xl font-bold text-stormy-teal shadow-md transition-opacity ${loading ? 'opacity-50' : 'group-hover:opacity-75'}`}>
              {user?.displayName?.charAt(0) || "U"}
            </div>
          )}
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/80 border-t-transparent rounded-full animate-spin" />
            ) : (
              <Camera className="text-white drop-shadow-md" size={24} />
            )}
          </div>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handlePhotoUpload} 
            accept="image/*" 
            className="hidden" 
          />
        </div>
        <div>
          {isEditing ? (
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="bg-wheat border border-fiery-terracotta/50 rounded-lg px-2 py-1 text-espresso outline-none focus:border-stormy-teal w-32 font-bold shadow-inner placeholder:text-fiery-terracotta/50"
                maxLength={20}
                autoFocus
              />
              <button disabled={loading} onClick={handleSave} className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/40">
                <Check size={14} />
              </button>
              <button disabled={loading} onClick={() => setIsEditing(false)} className="p-1.5 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/40">
                <X size={14} />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-bold text-espresso tracking-tight">{user?.username || user?.displayName?.split(" ")[0] || "Player"}</h2>
              <button onClick={startEditing} className="p-1.5 rounded-lg hover:bg-fiery-terracotta/10 text-fiery-terracotta hover:text-stormy-teal transition-colors">
                <Edit2 size={14} />
              </button>
            </div>
          )}
          <div className="flex items-center gap-2 mt-1">
            <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.6)]" />
            <p className="text-zinc-400 text-sm font-medium">Online • Record: 12 - 4</p>
          </div>
        </div>
      </div>
      {uploadError && (
        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl">
          <p className="text-red-400 text-sm font-bold text-center">{uploadError}</p>
        </div>
      )}
      <button 
        onClick={() => signOut(auth)}
        className="w-full py-3 rounded-xl bg-dark-cyan hover:bg-fiery-terracotta text-espresso hover:text-wheat transition-all text-sm font-bold border border-fiery-terracotta/30 active:scale-[0.98]"
      >
        Sign Out
      </button>
    </div>
  );
}
