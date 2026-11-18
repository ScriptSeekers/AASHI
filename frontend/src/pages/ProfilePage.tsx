import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.js';
import { userApi } from '../api/endpoints.js';
import { soundManager } from '../utils/sound.js';
import { User, Mail, AtSign, Heart, Edit3, Check, Loader2 } from 'lucide-react';

export const ProfilePage: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [avatar, setAvatar] = useState(user?.avatar || '');
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSavedSuccess(false);
    try {
      soundManager.playPop();
      await userApi.updateProfile({ name, bio, avatar });
      await refreshUser();
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2500);
    } catch (err: any) {
      alert(err.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 pb-24 md:pb-12">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-2xl bg-aashi-pink/40 text-aashi-berry flex items-center justify-center shadow-sm">
          <User className="w-6 h-6" />
        </div>
        <div>
          <h1 className="font-heading font-black text-3xl text-aashi-plum">Player Profile</h1>
          <p className="text-xs text-aashi-plum/70 font-medium">Manage your couple presence and avatar</p>
        </div>
      </div>

      <div className="p-8 rounded-3xl bg-white/90 backdrop-blur-md border border-aashi-pink shadow-glass">
        {/* Avatar Display */}
        <div className="flex flex-col items-center mb-6">
          <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-aashi-berry to-aashi-lavender p-1 shadow-neon mb-3">
            <div className="w-full h-full rounded-full bg-white flex items-center justify-center overflow-hidden">
              {avatar ? (
                <img src={avatar} alt={user?.name} className="w-full h-full object-cover" />
              ) : (
                <span className="font-heading font-black text-3xl text-aashi-berry">
                  {user?.name.charAt(0)}
                </span>
              )}
            </div>
          </div>
          <span className="font-heading font-bold text-xl text-aashi-plum">{user?.name}</span>
          <span className="text-xs text-aashi-plum/60 font-semibold">@{user?.username}</span>

          {user?.partnerName && (
            <div className="mt-3 flex items-center gap-1.5 px-3 py-1 rounded-full bg-aashi-pink/40 text-aashi-berry text-xs font-bold">
              <Heart className="w-3.5 h-3.5 fill-aashi-berry" />
              <span>Partnered with {user.partnerName}</span>
            </div>
          )}
        </div>

        {savedSuccess && (
          <div className="p-3 mb-4 rounded-xl bg-emerald-50 text-emerald-800 text-xs font-bold flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-600" />
            <span>Profile updated successfully!</span>
          </div>
        )}

        {/* Edit Form */}
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-aashi-plum uppercase mb-1">Display Name</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full px-4 py-2.5 rounded-2xl border border-aashi-pink bg-white text-sm outline-none focus:ring-2 focus:ring-aashi-berry"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-aashi-plum uppercase mb-1">Relationship Bio / Status</label>
            <textarea
              rows={2}
              value={bio}
              onChange={e => setBio(e.target.value)}
              placeholder="Love hard. Play harder. 💕"
              className="w-full px-4 py-2.5 rounded-2xl border border-aashi-pink bg-white text-sm outline-none focus:ring-2 focus:ring-aashi-berry"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-aashi-plum uppercase mb-1">Avatar Image URL</label>
            <input
              type="url"
              value={avatar}
              onChange={e => setAvatar(e.target.value)}
              placeholder="https://api.dicebear.com/7.x/adventurer/svg?seed=Romeo"
              className="w-full px-4 py-2.5 rounded-2xl border border-aashi-pink bg-white text-sm outline-none focus:ring-2 focus:ring-aashi-berry"
            />
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-aashi-berry to-aashi-lavender text-white font-heading font-bold text-sm shadow-neon hover:opacity-95 transition-all flex items-center justify-center gap-2"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>SAVE CHANGES</span>}
          </button>
        </form>
      </div>
    </div>
  );
};
