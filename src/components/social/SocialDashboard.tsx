"use client";

import { useState, useEffect } from "react";
import { useAuthStore } from "@/store/authStore";
import { Friend, FriendRequest, subscribeToFriendsList, subscribeToPendingRequests, sendFriendRequest, acceptFriendRequest, declineFriendRequest } from "@/lib/firebase/social";
import { UserPlus, Check, X, MessageCircle } from "lucide-react";
import { DirectMessageModal } from "./DirectMessageModal";

export function SocialDashboard() {
  const { user } = useAuthStore();
  const [friends, setFriends] = useState<Friend[]>([]);
  const [requests, setRequests] = useState<FriendRequest[]>([]);
  const [addTag, setAddTag] = useState("");
  const [statusMsg, setStatusMsg] = useState("");
  const [activeChatUser, setActiveChatUser] = useState<{ uid: string, fullTag: string } | null>(null);

  useEffect(() => {
    if (!user) return;
    const unsubFriends = subscribeToFriendsList(user.uid, setFriends);
    const unsubReqs = subscribeToPendingRequests(user.uid, setRequests);
    return () => {
      unsubFriends();
      unsubReqs();
    };
  }, [user]);

  const handleAddFriend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !addTag.includes("#")) {
      setStatusMsg("Format must be Name#1234");
      return;
    }
    const res = await sendFriendRequest(user.uid, addTag);
    setStatusMsg(res.message);
    if (res.success) setAddTag("");
    setTimeout(() => setStatusMsg(""), 3000);
  };

  if (!user) return null;

  return (
    <div className="bg-dark-cyan/20 border border-fiery-terracotta/30 rounded-3xl p-6 shadow-md flex flex-col h-[500px]">
      <h3 className="text-xl font-bold text-espresso mb-4 flex items-center gap-2">
        Social Hub
        <span className="text-sm font-normal bg-fiery-terracotta/20 text-fiery-terracotta px-2 py-0.5 rounded-full">
          {user.fullTag}
        </span>
      </h3>

      {/* Add Friend */}
      <form onSubmit={handleAddFriend} className="mb-6">
        <div className="flex gap-2">
          <input 
            type="text" 
            placeholder="Add friend (krish#1234)" 
            value={addTag}
            onChange={(e) => setAddTag(e.target.value)}
            className="flex-1 bg-wheat border border-fiery-terracotta/50 rounded-xl px-3 py-2 text-sm outline-none focus:border-stormy-teal text-espresso"
          />
          <button type="submit" className="bg-dark-cyan text-wheat p-2 rounded-xl hover:bg-fiery-terracotta transition-colors">
            <UserPlus size={18} />
          </button>
        </div>
        {statusMsg && <p className="text-xs font-bold text-fiery-terracotta mt-2">{statusMsg}</p>}
      </form>

      {/* Lists */}
      <div className="flex-1 overflow-y-auto custom-scrollbar space-y-6 pr-2">
        {/* Pending Requests */}
        {requests.length > 0 && (
          <div>
            <h4 className="text-xs font-black uppercase text-fiery-terracotta mb-2 tracking-wider">Pending Requests</h4>
            <div className="space-y-2">
              {requests.map(req => (
                <div key={req.id} className="flex items-center justify-between bg-wheat/50 p-2 rounded-lg border border-fiery-terracotta/20">
                  <span className="text-sm font-bold text-espresso">{req.fromFullTag}</span>
                  <div className="flex gap-1">
                    <button onClick={() => acceptFriendRequest(req.id)} className="p-1.5 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors"><Check size={14} /></button>
                    <button onClick={() => declineFriendRequest(req.id)} className="p-1.5 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors"><X size={14} /></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Friends List */}
        <div>
          <h4 className="text-xs font-black uppercase text-fiery-terracotta mb-2 tracking-wider">Friends ({friends.length})</h4>
          {friends.length === 0 ? (
            <p className="text-sm text-espresso/50 italic">No friends yet. Add someone!</p>
          ) : (
            <div className="space-y-2">
              {friends.map(friend => (
                <div key={friend.uid} className="flex items-center justify-between bg-wheat/80 p-3 rounded-xl shadow-sm border border-fiery-terracotta/10 group hover:border-stormy-teal transition-colors">
                  <span className="text-sm font-bold text-espresso">{friend.fullTag}</span>
                  <button 
                    onClick={() => setActiveChatUser({ uid: friend.uid, fullTag: friend.fullTag })}
                    className="text-dark-cyan p-1.5 rounded-lg hover:bg-dark-cyan hover:text-wheat transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <MessageCircle size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {activeChatUser && (
        <DirectMessageModal 
          friendUid={activeChatUser.uid} 
          friendTag={activeChatUser.fullTag} 
          onClose={() => setActiveChatUser(null)} 
        />
      )}
    </div>
  );
}
